// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { readFile } from "node:fs/promises";
import { Guards, Is } from "@twin.org/core";
import type { IJsonSchema } from "@twin.org/data-core";
import { nameof } from "@twin.org/nameof";
import { SchemaIndexBuilder } from "./schemaIndexBuilder.js";
import type { IEffectiveSchemaNode } from "../models/IEffectiveSchemaNode.js";
import type { IFillScope } from "../models/IFillScope.js";
import type { ISemanticIndex } from "../models/ISemanticIndex.js";
import type { ISemanticIndexEntry } from "../models/ISemanticIndexEntry.js";
import type { ITransformerHooks } from "../models/ITransformerHooks.js";
import type { IValueHookContext } from "../models/IValueHookContext.js";

/**
 * Fills a document conforming to a semantic target schema with the values of
 * a source document, matching fields through the semantic index built from
 * the annotated source schema.
 *
 * Warning: AI authored and not reviewed in depth
 */
export class SchemaFiller {
	/**
	 * Keyword holding the entity type FQN.
	 * @internal
	 */
	private static readonly _TYPE_KEY: string = "x-json-ld-type";

	/**
	 * Keyword holding the property FQN or FQN chain.
	 * @internal
	 */
	private static readonly _PROPERTY_KEY: string = "x-json-ld-property";

	/**
	 * Fallback extraction of the type FQN from description lines.
	 * @internal
	 */
	private static readonly _TYPE_REGEX: RegExp = /x-json-ld-type:\s*"?([^\s"]+)/;

	/**
	 * Fallback extraction of the property FQN from description lines.
	 * @internal
	 */
	private static readonly _PROPERTY_REGEX: RegExp = /x-json-ld-property:\s*"?([^\s"]+)/;

	/**
	 * Index entry collecting annotated properties above the first entity.
	 * @internal
	 */
	private static readonly _ROOT_ENTRY: string = "@root";

	/**
	 * Index entry collecting syntactic target-field mappings.
	 * @internal
	 */
	private static readonly _FIELDS_ENTRY: string = "@fields";

	/**
	 * Source data field carrying the extracted document conventions.
	 * @internal
	 */
	private static readonly _DOCUMENT_CONVENTIONS_KEY: string = "document_conventions";

	/**
	 * The JSON-LD vocabulary used to derive FQNs for unannotated properties.
	 * @internal
	 */
	private static readonly _VOCABULARY_BASE: string = "https://vocabulary.uncefact.org/";

	/**
	 * The value emitted for `@context` properties.
	 * @internal
	 */
	private static readonly _JSONLD_CONTEXT_VALUE: string = "https://vocabulary.uncefact.org/";

	/**
	 * Fetched JSON-LD contexts, term to IRI, cached per context URL.
	 * @internal
	 */
	private static readonly _CONTEXT_CACHE = new Map<
		string,
		{ [term: string]: string } | undefined
	>();

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<SchemaFiller>();

	/**
	 * The semantic index of the source schema.
	 * @internal
	 */
	private _index: ISemanticIndex;

	/**
	 * The source data document.
	 * @internal
	 */
	private _data: { [key: string]: unknown };

	/**
	 * Resolves a `$ref` to its schema, when supplied.
	 * @internal
	 */
	private _refResolver?: (ref: string) => Promise<IJsonSchema | undefined>;

	/**
	 * Cache of resolved `$ref`s for the current run (undefined = unresolvable).
	 * @internal
	 */
	private _refCache: Map<string, IJsonSchema | undefined>;

	/**
	 * The target fields that could not be filled.
	 * @internal
	 */
	private _unfilled: { path: string; required: boolean; reason: string }[];

	/**
	 * The source paths whose values were consumed.
	 * @internal
	 */
	private _consumed: Set<string>;

	/**
	 * The value hooks for the current run.
	 * @internal
	 */
	private _hooks?: ITransformerHooks;

	/**
	 * The document conventions extracted with the source document.
	 * @internal
	 */
	private _documentConventions?: { [key: string]: unknown };

	/**
	 * Create a new instance of SchemaFiller.
	 */
	constructor() {
		this._index = {};
		this._data = {};
		this._refCache = new Map<string, IJsonSchema | undefined>();
		this._unfilled = [];
		this._consumed = new Set<string>();
	}

	/**
	 * Fill a semantic target schema from a source document.
	 * @param sourceSchema The annotated source JSON schema.
	 * @param sourceData The source data document.
	 * @param targetSchema The semantic target JSON schema.
	 * @param refResolver Resolves a `$ref` to its schema, called lazily the
	 * first time each reference is encountered.
	 * @param hooks Value hooks invoked when target leaves are filled.
	 * @returns The generated document and a report string for debugging.
	 */
	public async fill(
		sourceSchema: IJsonSchema,
		sourceData: { [key: string]: unknown },
		targetSchema: IJsonSchema,
		refResolver?: (ref: string) => Promise<IJsonSchema | undefined>,
		hooks?: ITransformerHooks
	): Promise<{ document: { [key: string]: unknown }; report: string }> {
		Guards.object<IJsonSchema>(this.CLASS_NAME, nameof(sourceSchema), sourceSchema);
		Guards.object<{ [key: string]: unknown }>(this.CLASS_NAME, nameof(sourceData), sourceData);
		Guards.object<IJsonSchema>(this.CLASS_NAME, nameof(targetSchema), targetSchema);

		this._index = new SchemaIndexBuilder().build(sourceSchema);
		this._data = sourceData;
		this._refResolver = refResolver;
		this._hooks = hooks;
		const conventions = sourceData[SchemaFiller._DOCUMENT_CONVENTIONS_KEY];
		this._documentConventions = Is.object<{ [key: string]: unknown }>(conventions)
			? conventions
			: undefined;
		this._refCache = new Map<string, IJsonSchema | undefined>();
		this._unfilled = [];
		this._consumed = new Set<string>();

		const root = this._index[SchemaFiller._ROOT_ENTRY] ?? { properties: {} };
		const filled = await this.fillNode(
			targetSchema,
			undefined,
			this.scopesFor(root, []),
			"",
			true,
			new Set<string>(),
			undefined
		);
		const filledValue = filled?.value;
		const document = Is.object<{ [key: string]: unknown }>(filledValue) ? filledValue : {};

		const unconsumed = this.leafPaths(sourceData, "", []).filter(p => !this._consumed.has(p));
		return { document, report: this.buildReport(unconsumed) };
	}

	/**
	 * Read an annotation: keyword first, description line second.
	 * @param node The schema node.
	 * @param key The annotation keyword.
	 * @param regex The description-line fallback regex.
	 * @returns The FQN (or FQN chain), or undefined.
	 * @internal
	 */
	private annotation(node: IJsonSchema, key: string, regex: RegExp): string | string[] | undefined {
		if (Is.string(node[key]) || Is.array<string>(node[key])) {
			return node[key];
		}
		if (Is.string(node.description)) {
			return regex.exec(node.description)?.[1];
		}
	}

	/**
	 * Parse an index JSON path into segments ("[*]" marks array items).
	 * @param path The JSON path, e.g. `$.lots[*].lot_reference`.
	 * @returns The segments.
	 * @internal
	 */
	private parsePath(path: string): string[] {
		const segments: string[] = [];
		for (const part of path.replace(/^\$\.?/, "").split(".")) {
			if (part !== "") {
				const [name, ...stars] = part.split("[*]");
				if (name) {
					segments.push(name);
				}
				for (let i = 0; i < stars.length; i++) {
					segments.push("[*]");
				}
			}
		}
		return segments;
	}

	/**
	 * Get the parsed paths of an index slot.
	 * @param slot The slot value (a path or array of paths).
	 * @returns The parsed paths.
	 * @internal
	 */
	private slotPaths(slot: string | string[]): string[][] {
		return (Is.array<string>(slot) ? slot : [slot]).map(p => this.parsePath(p));
	}

	/**
	 * Materialize a schema path against a concrete context: the context must
	 * be a prefix (numbers matching "[*]") and no "[*]" may remain after it.
	 * @param segments The path segments.
	 * @param context The concrete context path.
	 * @returns The concrete path, or undefined.
	 * @internal
	 */
	private materialize(
		segments: string[],
		context: (string | number)[]
	): (string | number)[] | undefined {
		if (segments.length < context.length) {
			return undefined;
		}
		const concrete: (string | number)[] = [];
		for (let i = 0; i < segments.length; i++) {
			if (i < context.length) {
				if (segments[i] === context[i] || (segments[i] === "[*]" && Is.number(context[i]))) {
					concrete.push(context[i]);
				} else {
					return undefined;
				}
			} else if (segments[i] === "[*]") {
				return undefined;
			} else {
				concrete.push(segments[i]);
			}
		}
		return concrete;
	}

	/**
	 * Read a value from the source data at a concrete path.
	 * @param concrete The concrete path segments.
	 * @returns The value, or undefined.
	 * @internal
	 */
	private getData(concrete: (string | number)[]): unknown {
		let value: unknown = this._data;
		for (const segment of concrete) {
			if (Is.array(value) && Is.number(segment)) {
				value = value[segment];
			} else if (Is.object<IJsonSchema>(value) && Is.string(segment)) {
				value = value[segment];
			} else {
				return undefined;
			}
		}
		return value;
	}

	/**
	 * Flatten a target schema node: follow `$id` `$ref`s and merge combinator
	 * branches. Unresolvable refs are ignored.
	 * @param node The node to flatten.
	 * @param seenRefs The `$ref`s already expanded on this branch, so cyclic
	 * schema graphs terminate.
	 * @returns The effective node view.
	 * @internal
	 */
	private async resolveEffective(
		node: unknown,
		seenRefs: Set<string>
	): Promise<IEffectiveSchemaNode> {
		const eff: IEffectiveSchemaNode = { properties: {}, required: new Set() };
		await this.mergeEffective(eff, node, seenRefs);
		return eff;
	}

	/**
	 * Merge one node into an effective view.
	 * @param eff The effective view being built.
	 * @param node The node to merge.
	 * @param seen The `$ref`s already merged.
	 * @param followRef Whether to resolve the node's own top-level `$ref`.
	 * @internal
	 */
	private async mergeEffective(
		eff: IEffectiveSchemaNode,
		node: unknown,
		seen: Set<string>,
		followRef: boolean = true
	): Promise<void> {
		if (!Is.object<IJsonSchema>(node)) {
			return;
		}
		if (Is.undefined(eff.propertyFqn)) {
			eff.propertyFqn = this.annotation(
				node,
				SchemaFiller._PROPERTY_KEY,
				SchemaFiller._PROPERTY_REGEX
			);
		}
		if (Is.undefined(eff.typeFqn)) {
			const typeFqn = this.annotation(node, SchemaFiller._TYPE_KEY, SchemaFiller._TYPE_REGEX);
			if (Is.string(typeFqn)) {
				eff.typeFqn = typeFqn;
			}
		}
		if (!Is.undefined(node.const) && Is.undefined(eff.const)) {
			eff.const = node.const;
		}
		if (!Is.undefined(node.type) && Is.undefined(eff.type)) {
			eff.type = node.type;
		}
		if (Is.string(node.format) && Is.undefined(eff.format)) {
			eff.format = node.format;
		}
		if (Is.object(node.items) && Is.undefined(eff.items)) {
			eff.items = node.items;
		}
		if (Is.object<IJsonSchema>(node.properties)) {
			for (const [name, child] of Object.entries(node.properties)) {
				if (!(name in eff.properties)) {
					eff.properties[name] = child;
				}
			}
		}
		if (Is.array<string>(node.required)) {
			for (const name of node.required) {
				eff.required.add(name);
			}
		}
		if (followRef && Is.string(node.$ref) && !seen.has(node.$ref)) {
			const resolved = await this.resolveRef(node.$ref);
			if (!Is.undefined(resolved)) {
				seen.add(node.$ref);
				await this.mergeEffective(eff, resolved, seen);
			}
		}
		for (const combinator of ["allOf", "anyOf", "oneOf"]) {
			if (Is.array(node[combinator])) {
				for (const branch of node[combinator]) {
					// A branch that is itself a $ref is a validation base
					// type, not content: merge its inline keywords only.
					await this.mergeEffective(eff, branch, seen, false);
				}
			}
		}
	}

	/**
	 * Resolve a `$ref` through the supplied resolver, caching the outcome so
	 * each reference is only looked up once per run.
	 * @param ref The `$ref` value.
	 * @returns The schema, or undefined when unresolvable.
	 * @internal
	 */
	private async resolveRef(ref: string): Promise<IJsonSchema | undefined> {
		if (!this._refCache.has(ref)) {
			this._refCache.set(ref, await this._refResolver?.(ref));
		}
		return this._refCache.get(ref);
	}

	/**
	 * Build the lookup scopes for an entry: the entry itself plus, when its
	 * type has a pinned (type-keyed) entry, that pinned entry.
	 * @param entry The index entry.
	 * @param context The concrete context path of the entity value.
	 * @returns The scopes.
	 * @internal
	 */
	private scopesFor(entry: ISemanticIndexEntry, context: (string | number)[]): IFillScope[] {
		const scopes: IFillScope[] = [{ entry, context }];
		const pinned = Is.stringValue(entry.type) ? this._index[entry.type] : undefined;
		if (!Is.undefined(pinned) && pinned !== entry) {
			scopes.push({ entry: pinned, context });
		}
		return scopes;
	}

	/**
	 * Find the concrete data path of a syntactic `x-json-field` mapping for a
	 * target field name, resolved against the current context.
	 * @param propertyName The target field name.
	 * @param scopes The current lookup scopes.
	 * @returns The concrete path, or undefined.
	 * @internal
	 */
	private findFieldPath(
		propertyName: string | undefined,
		scopes: IFillScope[]
	): (string | number)[] | undefined {
		const fields = this._index[SchemaFiller._FIELDS_ENTRY];
		if (Is.undefined(fields) || !Is.stringValue(propertyName)) {
			return undefined;
		}
		return this.findValuePath(propertyName, [{ entry: fields, context: scopes[0]?.context ?? [] }]);
	}

	/**
	 * Find the concrete data path of a property FQN in the given scopes.
	 * @param fqn The property FQN.
	 * @param scopes The lookup scopes.
	 * @returns The concrete path, or undefined.
	 * @internal
	 */
	private findValuePath(
		fqn: string | undefined,
		scopes: IFillScope[]
	): (string | number)[] | undefined {
		if (!Is.stringValue(fqn)) {
			return undefined;
		}
		for (const { entry, context } of scopes) {
			const slot = entry.properties[fqn];
			if (!Is.undefined(slot)) {
				// Every path is tried relative to the current context before
				// any is retried from the outermost context, otherwise a
				// sibling entity's value could shadow the contextual one.
				const paths = this.slotPaths(slot);
				for (const segments of paths) {
					const concrete = this.materialize(segments, context);
					if (concrete) {
						return concrete;
					}
				}
				for (const segments of paths) {
					const concrete = this.materialize(segments, []);
					if (concrete) {
						return concrete;
					}
				}
			}
		}
	}

	/**
	 * Find the index entry for an entity node, by property FQN first, then by
	 * type FQN; in context first, then globally.
	 * @param fqn The node's property FQN.
	 * @param typeFqn The node's type FQN.
	 * @param scopes The current lookup scopes.
	 * @returns The entry with its concrete context, or undefined.
	 * @internal
	 */
	private findEntry(
		fqn: string | undefined,
		typeFqn: string | undefined,
		scopes: IFillScope[]
	): IFillScope | undefined {
		const context = scopes[0]?.context ?? [];
		const candidates: ISemanticIndexEntry[] = [];
		if (Is.stringValue(fqn) && !Is.undefined(this._index[fqn])) {
			candidates.push(this._index[fqn]);
		}
		if (Is.stringValue(typeFqn)) {
			for (const entry of Object.values(this._index)) {
				if (entry.type === typeFqn && !candidates.includes(entry)) {
					candidates.push(entry);
				}
			}
		}
		for (const entry of candidates) {
			if (entry === scopes[0]?.entry) {
				// Already scoped to this entity: stay transparent.
				return undefined;
			}
			if (Is.undefined(entry.path)) {
				// A pinned or chain-created entry is entered right here, so its
				// property paths resolve relative to the current context.
				return { entry, context };
			}
			// An entry with several locations is ambiguous without a
			// discriminating context: it must not match from an empty one.
			const paths = this.slotPaths(entry.path);
			const ambiguous = paths.length > 1;
			if (!ambiguous || context.length > 0) {
				for (const segments of paths) {
					const concrete = this.materialize(segments, context);
					if (concrete) {
						return { entry, context: concrete };
					}
				}
			}
			if (!ambiguous) {
				for (const segments of paths) {
					const concrete = this.materialize(segments, []);
					if (concrete) {
						return { entry, context: concrete };
					}
				}
			}
		}
	}

	/**
	 * Coerce a source value to the target node's declared shape.
	 * @param value The source value.
	 * @param eff The effective target node.
	 * @returns The coerced value.
	 * @internal
	 */
	private coerce(value: unknown, eff: IEffectiveSchemaNode): unknown {
		const types = Is.array(eff.type) ? eff.type : [eff.type];
		if (eff.format === "date-time" && Is.string(value) && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return `${value}T00:00:00Z`;
		}
		if (Is.number(value) && types.includes("string") && !types.includes("number")) {
			return String(value);
		}
		return value;
	}

	/**
	 * Record an unfilled target field.
	 * @param targetPath The target field path.
	 * @param required Whether the field is required.
	 * @param reason Why it stayed empty.
	 * @internal
	 */
	private recordUnfilled(targetPath: string, required: boolean, reason: string): void {
		this._unfilled.push({ path: targetPath, required, reason });
	}

	/**
	 * Fill a target schema node.
	 * @param node The target schema node.
	 * @param propertyName The property name holding the node, if any.
	 * @param scopes The current lookup scopes.
	 * @param targetPath The target path, for reporting.
	 * @param required Whether the node is required, for reporting.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 * @param terms The term to IRI map of the enclosing schema's JSON-LD
	 * context, used to derive the FQN of unannotated properties.
	 * @param entityType The type FQN of the nearest enclosing entity.
	 * @returns The value and whether it carries source data, or undefined.
	 * @internal
	 */
	private async fillNode(
		node: unknown,
		propertyName: string | undefined,
		scopes: IFillScope[],
		targetPath: string,
		required: boolean,
		seenRefs: Set<string>,
		terms: { [term: string]: string } | undefined,
		entityType?: string
	): Promise<
		{ value: unknown; hasData: boolean; siblings?: { [key: string]: unknown } } | undefined
	> {
		const branchRefs = new Set(seenRefs);
		const eff = await this.resolveEffective(node, branchRefs);

		if (!Is.undefined(eff.const)) {
			// A verbatim value is only emitted when the target requires it.
			return required ? { value: eff.const, hasData: false } : undefined;
		}
		if (propertyName === "@context") {
			return { value: SchemaFiller._JSONLD_CONTEXT_VALUE, hasData: false };
		}

		// The node's own name belongs to the enclosing schema, so it resolves
		// against the enclosing terms: explicit annotation first, the JSON-LD
		// context second, the vocabulary name as last resort.
		const own = Is.array<string>(eff.propertyFqn) ? eff.propertyFqn.at(-1) : eff.propertyFqn;
		const contextFqn = Is.stringValue(propertyName) ? terms?.[propertyName] : undefined;
		const fqn =
			own ??
			contextFqn ??
			(Is.stringValue(propertyName)
				? `${SchemaFiller._VOCABULARY_BASE}${propertyName}`
				: undefined);

		// A node declaring its own @context switches the term map for its
		// children.
		let childTerms = terms;
		const contextNode = eff.properties["@context"];
		if (!Is.undefined(contextNode)) {
			childTerms = (await this.loadContextTerms(contextNode)) ?? terms;
		}

		if (Object.keys(eff.properties).length > 0) {
			return this.fillObject(
				eff,
				fqn,
				scopes,
				targetPath,
				required,
				branchRefs,
				childTerms,
				entityType
			);
		}
		if (
			!Is.undefined(eff.items) ||
			(Is.array(eff.type) ? eff.type : [eff.type]).includes("array")
		) {
			return this.fillArray(
				eff,
				fqn,
				scopes,
				targetPath,
				required,
				branchRefs,
				childTerms,
				entityType
			);
		}
		return this.fillLeaf(eff, fqn, propertyName, scopes, targetPath, required, entityType);
	}

	/**
	 * Fill an object target node.
	 * @param eff The effective node.
	 * @param fqn The node's property FQN.
	 * @param scopes The current lookup scopes.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 * @param terms The term to IRI map for the node's children.
	 * @param entityType The type FQN of the nearest enclosing entity; the
	 * node's own type, when it declares one, replaces it for the children.
	 * @returns The value and whether it carries source data, or undefined.
	 * @internal
	 */
	private async fillObject(
		eff: IEffectiveSchemaNode,
		fqn: string | undefined,
		scopes: IFillScope[],
		targetPath: string,
		required: boolean,
		seenRefs: Set<string>,
		terms: { [term: string]: string } | undefined,
		entityType?: string
	): Promise<{ value: unknown; hasData: boolean } | undefined> {
		const match = this.findEntry(fqn, eff.typeFqn, scopes);
		if (Is.undefined(match)) {
			// A shape mismatch: the FQN addresses a scalar source value, so
			// descending transparently would leak unrelated context values.
			const slotPath = this.findValuePath(fqn, scopes);
			if (!Is.undefined(slotPath)) {
				const slotValue = this.getData(slotPath);
				if (!Is.empty(slotValue) && !Is.object(slotValue) && !Is.array(slotValue)) {
					this.recordUnfilled(targetPath, required, "source value is not an entity");
					return undefined;
				}
			}
		}
		const childScopes = match ? this.scopesFor(match.entry, match.context) : scopes;
		const childEntityType = eff.typeFqn ?? entityType;

		const result: { [key: string]: unknown } = {};
		const pendingSiblings: { [key: string]: unknown } = {};
		let hasData = false;
		for (const [name, child] of Object.entries(eff.properties)) {
			const childPath = targetPath === "" ? name : `${targetPath}.${name}`;
			const filled = await this.fillNode(
				child,
				name,
				childScopes,
				childPath,
				eff.required.has(name),
				seenRefs,
				terms,
				childEntityType
			);
			if (!Is.undefined(filled)) {
				result[name] = filled.value;
				hasData ||= filled.hasData;
				if (!Is.undefined(filled.siblings)) {
					Object.assign(pendingSiblings, filled.siblings);
				}
			}
		}

		// Siblings hung by hooks land beside the elements they came from; a
		// property filled from the schema is never overwritten.
		for (const [name, value] of Object.entries(pendingSiblings)) {
			if (!(name in result)) {
				result[name] = value;
				hasData = true;
			}
		}

		if (!hasData) {
			this.recordUnfilled(targetPath, required, "no matching source data");
			return undefined;
		}
		return { value: result, hasData };
	}

	/**
	 * Fill an array target node.
	 * @param eff The effective node.
	 * @param fqn The node's property FQN.
	 * @param scopes The current lookup scopes.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 * @param terms The term to IRI map for the array items.
	 * @param entityType The type FQN of the nearest enclosing entity.
	 * @returns The value and whether it carries source data, or undefined.
	 * @internal
	 */
	private async fillArray(
		eff: IEffectiveSchemaNode,
		fqn: string | undefined,
		scopes: IFillScope[],
		targetPath: string,
		required: boolean,
		seenRefs: Set<string>,
		terms: { [term: string]: string } | undefined,
		entityType?: string
	): Promise<{ value: unknown; hasData: boolean } | undefined> {
		const itemsEff = Is.undefined(eff.items)
			? undefined
			: await this.resolveEffective(eff.items, new Set(seenRefs));
		const match = this.findEntry(fqn, itemsEff?.typeFqn, scopes);
		if (Is.undefined(match) || Is.undefined(match.entry.path)) {
			this.recordUnfilled(targetPath, required, "no matching source entry");
			return undefined;
		}

		// An entry matched by its items' type points at the elements; the
		// array itself is one level up.
		const matchedByFqn = Is.stringValue(fqn) && !Is.undefined(this._index[fqn]);
		const arrayContext =
			match.context.length > 0 && !matchedByFqn && Is.number(match.context.at(-1))
				? match.context.slice(0, -1)
				: match.context;

		const source = this.getData(arrayContext);
		if (Is.empty(source)) {
			this.recordUnfilled(targetPath, required, `source ${arrayContext.join(".") || "$"} is null`);
			return undefined;
		}

		const elements = Is.array(source)
			? [...source.keys()].map(i => [...arrayContext, i])
			: [arrayContext];
		const result: unknown[] = [];
		for (let i = 0; i < elements.length; i++) {
			const filled = await this.fillNode(
				eff.items ?? {},
				undefined,
				this.scopesFor(match.entry, elements[i]),
				`${targetPath}[${i}]`,
				false,
				seenRefs,
				terms,
				entityType
			);
			if (!Is.undefined(filled)) {
				result.push(filled.value);
			}
		}
		if (result.length === 0) {
			this.recordUnfilled(targetPath, required, "no element could be filled");
			return undefined;
		}
		return { value: result, hasData: true };
	}

	/**
	 * Fill a leaf target node.
	 * @param eff The effective node.
	 * @param fqn The node's property FQN.
	 * @param propertyName The property name holding the node, if any.
	 * @param scopes The current lookup scopes.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @param entityType The type FQN of the nearest enclosing entity.
	 * @returns The value and whether it carries source data, or undefined.
	 * @internal
	 */
	private async fillLeaf(
		eff: IEffectiveSchemaNode,
		fqn: string | undefined,
		propertyName: string | undefined,
		scopes: IFillScope[],
		targetPath: string,
		required: boolean,
		entityType?: string
	): Promise<
		{ value: unknown; hasData: boolean; siblings?: { [key: string]: unknown } } | undefined
	> {
		// An explicit syntactic mapping to this exact field name wins over
		// semantic matching.
		const concrete = this.findFieldPath(propertyName, scopes) ?? this.findValuePath(fqn, scopes);
		if (Is.undefined(concrete)) {
			this.recordUnfilled(targetPath, required, "no matching source field");
			return undefined;
		}
		const value = this.getData(concrete);
		if (Is.empty(value)) {
			this.recordUnfilled(targetPath, required, `source field ${concrete.join(".")} is null`);
			return undefined;
		}
		this._consumed.add(concrete.join("."));

		const sourceField = concrete.at(-1);
		const hook =
			(Is.stringValue(sourceField) ? this._hooks?.bySourceField?.[sourceField] : undefined) ??
			(Is.stringValue(fqn) ? this._hooks?.byProperty?.[fqn] : undefined) ??
			(Is.stringValue(eff.format) ? this._hooks?.byFormat?.[eff.format] : undefined);
		if (Is.function(hook)) {
			const parent = this.getData(concrete.slice(0, -1));
			const siblings: { [key: string]: unknown } = {};
			const context: IValueHookContext = {
				propertyName,
				fqn,
				entityType,
				targetPath,
				sourcePath: concrete.join("."),
				type: eff.type,
				format: eff.format,
				documentConventions: this._documentConventions,
				sourceObject: Is.object<{ [key: string]: unknown }>(parent) ? parent : undefined,
				setSibling: (name: string, sibling: unknown): void => {
					siblings[name] = sibling;
				}
			};
			const hooked = await hook(value, context);
			if (Is.undefined(hooked)) {
				this.recordUnfilled(targetPath, required, "suppressed by hook");
				return undefined;
			}
			return {
				value: hooked,
				hasData: true,
				siblings: Object.keys(siblings).length > 0 ? siblings : undefined
			};
		}
		return { value: this.coerce(value, eff), hasData: true };
	}

	/**
	 * Collect the paths of all non-null leaf values in a data document.
	 * @param data The data document.
	 * @param path The current path prefix.
	 * @param paths The accumulator.
	 * @returns The collected paths.
	 * @internal
	 */
	private leafPaths(data: unknown, path: string, paths: string[]): string[] {
		if (Is.array(data)) {
			for (let i = 0; i < data.length; i++) {
				this.leafPaths(data[i], path === "" ? String(i) : `${path}.${i}`, paths);
			}
		} else if (Is.object<IJsonSchema>(data)) {
			for (const [name, value] of Object.entries(data)) {
				this.leafPaths(value, path === "" ? name : `${path}.${name}`, paths);
			}
		} else if (!Is.empty(data)) {
			paths.push(path);
		}
		return paths;
	}

	/**
	 * Load the JSON-LD context declared as an `@context` const, as a term to
	 * IRI map, cached per context URL.
	 * @param contextNode The `@context` schema node.
	 * @returns The term map, or undefined when there is no fetchable context.
	 * @internal
	 */
	private async loadContextTerms(
		contextNode: unknown
	): Promise<{ [term: string]: string } | undefined> {
		const contextEff = await this.resolveEffective(contextNode, new Set());
		const url = Is.stringValue(contextEff.const) ? contextEff.const.trim() : undefined;
		if (!Is.stringValue(url) || !/^https?:/.test(url)) {
			return undefined;
		}
		if (!SchemaFiller._CONTEXT_CACHE.has(url)) {
			SchemaFiller._CONTEXT_CACHE.set(
				url,
				(await this.localContextTerms(url)) ?? (await this.fetchContextTerms(url))
			);
		}
		return SchemaFiller._CONTEXT_CACHE.get(url);
	}

	/**
	 * Load a JSON-LD context from the package's `ld-contexts` folder, where a
	 * local copy is stored under the file name of its URL. A local copy wins
	 * over the online document.
	 * @param url The context URL, e.g. `https://unvtd.unece.org/bill-of-lading-context.json`.
	 * @returns The term map, or undefined when there is no local copy.
	 * @internal
	 */
	private async localContextTerms(url: string): Promise<{ [term: string]: string } | undefined> {
		const name = new URL(url).pathname.split("/").at(-1);
		if (!Is.stringValue(name)) {
			return undefined;
		}
		// The folder sits at the package root: three levels up from the
		// compiled dist/es/services, two from src/services when run from source.
		for (const relative of ["../../../ld-contexts/", "../../ld-contexts/"]) {
			try {
				const body: unknown = JSON.parse(
					await readFile(new URL(`${relative}${name}`, import.meta.url), "utf8")
				);
				return this.termsFromContextBody(body);
			} catch {
				// No copy at this root: try the next, then fall back to the fetch.
			}
		}
	}

	/**
	 * Fetch a JSON-LD context document and flatten its term definitions to a
	 * term to IRI map, expanding prefixed values.
	 * @param url The context URL.
	 * @returns The term map, or undefined when the fetch or parse fails.
	 * @internal
	 */
	private async fetchContextTerms(url: string): Promise<{ [term: string]: string } | undefined> {
		try {
			const response = await fetch(url, {
				headers: { accept: "application/ld+json, application/json" },
				signal: AbortSignal.timeout(10000)
			});
			if (!response.ok) {
				return undefined;
			}
			return this.termsFromContextBody(await response.json());
		} catch {
			return undefined;
		}
	}

	/**
	 * Flatten a JSON-LD context document to a term to IRI map, expanding
	 * prefixed values.
	 * @param body The parsed context document.
	 * @returns The term map, or undefined when the document carries no context.
	 * @internal
	 */
	private termsFromContextBody(body: unknown): { [term: string]: string } | undefined {
		const context = Is.object<{ [key: string]: unknown }>(body) ? body["@context"] : undefined;
		if (!Is.object<{ [key: string]: unknown }>(context)) {
			return undefined;
		}
		const terms: { [term: string]: string } = {};
		for (const [term, value] of Object.entries(context)) {
			if (!term.startsWith("@")) {
				const iri = this.expandContextValue(value, context);
				if (Is.stringValue(iri)) {
					terms[term] = iri;
				}
			}
		}
		return terms;
	}

	/**
	 * Expand one JSON-LD context term definition to a full IRI.
	 * @param value The term definition (an IRI, a prefixed name or an object).
	 * @param context The enclosing context, for prefix resolution.
	 * @returns The IRI, or undefined.
	 * @internal
	 */
	private expandContextValue(
		value: unknown,
		context: { [key: string]: unknown }
	): string | undefined {
		if (Is.object<{ [key: string]: unknown }>(value)) {
			return this.expandContextValue(value["@id"], context);
		}
		if (!Is.stringValue(value)) {
			return undefined;
		}
		if (/^https?:/.test(value)) {
			return value;
		}
		const colon = value.indexOf(":");
		if (colon > 0) {
			const prefix = context[value.slice(0, colon)];
			if (Is.stringValue(prefix) && /^https?:/.test(prefix)) {
				return `${prefix}${value.slice(colon + 1)}`;
			}
		}
	}

	/**
	 * Build the debug report of unfilled target fields and unconsumed source
	 * fields.
	 * @param unconsumed The unconsumed source paths.
	 * @returns The report, empty when there is nothing to report.
	 * @internal
	 */
	private buildReport(unconsumed: string[]): string {
		const lines: string[] = [];
		if (this._unfilled.length > 0) {
			lines.push("Unfilled target fields:");
			for (const { path, required, reason } of this._unfilled) {
				lines.push(`  ${required ? "[required] " : ""}${path === "" ? "<root>" : path}: ${reason}`);
			}
		}
		if (unconsumed.length > 0) {
			if (lines.length > 0) {
				lines.push("");
			}
			lines.push("Source fields never consumed:");
			for (const path of unconsumed) {
				lines.push(`  ${path}`);
			}
		}
		return lines.join("\n");
	}
}
