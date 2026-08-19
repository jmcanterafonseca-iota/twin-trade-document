// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * One entity entry of a semantic index.
 */
export interface ISemanticIndexEntry {
	/**
	 * The x-json-ld-type FQN of the entity, when known.
	 */
	type?: string;

	/**
	 * JSON path(s) of the entity value in a source document.
	 */
	path?: string | string[];

	/**
	 * Property FQN to JSON path(s) of the property value.
	 */
	properties: { [propertyFqn: string]: string | string[] };
}
