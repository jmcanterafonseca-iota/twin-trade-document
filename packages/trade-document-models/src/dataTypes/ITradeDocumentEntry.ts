// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IJsonSchema } from "@twin.org/data-core";

/**
 * Document type description
 */
export interface ITradeDocumentEntry {
	/**
	 * The type of document (non qualified)
	 */
	documentType: string;

	/**
	 * The validation JSON Schema
	 */
	jsonSchema: IJsonSchema;
}
