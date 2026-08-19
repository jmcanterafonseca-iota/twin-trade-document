// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { GeneralError, Guards, Is } from "@twin.org/core";
import { DataTypeHandlerFactory, DataTypeHelper, type IJsonSchema } from "@twin.org/data-core";
import { type IJsonLdNodeObject, JsonLdDataTypes } from "@twin.org/data-json-ld";
import { nameof } from "@twin.org/nameof";
import { UneceDataTypes } from "@twin.org/standards-unece";
import { TradeDocumentContexts, TradeDocumentDataTypes } from "@twin.org/trade-document-models";
import type { ITransformer } from "./models/ITransformer.js";
import { SchemaFiller } from "./schemaFiller.js";

/**
 * Transforms source documents into documents conforming to a semantic
 * (JSON-LD annotated) target schema, matching fields by their annotations.
 */
export class SemanticTransformer implements ITransformer {
	/**
	 * Runtime name for the class.
	 */
	public readonly CLASS_NAME: string = nameof<SemanticTransformer>();

	/**
	 * Registered schemas found by scanning for a matching $id, cached.
	 * @internal
	 */
	private _schemasByIdCache?: Map<string, IJsonSchema>;

	/**
	 * Create a new instance of SemanticTransformer, registering all the data
	 * types so that document types can be resolved to their schemas.
	 */
	constructor() {
		JsonLdDataTypes.registerTypes();
		UneceDataTypes.registerTypes();
		TradeDocumentDataTypes.registerTypes();
	}

	/**
	 * @inheritdoc
	 */
	public async transform(
		inputData: { [key: string]: unknown },
		inputDataSchema: IJsonSchema,
		documentType: string
	): Promise<{ document: IJsonLdNodeObject; report: string }> {
		Guards.object(this.CLASS_NAME, nameof(inputData), inputData);
		Guards.object(this.CLASS_NAME, nameof(inputDataSchema), inputDataSchema);
		Guards.stringValue(this.CLASS_NAME, nameof(documentType), documentType);

		const targetSchema = await DataTypeHelper.getSchemaForType(
			`${TradeDocumentContexts.Namespace}${documentType}`
		);
		if (Is.undefined(targetSchema)) {
			throw new GeneralError(this.CLASS_NAME, "unknownDocumentType", { documentType });
		}

		const { document, report } = await new SchemaFiller().fill(
			inputDataSchema,
			inputData,
			targetSchema,
			async ref => this.resolveSchemaRef(ref)
		);

		return { document: document as IJsonLdNodeObject, report };
	}

	/**
	 * Resolve a schema `$ref` against the registered data types: first by the
	 * registration key, then by scanning the registered schemas for a
	 * matching `$id` (needed when a type registers under a name that differs
	 * from its schema `$id`, e.g. `TradeParty` vs `.../Party`).
	 * @param ref The `$ref` value.
	 * @returns The schema, or undefined when unknown.
	 * @internal
	 */
	private async resolveSchemaRef(ref: string): Promise<IJsonSchema | undefined> {
		const direct = await DataTypeHelper.getSchemaForType(ref);
		if (!Is.undefined(direct)) {
			return direct;
		}
		if (Is.undefined(this._schemasByIdCache)) {
			const cache = new Map<string, IJsonSchema>();
			for (const name of DataTypeHandlerFactory.names()) {
				const schema = await DataTypeHandlerFactory.get(name).jsonSchema?.();
				if (Is.object<IJsonSchema>(schema) && Is.stringValue(schema.$id)) {
					cache.set(schema.$id, schema);
				}
			}
			this._schemasByIdCache = cache;
		}
		return this._schemasByIdCache.get(ref);
	}
}
