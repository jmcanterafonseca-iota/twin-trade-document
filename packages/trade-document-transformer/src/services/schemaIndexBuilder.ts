// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { Guards, Is } from "@twin.org/core";
import type { IJsonSchema } from "@twin.org/data-core";
import { nameof } from "@twin.org/nameof";
import type { ISemanticIndex } from "../models/ISemanticIndex.js";
import type { ISemanticIndexEntry } from "../models/ISemanticIndexEntry.js";

/**
 * Builds a semantic index from a JSON-LD annotated JSON schema, keyed by the
 * `x-json-ld-property` FQN of each entity property. Property annotations may
 * be a single FQN or an array of FQNs denoting the semantic nesting chain; a
 * leaf carrying only a type is indexed under an entry keyed by that type.
 * An `x-json-field` annotation adds a syntactic mapping — target field name
 * to source path — collected under the reserved `@fields` entry.
 *
 * Warning: AI authored and not reviewed in depth
 */
export class SchemaIndexBuilder {
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
	 * Entry collecting annotated properties above the first entity.
	 * @internal
	 */
	private static readonly _ROOT_ENTRY: string = "@root";

	/**
	 * Keyword holding the direct target field name (syntactic mapping).
	 * @internal
	 */
	private static readonly _FIELD_KEY: string = "x-json-field";

	/**
	 * Fallback extraction of the target field name from description lines.
	 * @internal
	 */
	private static readonly _FIELD_REGEX: RegExp = /x-json-field:\s*"?([^\s"]+)/;

	/**
	 * Entry collecting syntactic mappings: target field name to source path.
	 * @internal
	 */
	private static readonly _FIELDS_ENTRY: string = "@fields";

	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<SchemaIndexBuilder>();

	/**
	 * Build the semantic index for an annotated schema.
	 * @param annotatedSchema The JSON schema annotated with x-json-ld keywords.
	 * @returns The semantic index.
	 */
	public build(annotatedSchema: { [key: string]: unknown }): ISemanticIndex {
		Guards.object<IJsonSchema>(this.CLASS_NAME, nameof(annotatedSchema), annotatedSchema);

		const index: ISemanticIndex = {};
		const dereffed = this.deref(annotatedSchema, annotatedSchema, new Set());
		if (dereffed) {
			const typeFqn = this.annotation(
				dereffed.node,
				SchemaIndexBuilder._TYPE_KEY,
				SchemaIndexBuilder._TYPE_REGEX
			);
			const root = this.openEntry(
				index,
				SchemaIndexBuilder._ROOT_ENTRY,
				Is.string(typeFqn) ? typeFqn : undefined,
				"$"
			);
			this.walkChildren(annotatedSchema, dereffed.node, "$", root, index, dereffed.seenRefs);
		}
		return index;
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
	 * Resolve an internal `#/...` JSON pointer.
	 * @param schema The schema owning the pointer.
	 * @param ref The `$ref` value.
	 * @returns The referenced node, or undefined.
	 * @internal
	 */
	private resolvePointer(schema: IJsonSchema, ref: string): unknown {
		let node: unknown = schema;
		for (const segment of ref.replace(/^#\//, "").split("/")) {
			if (!Is.object<IJsonSchema>(node)) {
				return undefined;
			}
			node = node[decodeURIComponent(segment.replaceAll("~1", "/").replaceAll("~0", "~"))];
		}
		return node;
	}

	/**
	 * Resolve a node's local `$ref`, merging sibling keywords over the target.
	 * @param schema The schema owning the pointers.
	 * @param node The node to dereference.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 * @returns The dereferenced node and updated seen set, or undefined on a cycle.
	 * @internal
	 */
	private deref(
		schema: IJsonSchema,
		node: IJsonSchema,
		seenRefs: Set<string>
	): { node: IJsonSchema; seenRefs: Set<string> } | undefined {
		if (Is.string(node.$ref) && node.$ref.startsWith("#/")) {
			if (seenRefs.has(node.$ref)) {
				return undefined;
			}
			const resolved = this.resolvePointer(schema, node.$ref);
			if (Is.object<IJsonSchema>(resolved)) {
				seenRefs = new Set([...seenRefs, node.$ref]);
				const rest = { ...node };
				delete rest.$ref;
				node = { ...resolved, ...rest };
			}
		}
		return { node, seenRefs };
	}

	/**
	 * Check whether a node has structure of its own (properties or items).
	 * @param node The dereferenced node.
	 * @returns True when the node is not a leaf.
	 * @internal
	 */
	private hasStructure(node: IJsonSchema): boolean {
		return Is.object(node.properties) || Is.object(node.items);
	}

	/**
	 * Combine a path into a slot, turning it into an array on collision.
	 * @param current The current slot value.
	 * @param path The JSON path to add.
	 * @returns The new slot value.
	 * @internal
	 */
	private combinePaths(current: string | string[] | undefined, path: string): string | string[] {
		if (Is.undefined(current)) {
			return path;
		}
		if (Is.array<string>(current)) {
			if (!current.includes(path)) {
				current.push(path);
			}
			return current;
		}
		return current === path ? current : [current, path];
	}

	/**
	 * Get or create the entry for a property FQN.
	 * @param index The index being built.
	 * @param fqn The property FQN (or `@root`).
	 * @param type The entity type FQN, if known.
	 * @param path The JSON path of the entity value.
	 * @returns The entry.
	 * @internal
	 */
	private openEntry(
		index: ISemanticIndex,
		fqn: string,
		type: string | undefined,
		path: string
	): ISemanticIndexEntry {
		index[fqn] ??= { properties: {} };
		const entry = index[fqn];
		if (Is.stringValue(type) && Is.undefined(entry.type)) {
			entry.type = type;
		}
		entry.path = this.combinePaths(entry.path, path);
		return entry;
	}

	/**
	 * Walk the structure beneath an entity, collecting its subproperties.
	 * @param schema The schema owning the pointers.
	 * @param node The dereferenced node to walk.
	 * @param path The JSON path of the node.
	 * @param entry The entity entry being filled.
	 * @param index The index being built.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 * @internal
	 */
	private walkChildren(
		schema: IJsonSchema,
		node: IJsonSchema,
		path: string,
		entry: ISemanticIndexEntry,
		index: ISemanticIndex,
		seenRefs: Set<string>
	): void {
		if (Is.object<IJsonSchema>(node.properties)) {
			for (const [name, child] of Object.entries(node.properties)) {
				this.walk(schema, child, `${path}.${name}`, entry, index, seenRefs);
			}
		}
		if (Is.object(node.items)) {
			this.walk(schema, node.items, `${path}[*]`, entry, index, seenRefs);
		}
		for (const combinator of ["allOf", "anyOf", "oneOf"]) {
			if (Is.array(node[combinator])) {
				for (const branch of node[combinator]) {
					this.walk(schema, branch, path, entry, index, seenRefs);
				}
			}
		}
	}

	/**
	 * Walk a schema node under an enclosing entity entry.
	 * @param schema The schema owning the pointers.
	 * @param rawNode The node to walk.
	 * @param path The JSON path of the node.
	 * @param entry The enclosing entity entry.
	 * @param index The index being built.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 * @internal
	 */
	private walk(
		schema: IJsonSchema,
		rawNode: unknown,
		path: string,
		entry: ISemanticIndexEntry,
		index: ISemanticIndex,
		seenRefs: Set<string>
	): void {
		if (!Is.object<IJsonSchema>(rawNode)) {
			return;
		}
		const dereffed = this.deref(schema, rawNode, seenRefs);
		if (!dereffed) {
			return;
		}
		const node = dereffed.node;
		seenRefs = dereffed.seenRefs;

		const field = this.annotation(
			node,
			SchemaIndexBuilder._FIELD_KEY,
			SchemaIndexBuilder._FIELD_REGEX
		);
		if (!Is.empty(field)) {
			// A syntactic mapping: the value fills the target field with this
			// exact name, regardless of semantics.
			index[SchemaIndexBuilder._FIELDS_ENTRY] ??= { properties: {} };
			const fields = index[SchemaIndexBuilder._FIELDS_ENTRY];
			for (const name of Is.array<string>(field) ? field : [field]) {
				fields.properties[name] = this.combinePaths(fields.properties[name], path);
			}
		}

		const property = this.annotation(
			node,
			SchemaIndexBuilder._PROPERTY_KEY,
			SchemaIndexBuilder._PROPERTY_REGEX
		);
		const typeAnnotation = this.annotation(
			node,
			SchemaIndexBuilder._TYPE_KEY,
			SchemaIndexBuilder._TYPE_REGEX
		);
		const type = Is.string(typeAnnotation) ? typeAnnotation : undefined;

		if (!Is.empty(property)) {
			const chain = Is.array<string>(property) ? property : [property];
			const last = chain[chain.length - 1];
			if (chain.length > 1) {
				// A chain: the value is a property of the entity addressed by the
				// second-to-last element, wherever the node sits in the tree.
				for (let i = 0; i < chain.length - 1; i++) {
					index[chain[i]] ??= { properties: {} };
				}
				const owner = index[chain[chain.length - 2]];
				owner.properties[last] = this.combinePaths(owner.properties[last], path);
				if (Is.stringValue(type) && !this.hasStructure(node) && Is.undefined(owner.type)) {
					// On a leaf, the type describes the owning entity.
					owner.type = type;
				}
			} else if (Is.stringValue(type) && !this.hasStructure(node)) {
				// A pinned leaf: a property of an entity of the annotated type.
				index[type] ??= { type, properties: {} };
				const owner = index[type];
				owner.properties[last] = this.combinePaths(owner.properties[last], path);
				return;
			} else {
				entry.properties[last] = this.combinePaths(entry.properties[last], path);
			}
			if (this.hasStructure(node)) {
				// An entity subproperty: listed under its parent and opened as
				// its own top-level entry for its children.
				entry = this.openEntry(index, last, type, path);
			}
		}

		this.walkChildren(schema, node, path, entry, index, seenRefs);
	}
}
