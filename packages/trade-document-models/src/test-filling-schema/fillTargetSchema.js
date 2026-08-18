// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Fills a document conforming to a target JSON schema with data taken from a
 * source document, matching fields by their JSON-LD semantics rather than by
 * name or structure.
 *
 * The source schema annotates fields with `x-json-ld-property` (and sometimes
 * `x-json-ld-type`) keywords. The target schema carries the same annotations
 * on description lines of the form `x-json-ld-property: <uri>`. On either
 * side, an unannotated property defaults to
 * `https://vocabulary.uncefact.org/<property-name>` (source names are
 * camel-cased first, so `unit_price` means `unitPrice`).
 *
 * The algorithm walks the target schema keeping a cursor (context) into the
 * source document:
 *
 * - A `const` property is emitted verbatim, no lookup needed.
 * - An object property looks for a source subtree with the same property tag
 *   (e.g. `sellerParty`) or, failing that, the same `x-json-ld-type`; when
 *   found the context descends into it, otherwise the children are resolved
 *   against the current context (so a purely structural wrapper such as
 *   `postalAddress` is transparent).
 * - An array property looks for a source array by property tag or by the
 *   items' entity type (e.g. `LineTradeAgreement`), then fills the item
 *   schema once per source element.
 * - A leaf property looks up its tag among the source fields under the
 *   current context, closest match first. When nothing matches in context, a
 *   source field explicitly pinned to an entity via `x-json-ld-type` may
 *   match from anywhere, provided it is the only candidate.
 * - When an object (e.g. a `MonetaryAmount`) matches a source *leaf*, the
 *   leaf value fills the child named `*Value` and siblings such as
 *   `*Currency`/`*Code` are retried under the leaf's parent using their
 *   suffix as tag (`currency`, `code`).
 *
 * Tags compare case-insensitively; when no exact match exists, a relaxed
 * comparison strips a trailing `DateTime`/`Date`/`Code` so `issueDateTime`
 * still finds a field annotated `issueDate`.
 *
 * `$ref`s in the target schema are resolved against the local schema folder
 * by `$id`; unresolvable (external) refs are ignored. Values are coerced to
 * the target's expectations (numbers to strings, dates to date-times).
 *
 * A report of target fields that could not be filled and source fields that
 * were never consumed is printed to stderr.
 *
 * Usage:
 *   node fillTargetSchema.js [dataFile] [sourceSchemaFile] [targetSchemaFile] [outputFile]
 *
 * Defaults to ./data/extracted-data.json, ./schema/sales_contract.schema.json
 * and ../schemas/TradeAgreement.json, printing the filled document to stdout.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const VOCABULARY_BASE = "https://vocabulary.uncefact.org/";
const SOURCE_PROPERTY_KEY = "x-json-ld-property";
const SOURCE_TYPE_KEY = "x-json-ld-type";
const TARGET_PROPERTY_REGEX = /x-json-ld-property:\s*(\S+)/;
const TARGET_TYPE_REGEX = /x-json-ld-type:\s*(\S+)/;
const JSONLD_CONTEXT_VALUE = "https://vocabulary.uncefact.org/";
const VALUE_OBJECT_SUFFIX_REGEX = /^(.+?)(Value|Currency|Code)$/;

/**
 * Convert a snake_case name to camelCase.
 * @param name The name to convert.
 * @returns The camel-cased name.
 */
function camelCase(name) {
	return name.replace(/[_-]+(\w)/g, (_, c) => c.toUpperCase());
}

/**
 * Normalize a tag for comparison.
 * @param tag The tag URI.
 * @returns The lowercased tag.
 */
function normalizeTag(tag) {
	return tag.toLowerCase();
}

/**
 * Relax a normalized tag by stripping a trailing dateTime/date/code suffix.
 * @param normalizedTag The normalized tag.
 * @returns The relaxed tag.
 */
function relaxTag(normalizedTag) {
	return normalizedTag.replace(/(datetime|date|code)$/, "");
}

/**
 * Resolve an internal `#/$defs/...` JSON pointer.
 * @param schema The schema owning the pointer.
 * @param ref The `$ref` value.
 * @returns The referenced node, or undefined.
 */
function resolvePointer(schema, ref) {
	let node = schema;
	for (const segment of ref.replace(/^#\//, "").split("/")) {
		if (typeof node !== "object" || node === null) {
			return undefined;
		}
		node = node[decodeURIComponent(segment.replaceAll("~1", "/").replaceAll("~0", "~"))];
	}
	return node;
}

/**
 * Build an index of the source schema: every field keyed by its JSON-LD
 * property tag and, separately, by its entity type tag.
 * @param schema The parsed source schema.
 * @returns The index with byTag, relaxedByTag and byType maps.
 */
function buildSourceIndex(schema) {
	const index = { byTag: new Map(), relaxedByTag: new Map(), byType: new Map() };

	/**
	 * Add an entry to a multimap.
	 * @param map The map to add to.
	 * @param key The entry key.
	 * @param entry The entry.
	 */
	function add(map, key, entry) {
		const list = map.get(key) ?? [];
		list.push(entry);
		map.set(key, list);
	}

	/**
	 * Walk a source schema node.
	 * @param node The node to walk.
	 * @param path The data path segments of the node ("[]" marks array items).
	 * @param name The property name holding the node, if any.
	 * @param seenRefs The internal $refs already expanded on this branch.
	 */
	function walk(node, path, name, seenRefs) {
		if (typeof node !== "object" || node === null) {
			return;
		}

		if (typeof node.$ref === "string" && node.$ref.startsWith("#/")) {
			if (seenRefs.has(node.$ref)) {
				return;
			}
			const resolved = resolvePointer(schema, node.$ref);
			if (typeof resolved === "object" && resolved !== null) {
				seenRefs = new Set([...seenRefs, node.$ref]);
				const { $ref, ...rest } = node;
				node = { ...resolved, ...rest };
			}
		}

		const tag = node[SOURCE_PROPERTY_KEY] ?? (name ? `${VOCABULARY_BASE}${camelCase(name)}` : undefined);
		const typeTag = node[SOURCE_TYPE_KEY];
		const hasProperties = typeof node.properties === "object" && node.properties !== null;
		const hasItems = typeof node.items === "object" && node.items !== null;
		const kind = hasProperties ? "object" : hasItems ? "array" : "leaf";
		const entry = { tag, typeTag, path, kind };

		if (tag) {
			add(index.byTag, normalizeTag(tag), entry);
			add(index.relaxedByTag, relaxTag(normalizeTag(tag)), entry);
		}
		if (typeTag) {
			add(index.byType, normalizeTag(typeTag), entry);
		}

		if (hasProperties) {
			for (const [childName, child] of Object.entries(node.properties)) {
				walk(child, [...path, childName], childName, seenRefs);
			}
		}
		if (hasItems) {
			walk(node.items, [...path, "[]"], undefined, seenRefs);
		}
		for (const combinator of ["allOf", "anyOf", "oneOf"]) {
			if (Array.isArray(node[combinator])) {
				for (const branch of node[combinator]) {
					walk(branch, path, name, seenRefs);
				}
			}
		}
	}

	walk(schema, [], undefined, new Set());
	return index;
}

/**
 * Load every JSON schema in the given folders, indexed by `$id`.
 * @param folders The folders to scan.
 * @returns A map from schema $id to parsed schema.
 */
function loadSchemasById(folders) {
	const byId = new Map();
	for (const folder of folders) {
		let entries;
		try {
			entries = readdirSync(folder);
		} catch {
			continue;
		}
		for (const entry of entries) {
			if (!entry.endsWith(".json")) {
				continue;
			}
			try {
				const schema = JSON.parse(readFileSync(join(folder, entry), "utf8"));
				if (typeof schema.$id === "string" && !byId.has(schema.$id)) {
					byId.set(schema.$id, schema);
				}
			} catch {
				// Not a schema file, skip it.
			}
		}
	}
	return byId;
}

/**
 * Flatten a target schema node: follow local `$ref`s and merge combinator
 * branches into a single effective view. Unresolvable refs are ignored.
 * @param node The node to flatten.
 * @param schemasById Local schemas indexed by $id.
 * @returns The effective node view.
 */
function resolveEffective(node, schemasById) {
	const eff = {
		const: undefined,
		type: undefined,
		format: undefined,
		items: undefined,
		properties: {},
		required: new Set(),
		descriptions: []
	};
	const seen = new Set();

	/**
	 * Merge one node into the effective view.
	 * @param n The node to merge.
	 */
	function merge(n) {
		if (typeof n !== "object" || n === null) {
			return;
		}
		if (typeof n.description === "string") {
			eff.descriptions.push(n.description);
		}
		if (n.const !== undefined && eff.const === undefined) {
			eff.const = n.const;
		}
		if (n.type !== undefined && eff.type === undefined) {
			eff.type = n.type;
		}
		if (typeof n.format === "string" && eff.format === undefined) {
			eff.format = n.format;
		}
		if (typeof n.items === "object" && n.items !== null && eff.items === undefined) {
			eff.items = n.items;
		}
		if (typeof n.properties === "object" && n.properties !== null) {
			for (const [name, child] of Object.entries(n.properties)) {
				if (!(name in eff.properties)) {
					eff.properties[name] = child;
				}
			}
		}
		if (Array.isArray(n.required)) {
			for (const name of n.required) {
				eff.required.add(name);
			}
		}
		if (typeof n.$ref === "string" && schemasById.has(n.$ref) && !seen.has(n.$ref)) {
			seen.add(n.$ref);
			merge(schemasById.get(n.$ref));
		}
		for (const combinator of ["allOf", "anyOf", "oneOf"]) {
			if (Array.isArray(n[combinator])) {
				for (const branch of n[combinator]) {
					merge(branch);
				}
			}
		}
	}

	merge(node);
	return eff;
}

/**
 * Extract a tag from description texts using a regex.
 * @param descriptions The description texts to scan.
 * @param regex The extraction regex.
 * @returns The tag, or undefined.
 */
function tagFromDescriptions(descriptions, regex) {
	for (const description of descriptions) {
		const match = regex.exec(description);
		if (match) {
			return match[1];
		}
	}
	return undefined;
}

/**
 * Check whether a candidate schema path lies under a concrete context path,
 * and materialize its concrete form when it does.
 * @param path The candidate path ("[]" marks array items).
 * @param context The concrete context path (numbers for array indices).
 * @returns The concrete path, or undefined when outside the context or
 * ambiguous (an unresolved "[]" remains).
 */
function materialize(path, context) {
	if (path.length < context.length) {
		return undefined;
	}
	const concrete = [];
	for (let i = 0; i < path.length; i++) {
		if (i < context.length) {
			if (path[i] === context[i] || (path[i] === "[]" && typeof context[i] === "number")) {
				concrete.push(context[i]);
			} else {
				return undefined;
			}
		} else {
			if (path[i] === "[]") {
				return undefined;
			}
			concrete.push(path[i]);
		}
	}
	return concrete;
}

/**
 * Read a value from the source data at a concrete path.
 * @param data The source data document.
 * @param concretePath The concrete path segments.
 * @returns The value, or undefined.
 */
function getData(data, concretePath) {
	let value = data;
	for (const segment of concretePath) {
		if (typeof value !== "object" || value === null) {
			return undefined;
		}
		value = value[segment];
	}
	return value;
}

/**
 * The semantic filler: walks the target schema and resolves each field from
 * the source document.
 */
class Filler {
	/**
	 * Create a filler.
	 * @param sourceIndex The source schema index.
	 * @param sourceData The source data document.
	 * @param schemasById Local target schemas indexed by $id.
	 */
	constructor(sourceIndex, sourceData, schemasById) {
		this.index = sourceIndex;
		this.data = sourceData;
		this.schemasById = schemasById;
		this.unfilled = [];
		this.consumed = new Set();
	}

	/**
	 * Find the best source entry for a tag under a context.
	 * The ladder: exact match in context, relaxed match in context, then a
	 * unique global match for fields explicitly pinned with x-json-ld-type.
	 * @param tag The target tag.
	 * @param context The concrete context path.
	 * @param kinds The acceptable source entry kinds.
	 * @returns The entry and its concrete path, or undefined.
	 */
	findEntry(tag, context, kinds) {
		if (!tag) {
			return undefined;
		}
		const normalized = normalizeTag(tag);

		for (const map of [this.index.byTag, this.index.relaxedByTag]) {
			const key = map === this.index.byTag ? normalized : relaxTag(normalized);
			const candidates = [];
			for (const entry of map.get(key) ?? []) {
				if (!kinds.includes(entry.kind)) {
					continue;
				}
				const concrete = materialize(entry.path, context);
				if (concrete) {
					candidates.push({ entry, concrete });
				}
			}
			if (candidates.length > 0) {
				candidates.sort((a, b) => a.concrete.length - b.concrete.length);
				return candidates[0];
			}
		}

		// Global fallback: a field pinned to an entity via x-json-ld-type may
		// be picked up from anywhere, but only when unambiguous.
		for (const map of [this.index.byTag, this.index.relaxedByTag]) {
			const key = map === this.index.byTag ? normalized : relaxTag(normalized);
			const candidates = (map.get(key) ?? []).filter(
				(entry) => kinds.includes(entry.kind) && entry.typeTag && materialize(entry.path, [])
			);
			if (candidates.length === 1) {
				return { entry: candidates[0], concrete: materialize(candidates[0].path, []) };
			}
		}

		return undefined;
	}

	/**
	 * Find a source array for a target array node, by tag or by items type.
	 * @param tag The target property tag.
	 * @param itemTypeTag The x-json-ld-type of the target items, if any.
	 * @param context The concrete context path.
	 * @returns The concrete array path, or undefined.
	 */
	findArray(tag, itemTypeTag, context) {
		const byTag = this.findEntry(tag, context, ["array"]);
		if (byTag) {
			return byTag.concrete;
		}
		if (itemTypeTag) {
			for (const entry of this.index.byType.get(normalizeTag(itemTypeTag)) ?? []) {
				if (entry.path.at(-1) !== "[]") {
					continue;
				}
				const concrete = materialize(entry.path.slice(0, -1), context);
				if (concrete) {
					return concrete;
				}
			}
		}
		return undefined;
	}

	/**
	 * Coerce a source value to the target node's expectations.
	 * @param value The source value.
	 * @param eff The effective target node.
	 * @returns The coerced value.
	 */
	coerce(value, eff) {
		const types = Array.isArray(eff.type) ? eff.type : [eff.type];
		if (eff.format === "date-time" && typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
			return `${value}T00:00:00Z`;
		}
		if (typeof value === "number" && types.includes("string")) {
			return String(value);
		}
		return value;
	}

	/**
	 * Read and consume a source value.
	 * @param concrete The concrete source path.
	 * @returns The value, with null treated as absent.
	 */
	take(concrete) {
		const value = getData(this.data, concrete);
		if (value === null || value === undefined) {
			return undefined;
		}
		this.consumed.add(concrete.join("."));
		return value;
	}

	/**
	 * Record an unfilled target field.
	 * @param targetPath The target field path.
	 * @param required Whether the field is required.
	 * @param reason Why it stayed empty.
	 */
	report(targetPath, required, reason) {
		this.unfilled.push({ path: targetPath, required, reason });
	}

	/**
	 * Fill a target schema node from the source document.
	 * @param node The target schema node.
	 * @param propertyName The property name holding the node, if any.
	 * @param context The concrete context path into the source data.
	 * @param targetPath The target path, for reporting.
	 * @param required Whether the node is required, for reporting.
	 * @param pendingValue A value carried down from a value-object match.
	 * @returns The filled value, or undefined.
	 */
	fill(node, propertyName, context, targetPath, required, pendingValue) {
		const eff = resolveEffective(node, this.schemasById);

		if (eff.const !== undefined) {
			return eff.const;
		}
		if (propertyName === "@context") {
			return JSONLD_CONTEXT_VALUE;
		}

		const ownDescriptions = typeof node.description === "string" ? [node.description] : [];
		const tag =
			tagFromDescriptions(ownDescriptions, TARGET_PROPERTY_REGEX) ??
			tagFromDescriptions(eff.descriptions, TARGET_PROPERTY_REGEX) ??
			(propertyName ? `${VOCABULARY_BASE}${propertyName}` : undefined);
		const typeTag = tagFromDescriptions(eff.descriptions, TARGET_TYPE_REGEX);

		if (Object.keys(eff.properties).length > 0) {
			return this.fillObject(eff, tag, typeTag, context, targetPath, required, pendingValue);
		}
		if (eff.items !== undefined || (Array.isArray(eff.type) ? eff.type : [eff.type]).includes("array")) {
			return this.fillArray(eff, tag, context, targetPath, required);
		}
		return this.fillLeaf(eff, tag, propertyName, context, targetPath, required, pendingValue);
	}

	/**
	 * Fill an object target node.
	 * @param eff The effective node.
	 * @param tag The node's property tag.
	 * @param typeTag The node's entity type tag.
	 * @param context The concrete context path.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @param pendingValue A value carried down from a value-object match.
	 * @returns The filled object, or undefined when empty.
	 */
	fillObject(eff, tag, typeTag, context, targetPath, required, pendingValue) {
		let childContext = context;
		let childPending = pendingValue;

		const match =
			this.findEntry(tag, context, ["object", "leaf"]) ??
			(typeTag
				? { entry: undefined, ...this.findByType(typeTag, context) }
				: undefined);

		if (match?.concrete) {
			const entry = match.entry;
			if (entry?.kind === "leaf") {
				// A value object: the leaf value fills the *Value child, its
				// siblings resolve under the leaf's parent.
				childPending = this.take(match.concrete);
				childContext = match.concrete.slice(0, -1);
			} else {
				childContext = match.concrete;
			}
		}

		const result = {};
		for (const [name, child] of Object.entries(eff.properties)) {
			const childPath = targetPath === "" ? name : `${targetPath}.${name}`;
			const value = this.fill(child, name, childContext, childPath, eff.required.has(name), childPending);
			if (value !== undefined) {
				result[name] = value;
			}
		}

		if (Object.keys(result).length === 0) {
			this.report(targetPath, required, "no matching source data");
			return undefined;
		}
		return result;
	}

	/**
	 * Find an object source entry by entity type under a context.
	 * @param typeTag The entity type tag.
	 * @param context The concrete context path.
	 * @returns The concrete path wrapped in an object, or an empty object.
	 */
	findByType(typeTag, context) {
		for (const entry of this.index.byType.get(normalizeTag(typeTag)) ?? []) {
			if (entry.kind !== "object") {
				continue;
			}
			const concrete = materialize(entry.path, context);
			if (concrete) {
				return { entry, concrete };
			}
		}
		return {};
	}

	/**
	 * Fill an array target node.
	 * @param eff The effective node.
	 * @param tag The node's property tag.
	 * @param context The concrete context path.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @returns The filled array, or undefined.
	 */
	fillArray(eff, tag, context, targetPath, required) {
		const itemsEff = eff.items ? resolveEffective(eff.items, this.schemasById) : undefined;
		const itemTypeTag = itemsEff ? tagFromDescriptions(itemsEff.descriptions, TARGET_TYPE_REGEX) : undefined;

		const arrayPath = this.findArray(tag, itemTypeTag, context);
		if (!arrayPath) {
			this.report(targetPath, required, "no matching source array");
			return undefined;
		}

		const sourceArray = getData(this.data, arrayPath);
		if (!Array.isArray(sourceArray)) {
			this.report(targetPath, required, "source array is empty or null");
			return undefined;
		}

		const result = [];
		for (let i = 0; i < sourceArray.length; i++) {
			const value = this.fill(eff.items, undefined, [...arrayPath, i], `${targetPath}[${i}]`, false, undefined);
			if (value !== undefined) {
				result.push(value);
			}
		}
		return result.length > 0 ? result : undefined;
	}

	/**
	 * Fill a leaf target node.
	 * @param eff The effective node.
	 * @param tag The node's property tag.
	 * @param propertyName The property name holding the node, if any.
	 * @param context The concrete context path.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @param pendingValue A value carried down from a value-object match.
	 * @returns The filled value, or undefined.
	 */
	fillLeaf(eff, tag, propertyName, context, targetPath, required, pendingValue) {
		const suffix = propertyName ? VALUE_OBJECT_SUFFIX_REGEX.exec(propertyName)?.[2] : undefined;

		if (pendingValue !== undefined && suffix === "Value") {
			return this.coerce(pendingValue, eff);
		}

		let match = this.findEntry(tag, context, ["leaf"]);
		if (!match && pendingValue !== undefined && suffix) {
			// Inside a value object, retry the bare suffix as tag (currency, code).
			match = this.findEntry(`${VOCABULARY_BASE}${suffix.toLowerCase()}`, context, ["leaf"]);
		}

		if (!match) {
			this.report(targetPath, required, "no matching source field");
			return undefined;
		}

		const value = this.take(match.concrete);
		if (value === undefined) {
			this.report(targetPath, required, `source field ${match.concrete.join(".")} is null`);
			return undefined;
		}
		return this.coerce(value, eff);
	}
}

/**
 * Collect the paths of all non-null leaf values in a data document.
 * @param data The data document.
 * @param path The current path prefix.
 * @param paths The accumulator.
 * @returns The collected paths.
 */
function leafPaths(data, path = "", paths = []) {
	if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) {
			leafPaths(data[i], `${path}.${i}`.replace(/^\./, ""), paths);
		}
	} else if (typeof data === "object" && data !== null) {
		for (const [name, value] of Object.entries(data)) {
			leafPaths(value, path === "" ? name : `${path}.${name}`, paths);
		}
	} else if (data !== null && data !== undefined) {
		paths.push(path);
	}
	return paths;
}

/**
 * Fill a target schema from a source document.
 * @param sourceSchema The parsed source schema (x-json-ld annotated).
 * @param sourceData The source data document.
 * @param targetSchema The parsed target schema (fqn-line annotated).
 * @param schemasById Local target schemas indexed by $id.
 * @returns The filled document and the fill report.
 */
export function fillTargetSchema(sourceSchema, sourceData, targetSchema, schemasById = new Map()) {
	const index = buildSourceIndex(sourceSchema);
	const filler = new Filler(index, sourceData, schemasById);
	const document = filler.fill(targetSchema, undefined, [], "", true, undefined) ?? {};
	const unconsumed = leafPaths(sourceData).filter((p) => !filler.consumed.has(p));
	return { document, unfilled: filler.unfilled, unconsumed };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	const here = dirname(fileURLToPath(import.meta.url));
	const dataFile = process.argv[2] ?? join(here, "data", "extracted-data.json");
	const sourceSchemaFile = process.argv[3] ?? join(here, "schema", "sales_contract.schema.json");
	const targetSchemaFile = process.argv[4] ?? join(here, "..", "schemas", "TradeAgreement.json");
	const outputFile = process.argv[5];

	const sourceData = JSON.parse(readFileSync(dataFile, "utf8"));
	const sourceSchema = JSON.parse(readFileSync(sourceSchemaFile, "utf8"));
	const targetSchema = JSON.parse(readFileSync(targetSchemaFile, "utf8"));
	const schemasById = loadSchemasById([dirname(targetSchemaFile), join(here, "..", "schemas")]);

	const { document, unfilled, unconsumed } = fillTargetSchema(sourceSchema, sourceData, targetSchema, schemasById);
	const json = `${JSON.stringify(document, undefined, "\t")}\n`;

	if (outputFile) {
		writeFileSync(outputFile, json);
		console.log(`Written ${outputFile}`);
	} else {
		process.stdout.write(json);
	}

	if (unfilled.length > 0) {
		console.error("\nUnfilled target fields:");
		for (const { path, required, reason } of unfilled) {
			console.error(`  ${required ? "[required] " : ""}${path || "<root>"}: ${reason}`);
		}
	}
	if (unconsumed.length > 0) {
		console.error("\nSource fields never consumed:");
		for (const path of unconsumed) {
			console.error(`  ${path}`);
		}
	}
}
