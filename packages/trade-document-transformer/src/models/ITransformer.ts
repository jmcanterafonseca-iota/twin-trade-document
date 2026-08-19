// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IJsonSchema } from "@twin.org/data-core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";

/**
 * Transforms a source data document into a document conforming to a semantic
 * (JSON-LD annotated) target schema, matching fields by their JSON-LD
 * annotations rather than by name or position.
 */
export interface ITransformer {
	/**
	 * Transform a source document into the shape of a semantic schema.
	 * @param inputData The source data document, conforming to the source schema.
	 * @param inoutDataSchema The source JSON schema, annotated with
	 * `x-json-ld-property` / `x-json-ld-type`.
	 * @param documentType The document type we want to get instance of.
	 * @returns The generated document, conforming to the semantic schema.
	 */
	transform(
		inputData: { [key: string]: unknown },
		inoutDataSchema: IJsonSchema,
		documentType: string
	): Promise<IJsonLdNodeObject>;
}
