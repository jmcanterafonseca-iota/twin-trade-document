// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The context handed to a value hook when a target leaf is filled.
 */
export interface IValueHookContext {
	/**
	 * The target property name, e.g. `issueDate`.
	 */
	propertyName?: string;

	/**
	 * The resolved FQN of the target property (annotation, JSON-LD context or
	 * vocabulary default).
	 */
	fqn?: string;

	/**
	 * The type FQN of the nearest enclosing entity, e.g.
	 * `https://schema.twindev.org/trade-document/Location`, letting a hook on
	 * a generic property FQN act only in a specific entity context.
	 */
	entityType?: string;

	/**
	 * The path of the property in the generated document.
	 */
	targetPath: string;

	/**
	 * The concrete source path the value was read from, e.g. `lots.1.unit_price`.
	 */
	sourcePath: string;

	/**
	 * The declared JSON type(s) of the target node.
	 */
	type?: unknown;

	/**
	 * The declared format of the target node, e.g. `date-time`.
	 */
	format?: string;

	/**
	 * The document conventions extracted with the source document
	 * (`document_conventions`), such as the date order and decimal style.
	 */
	documentConventions?: { [key: string]: unknown };

	/**
	 * The source object containing the value, e.g. the lot a price was read
	 * from.
	 */
	sourceObject?: { [key: string]: unknown };

	/**
	 * Hang an additional value as a sibling of the transformed element in the
	 * target document, e.g. a structured address parsed from an address line.
	 * A sibling never overwrites a property filled from the schema.
	 * @param propertyName The sibling property name.
	 * @param value The value to hang.
	 */
	setSibling?(propertyName: string, value: unknown): void;
}
