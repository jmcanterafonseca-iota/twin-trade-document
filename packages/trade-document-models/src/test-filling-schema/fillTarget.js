// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Generates a document conforming to a target JSON schema from a source data
 * document, driven entirely by the JSON-LD annotations of both schemas.
 *
 * The source schema is turned into the index built by `buildSchemaIndex.js`:
 *
 *   index[propertyFqn] = { type, path, properties: { subFqn: jsonPath } }
 *
 * The target schema is then walked. For each node:
 *
 * - A `const` is emitted verbatim (`@context` likewise emits the JSON-LD
 *   context value).
 * - An object (or array) node whose property FQN — its `x-json-ld-property`
 *   annotation, or `https://vocabulary.uncefact.org/<name>` per the JSON-LD
 *   `@vocab` context when unannotated — matches an index entry switches the
 *   lookup scope to that entry; failing that, an entry with the node's
 *   `x-json-ld-type` is used. A node matching no entry is transparent: its
 *   children keep resolving against the enclosing entry.
 * - A leaf node looks its property FQN up in the current entry's
 *   `properties` map (and in the pinned entry for the current entity type,
 *   when one exists); the JSON path found there, made concrete against the
 *   current array bindings, is read from the data document.
 * - An array node iterates the source value found for its entry, filling the
 *   item schema once per element; a non-array source value fills a single
 *   element.
 *
 * Values are coerced to the target's declared shape (full dates to
 * date-times, numbers to strings). Objects holding only constants are
 * dropped. A report of target fields that could not be filled and source
 * fields never consumed is printed to stderr.
 *
 * `$ref`s between target schema files are resolved by `$id` against the
 * local schema folder; unresolvable (external) refs are ignored.
 *
 * Usage:
 *   node fillTarget.js [dataFile] [targetSchemaFile] [sourceSchemaFile] [outputFile]
 *
 * Defaults to ./data/extracted-data.json, ../schemas/TradeAgreement.json and
 * ./schema/sales_contract.schema.json, printing the document to stdout.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSchemaIndex, jsonLdProperty, jsonLdType } from './buildSchemaIndex.js';

const VOCABULARY_BASE = 'https://vocabulary.uncefact.org/';
const JSONLD_CONTEXT_VALUE = 'https://vocabulary.uncefact.org/';

/**
 * Parse an index JSON path into segments ("[*]" marks array items).
 * @param path The JSON path, e.g. `$.lots[*].lot_reference`.
 * @returns The segments, e.g. `["lots", "[*]", "lot_reference"]`.
 */
function parsePath(path) {
	const segments = [];
	for (const part of path.replace(/^\$\.?/, '').split('.')) {
		if (part === '') {
			continue;
		}
		const [name, ...stars] = part.split('[*]');
		if (name) {
			segments.push(name);
		}
		for (let i = 0; i < stars.length; i++) {
			segments.push('[*]');
		}
	}
	return segments;
}

/**
 * Get the parsed paths of an index slot (a path string or array of them).
 * @param slot The slot value.
 * @returns The parsed paths.
 */
function slotPaths(slot) {
	return (Array.isArray(slot) ? slot : [slot]).map(parsePath);
}

/**
 * Materialize a schema path against a concrete context: the context must be
 * a prefix (with numbers matching "[*]") and no "[*]" may remain after it.
 * @param segments The path segments.
 * @param context The concrete context path (numbers for array indices).
 * @returns The concrete path, or undefined.
 */
function materialize(segments, context) {
	if (segments.length < context.length) {
		return undefined;
	}
	const concrete = [];
	for (let i = 0; i < segments.length; i++) {
		if (i < context.length) {
			if (segments[i] === context[i] || (segments[i] === '[*]' && typeof context[i] === 'number')) {
				concrete.push(context[i]);
			} else {
				return undefined;
			}
		} else if (segments[i] === '[*]') {
			return undefined;
		} else {
			concrete.push(segments[i]);
		}
	}
	return concrete;
}

/**
 * Read a value from the source data at a concrete path.
 * @param data The source data document.
 * @param concrete The concrete path segments.
 * @returns The value, or undefined.
 */
function getData(data, concrete) {
	let value = data;
	for (const segment of concrete) {
		if (typeof value !== 'object' || value === null) {
			return undefined;
		}
		value = value[segment];
	}
	return value;
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
			if (!entry.endsWith('.json')) {
				continue;
			}
			try {
				const schema = JSON.parse(readFileSync(join(folder, entry), 'utf8'));
				if (typeof schema.$id === 'string' && !byId.has(schema.$id)) {
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
 * Flatten a target schema node: follow `$id` `$ref`s and merge combinator
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
		propertyFqn: undefined,
		typeFqn: undefined
	};
	const seen = new Set();

	/**
	 * Merge one node into the effective view.
	 * @param n The node to merge.
	 */
	function merge(n) {
		if (typeof n !== 'object' || n === null) {
			return;
		}
		eff.propertyFqn ??= jsonLdProperty(n);
		eff.typeFqn ??= jsonLdType(n);
		if (n.const !== undefined && eff.const === undefined) {
			eff.const = n.const;
		}
		if (n.type !== undefined && eff.type === undefined) {
			eff.type = n.type;
		}
		if (typeof n.format === 'string' && eff.format === undefined) {
			eff.format = n.format;
		}
		if (typeof n.items === 'object' && n.items !== null && eff.items === undefined) {
			eff.items = n.items;
		}
		if (typeof n.properties === 'object' && n.properties !== null) {
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
		if (typeof n.$ref === 'string' && schemasById.has(n.$ref) && !seen.has(n.$ref)) {
			seen.add(n.$ref);
			merge(schemasById.get(n.$ref));
		}
		for (const combinator of ['allOf', 'anyOf', 'oneOf']) {
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
 * The generator: walks the target schema resolving each field through the
 * source index into the data document.
 */
class Filler {
	/**
	 * Create a filler.
	 * @param index The source schema index (see buildSchemaIndex).
	 * @param data The source data document.
	 * @param schemasById Local target schemas indexed by $id.
	 */
	constructor(index, data, schemasById) {
		this.index = index;
		this.data = data;
		this.schemasById = schemasById;
		this.unfilled = [];
		this.consumed = new Set();
	}

	/**
	 * Build the lookup scopes for an entry: the entry itself plus, when the
	 * entry has a type with a pinned (type-keyed) entry, that pinned entry.
	 * @param entry The index entry.
	 * @param context The concrete context path of the entity value.
	 * @returns The scopes.
	 */
	scopesFor(entry, context) {
		const scopes = [{ entry, context }];
		const pinned = entry.type ? this.index[entry.type] : undefined;
		if (pinned && pinned !== entry) {
			scopes.push({ entry: pinned, context });
		}
		return scopes;
	}

	/**
	 * Find the concrete data path of a property FQN in the given scopes.
	 * @param fqn The property FQN.
	 * @param scopes The lookup scopes.
	 * @returns The concrete path, or undefined.
	 */
	findValuePath(fqn, scopes) {
		if (!fqn) {
			return undefined;
		}
		for (const { entry, context } of scopes) {
			const slot = entry.properties[fqn];
			if (slot === undefined) {
				continue;
			}
			for (const segments of slotPaths(slot)) {
				// Relative to the current context first; relative to the
				// outermost context second, for properties whose value lives
				// outside the entity's subtree.
				const concrete = materialize(segments, context) ?? materialize(segments, []);
				if (concrete) {
					return concrete;
				}
			}
		}
		return undefined;
	}

	/**
	 * Find the index entry for an entity node, by property FQN first, then by
	 * type FQN; in context first, then globally.
	 * @param fqn The node's property FQN.
	 * @param typeFqn The node's type FQN.
	 * @param scopes The current lookup scopes.
	 * @returns The entry with its concrete context, or undefined.
	 */
	findEntry(fqn, typeFqn, scopes) {
		const context = scopes[0]?.context ?? [];
		const candidates = [];
		if (fqn && this.index[fqn]) {
			candidates.push(this.index[fqn]);
		}
		if (typeFqn) {
			for (const entry of Object.values(this.index)) {
				if (entry.type === typeFqn && !candidates.includes(entry)) {
					candidates.push(entry);
				}
			}
		}
		for (const entry of candidates) {
			if (entry === scopes[0]?.entry) {
				// Already scoped to this entity (e.g. array items re-stating
				// the type of the array's entry): stay transparent.
				return undefined;
			}
			if (entry.path === undefined) {
				// A pinned or chain-created entry is entered right here, so
				// its property paths resolve relative to the current context
				// (the outermost context is retried by the value lookup).
				return { entry, context };
			}
			for (const segments of slotPaths(entry.path)) {
				const concrete = materialize(segments, context) ?? materialize(segments, []);
				if (concrete) {
					return { entry, context: concrete };
				}
			}
		}
		return undefined;
	}

	/**
	 * Coerce a source value to the target node's declared shape.
	 * @param value The source value.
	 * @param eff The effective target node.
	 * @returns The coerced value.
	 */
	coerce(value, eff) {
		const types = Array.isArray(eff.type) ? eff.type : [eff.type];
		if (
			eff.format === 'date-time' &&
			typeof value === 'string' &&
			/^\d{4}-\d{2}-\d{2}$/.test(value)
		) {
			return `${value}T00:00:00Z`;
		}
		if (typeof value === 'number' && types.includes('string') && !types.includes('number')) {
			return String(value);
		}
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
	 * Fill a target schema node.
	 * @param node The target schema node.
	 * @param propertyName The property name holding the node, if any.
	 * @param scopes The current lookup scopes.
	 * @param targetPath The target path, for reporting.
	 * @param required Whether the node is required, for reporting.
	 * @returns `{ value, hasData }`, or undefined when nothing was produced.
	 */
	fill(node, propertyName, scopes, targetPath, required) {
		const eff = resolveEffective(node, this.schemasById);

		if (eff.const !== undefined) {
			return { value: eff.const, hasData: false };
		}
		if (propertyName === '@context') {
			return { value: JSONLD_CONTEXT_VALUE, hasData: false };
		}

		const own = Array.isArray(eff.propertyFqn) ? eff.propertyFqn.at(-1) : eff.propertyFqn;
		const fqn = own ?? (propertyName ? `${VOCABULARY_BASE}${propertyName}` : undefined);

		if (Object.keys(eff.properties).length > 0) {
			return this.fillObject(eff, fqn, scopes, targetPath, required);
		}
		if (
			eff.items !== undefined ||
			(Array.isArray(eff.type) ? eff.type : [eff.type]).includes('array')
		) {
			return this.fillArray(eff, fqn, scopes, targetPath, required);
		}
		return this.fillLeaf(eff, fqn, scopes, targetPath, required);
	}

	/**
	 * Fill an object target node.
	 * @param eff The effective node.
	 * @param fqn The node's property FQN.
	 * @param scopes The current lookup scopes.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @returns `{ value, hasData }`, or undefined.
	 */
	fillObject(eff, fqn, scopes, targetPath, required) {
		const match = this.findEntry(fqn, eff.typeFqn, scopes);
		const childScopes = match ? this.scopesFor(match.entry, match.context) : scopes;

		const result = {};
		let hasData = false;
		for (const [name, child] of Object.entries(eff.properties)) {
			const childPath = targetPath === '' ? name : `${targetPath}.${name}`;
			const filled = this.fill(child, name, childScopes, childPath, eff.required.has(name));
			if (filled !== undefined) {
				result[name] = filled.value;
				hasData ||= filled.hasData;
			}
		}

		if (!hasData) {
			this.report(targetPath, required, 'no matching source data');
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
	 * @returns `{ value, hasData }`, or undefined.
	 */
	fillArray(eff, fqn, scopes, targetPath, required) {
		const itemsEff = eff.items ? resolveEffective(eff.items, this.schemasById) : undefined;
		const match = this.findEntry(fqn, itemsEff?.typeFqn, scopes);
		if (!match || match.entry.path === undefined) {
			this.report(targetPath, required, 'no matching source entry');
			return undefined;
		}

		// An entry matched by its items' type points at the elements; the
		// array itself is one level up.
		const arrayContext =
			match.context.length > 0 && !this.index[fqn] && typeof match.context.at(-1) === 'number'
				? match.context.slice(0, -1)
				: match.context;

		const source = getData(this.data, arrayContext);
		if (source === null || source === undefined) {
			this.report(targetPath, required, `source ${arrayContext.join('.') || '$'} is null`);
			return undefined;
		}

		const elements = Array.isArray(source)
			? source.map((_, i) => [...arrayContext, i])
			: [arrayContext];
		const result = [];
		for (let i = 0; i < elements.length; i++) {
			const filled = this.fill(
				eff.items ?? {},
				undefined,
				this.scopesFor(match.entry, elements[i]),
				`${targetPath}[${i}]`,
				false
			);
			if (filled !== undefined) {
				result.push(filled.value);
			}
		}
		if (result.length === 0) {
			this.report(targetPath, required, 'no element could be filled');
			return undefined;
		}
		return { value: result, hasData: true };
	}

	/**
	 * Fill a leaf target node.
	 * @param eff The effective node.
	 * @param fqn The node's property FQN.
	 * @param scopes The current lookup scopes.
	 * @param targetPath The target path.
	 * @param required Whether the node is required.
	 * @returns `{ value, hasData }`, or undefined.
	 */
	fillLeaf(eff, fqn, scopes, targetPath, required) {
		const concrete = this.findValuePath(fqn, scopes);
		if (!concrete) {
			this.report(targetPath, required, 'no matching source field');
			return undefined;
		}
		const value = getData(this.data, concrete);
		if (value === null || value === undefined) {
			this.report(targetPath, required, `source field ${concrete.join('.')} is null`);
			return undefined;
		}
		this.consumed.add(concrete.join('.'));
		return { value: this.coerce(value, eff), hasData: true };
	}
}

/**
 * Collect the paths of all non-null leaf values in a data document.
 * @param data The data document.
 * @param path The current path prefix.
 * @param paths The accumulator.
 * @returns The collected paths.
 */
function leafPaths(data, path = '', paths = []) {
	if (Array.isArray(data)) {
		for (let i = 0; i < data.length; i++) {
			leafPaths(data[i], path === '' ? String(i) : `${path}.${i}`, paths);
		}
	} else if (typeof data === 'object' && data !== null) {
		for (const [name, value] of Object.entries(data)) {
			leafPaths(value, path === '' ? name : `${path}.${name}`, paths);
		}
	} else if (data !== null && data !== undefined) {
		paths.push(path);
	}
	return paths;
}

/**
 * Generate a target document from a source data document.
 * @param sourceSchema The parsed, annotated source schema.
 * @param sourceData The source data document.
 * @param targetSchema The parsed, annotated target schema.
 * @param schemasById Local target schemas indexed by $id.
 * @returns The generated document and the fill report.
 */
export function fillTarget(sourceSchema, sourceData, targetSchema, schemasById = new Map()) {
	const index = buildSchemaIndex(sourceSchema);
	const filler = new Filler(index, sourceData, schemasById);
	const root = index['@root'] ?? { properties: {} };
	const filled = filler.fill(targetSchema, undefined, filler.scopesFor(root, []), '', true);
	const unconsumed = leafPaths(sourceData).filter(p => !filler.consumed.has(p));
	return { document: filled?.value ?? {}, unfilled: filler.unfilled, unconsumed };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	const here = dirname(fileURLToPath(import.meta.url));
	const dataFile = process.argv[2] ?? join(here, 'data', 'extracted-data.json');
	const targetSchemaFile = process.argv[3] ?? join(here, '..', 'schemas', 'TradeAgreement.json');
	const sourceSchemaFile = process.argv[4] ?? join(here, 'schema', 'sales_contract.schema.json');
	const outputFile = process.argv[5];

	const sourceData = JSON.parse(readFileSync(dataFile, 'utf8'));
	const sourceSchema = JSON.parse(readFileSync(sourceSchemaFile, 'utf8'));
	const targetSchema = JSON.parse(readFileSync(targetSchemaFile, 'utf8'));
	const schemasById = loadSchemasById([dirname(targetSchemaFile), join(here, '..', 'schemas')]);

	const { document, unfilled, unconsumed } = fillTarget(
		sourceSchema,
		sourceData,
		targetSchema,
		schemasById
	);
	const json = `${JSON.stringify(document, undefined, '\t')}\n`;

	if (outputFile) {
		writeFileSync(outputFile, json);
		console.log(`Written ${outputFile}`);
	} else {
		process.stdout.write(json);
	}

	if (unfilled.length > 0) {
		console.error('\nUnfilled target fields:');
		for (const { path, required, reason } of unfilled) {
			console.error(`  ${required ? '[required] ' : ''}${path || '<root>'}: ${reason}`);
		}
	}
	if (unconsumed.length > 0) {
		console.error('\nSource fields never consumed:');
		for (const path of unconsumed) {
			console.error(`  ${path}`);
		}
	}
}
