// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Builds an index from a JSON-LD annotated JSON Schema, keyed by the
 * `x-json-ld-property` FQN of each entity property:
 *
 *   index[propertyFqn] = {
 *     type: <x-json-ld-type FQN of that property>,
 *     path: <JSON path of the entity value in a conforming document>,
 *     properties: { [subPropertyFqn]: <JSON path of the subproperty value> }
 *   }
 *
 * The subproperties of an entry are every `x-json-ld-property` annotated
 * descendant reached without crossing another entity entry; unannotated
 * wrappers are transparent. A subproperty that is itself an entity (it
 * carries an `x-json-ld-type`, or has annotated children of its own) is
 * listed in its parent's `properties` with its path and additionally gets
 * its own top-level entry. A *leaf* carrying both annotations is a pinned
 * property: its value belongs to an entity of the annotated type, so it is
 * indexed under an entry keyed by that type FQN rather than under its
 * enclosing entity. An `x-json-ld-property` holding an *array* of FQNs is a
 * property chain: it denotes the full set of nodes that lead to the proper
 * semantic nesting, wherever the annotated node sits in the schema tree.
 * The last element is the property holding the value, recorded under the
 * entry keyed by the second-to-last element (entries for the leading
 * elements are created when missing); on a leaf, an accompanying
 * `x-json-ld-type` describes that owning entity. Annotated properties above
 * the first entity are collected under the `@root` entry, whose type is the
 * schema root's `x-json-ld-type`.
 *
 * Annotations are read from the `x-json-ld-type` / `x-json-ld-property`
 * schema keywords or, failing those, from `x-json-ld-type: <uri>` /
 * `x-json-ld-property: <uri>` lines inside `description` texts.
 *
 * JSON paths use `$` for the root and `[*]` for array items
 * (`$.lots[*].unit_price`). When the same FQN occurs more than once in a
 * slot, the path becomes an array of paths.
 *
 * Local `$ref`s (`#/$defs/...`) are followed; combinator branches
 * (`allOf`/`anyOf`/`oneOf`) are walked in place.
 *
 * Usage:
 *   node buildSchemaIndex.js [schemaFile]
 *
 * Defaults to ./schema/sales_contract.schema.json, printing the index to
 * stdout as JSON.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPE_KEY = 'x-json-ld-type';
const PROPERTY_KEY = 'x-json-ld-property';
const TYPE_REGEX = /x-json-ld-type:\s*"?([^\s"]+)/;
const PROPERTY_REGEX = /x-json-ld-property:\s*"?([^\s"]+)/;
const ROOT_ENTRY = '@root';

/**
 * Read an annotation from a schema node: keyword first, description line second.
 * The keyword may hold a single FQN or an array of FQNs (a property chain).
 * @param node The schema node.
 * @param key The annotation keyword.
 * @param regex The description-line fallback regex.
 * @returns The annotation FQN (or FQN chain), or undefined.
 */
function annotation(node, key, regex) {
	if (typeof node[key] === 'string' || Array.isArray(node[key])) {
		return node[key];
	}
	if (typeof node.description === 'string') {
		return regex.exec(node.description)?.[1];
	}
	return undefined;
}

/**
 * Read the `x-json-ld-property` annotation of a schema node.
 * @param node The schema node.
 * @returns The property FQN, or undefined.
 */
export function jsonLdProperty(node) {
	return annotation(node, PROPERTY_KEY, PROPERTY_REGEX);
}

/**
 * Read the `x-json-ld-type` annotation of a schema node.
 * @param node The schema node.
 * @returns The type FQN, or undefined.
 */
export function jsonLdType(node) {
	return annotation(node, TYPE_KEY, TYPE_REGEX);
}

/**
 * Resolve an internal `#/...` JSON pointer.
 * @param schema The schema owning the pointer.
 * @param ref The `$ref` value.
 * @returns The referenced node, or undefined.
 */
function resolvePointer(schema, ref) {
	let node = schema;
	for (const segment of ref.replace(/^#\//, '').split('/')) {
		if (typeof node !== 'object' || node === null) {
			return undefined;
		}
		node = node[decodeURIComponent(segment.replaceAll('~1', '/').replaceAll('~0', '~'))];
	}
	return node;
}

/**
 * Store a path in a slot, turning it into an array of paths on collision.
 * @param holder The object holding the slot.
 * @param key The slot key.
 * @param path The JSON path to store.
 */
function addPath(holder, key, path) {
	const current = holder[key];
	if (current === undefined) {
		holder[key] = path;
	} else if (Array.isArray(current)) {
		if (!current.includes(path)) {
			current.push(path);
		}
	} else if (current !== path) {
		holder[key] = [current, path];
	}
}

/**
 * Build the index for an annotated schema.
 * @param schema The parsed JSON schema.
 * @returns The index: { [propertyFqn]: { type, path, properties } }.
 */
export function buildSchemaIndex(schema) {
	const index = {};

	/**
	 * Get or create the entry for a property FQN.
	 * @param fqn The property FQN (or `@root`).
	 * @param type The entity type FQN, if known.
	 * @param path The JSON path of the entity value.
	 * @returns The entry.
	 */
	function openEntry(fqn, type, path) {
		const entry = (index[fqn] ??= { properties: {} });
		if (type && entry.type === undefined) {
			entry.type = type;
		}
		addPath(entry, 'path', path);
		return entry;
	}

	/**
	 * Resolve a node's local `$ref`, merging sibling keywords over the target.
	 * @param node The node to dereference.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 * @returns The dereferenced node and the updated seen set, or undefined on a cycle.
	 */
	function deref(node, seenRefs) {
		if (typeof node.$ref === 'string' && node.$ref.startsWith('#/')) {
			if (seenRefs.has(node.$ref)) {
				return undefined;
			}
			const resolved = resolvePointer(schema, node.$ref);
			if (typeof resolved === 'object' && resolved !== null) {
				seenRefs = new Set([...seenRefs, node.$ref]);
				const { $ref, ...rest } = node;
				node = { ...resolved, ...rest };
			}
		}
		return { node, seenRefs };
	}

	/**
	 * Check whether a node has structure of its own (properties or items).
	 * @param node The dereferenced node.
	 * @returns True when the node is not a leaf.
	 */
	function hasStructure(node) {
		return (
			(typeof node.properties === 'object' && node.properties !== null) ||
			(typeof node.items === 'object' && node.items !== null)
		);
	}

	/**
	 * Walk the structure beneath an entity, collecting its subproperties.
	 * @param node The dereferenced node to walk.
	 * @param path The JSON path of the node.
	 * @param entry The entity entry being filled.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 */
	function walkChildren(node, path, entry, seenRefs) {
		if (typeof node.properties === 'object' && node.properties !== null) {
			for (const [name, child] of Object.entries(node.properties)) {
				walk(child, `${path}.${name}`, entry, seenRefs);
			}
		}
		if (typeof node.items === 'object' && node.items !== null) {
			walk(node.items, `${path}[*]`, entry, seenRefs);
		}
		for (const combinator of ['allOf', 'anyOf', 'oneOf']) {
			if (Array.isArray(node[combinator])) {
				for (const branch of node[combinator]) {
					walk(branch, path, entry, seenRefs);
				}
			}
		}
	}

	/**
	 * Walk a schema node under an enclosing entity entry.
	 * @param rawNode The node to walk.
	 * @param path The JSON path of the node.
	 * @param entry The enclosing entity entry.
	 * @param seenRefs The `$ref`s already expanded on this branch.
	 */
	function walk(rawNode, path, entry, seenRefs) {
		if (typeof rawNode !== 'object' || rawNode === null) {
			return;
		}
		const dereffed = deref(rawNode, seenRefs);
		if (!dereffed) {
			return;
		}
		const { node } = dereffed;
		seenRefs = dereffed.seenRefs;

		const property = annotation(node, PROPERTY_KEY, PROPERTY_REGEX);
		const type = annotation(node, TYPE_KEY, TYPE_REGEX);

		if (property) {
			const chain = Array.isArray(property) ? property : [property];
			const last = chain.at(-1);
			if (chain.length > 1) {
				// A property chain: the leading FQNs are the entity properties
				// that nest the value semantically, wherever the node sits in
				// the schema tree. The value is a property of the entity
				// addressed by the second-to-last element.
				for (let i = 0; i < chain.length - 1; i++) {
					index[chain[i]] ??= { properties: {} };
				}
				const owner = index[chain.at(-2)];
				addPath(owner.properties, last, path);
				if (type && !hasStructure(node)) {
					// On a leaf, the type describes the owning entity.
					owner.type ??= type;
				}
			} else if (type && !hasStructure(node)) {
				// A pinned leaf: the value is a property OF an entity of the
				// annotated type. Indexed under an entry keyed by that type.
				const owner = (index[type] ??= { type, properties: {} });
				addPath(owner.properties, last, path);
				return;
			} else {
				addPath(entry.properties, last, path);
			}
			if (hasStructure(node)) {
				// An entity subproperty: listed above under its parent, and
				// opened as its own top-level entry for its children.
				entry = openEntry(last, type, path);
			}
		}

		walkChildren(node, path, entry, seenRefs);
	}

	const dereffed = deref(schema, new Set());
	if (dereffed) {
		const root = openEntry(ROOT_ENTRY, annotation(dereffed.node, TYPE_KEY, TYPE_REGEX), '$');
		walkChildren(dereffed.node, '$', root, dereffed.seenRefs);
	}
	return index;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
	const here = dirname(fileURLToPath(import.meta.url));
	const schemaFile = process.argv[2] ?? join(here, 'schema', 'sales_contract.schema.json');
	const schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
	process.stdout.write(`${JSON.stringify(buildSchemaIndex(schema), undefined, '\t')}\n`);
}
