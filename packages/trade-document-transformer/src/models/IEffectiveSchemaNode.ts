// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The flattened view of a target schema node: local `$ref`s followed and
 * combinator branches merged.
 */
export interface IEffectiveSchemaNode {
	/**
	 * The constant value, when the node is a const.
	 */
	const?: unknown;

	/**
	 * The JSON type(s) of the node.
	 */
	type?: unknown;

	/**
	 * The format of the node.
	 */
	format?: string;

	/**
	 * The items schema, when the node is an array.
	 */
	items?: unknown;

	/**
	 * The merged properties of the node.
	 */
	properties: { [name: string]: unknown };

	/**
	 * The names of the required properties.
	 */
	required: Set<string>;

	/**
	 * The x-json-ld-property FQN (or FQN chain) of the node.
	 */
	propertyFqn?: string | string[];

	/**
	 * The x-json-ld-type FQN of the node.
	 */
	typeFqn?: string;
}
