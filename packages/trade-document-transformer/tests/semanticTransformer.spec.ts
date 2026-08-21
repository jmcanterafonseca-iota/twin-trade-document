// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { readFileSync } from "node:fs";
import type { IJsonSchema } from "@twin.org/data-core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import type { IValueHookContext } from "../src/models/IValueHookContext.js";
import { SemanticTransformer } from "../src/semanticTransformer.js";

const inputData: { [key: string]: unknown } = JSON.parse(
	readFileSync(new URL("./data/sales_contract.json", import.meta.url), "utf8")
);
const inputDataSchema: IJsonSchema = JSON.parse(
	readFileSync(new URL("./schema/sales_contract.extraction.schema.json", import.meta.url), "utf8")
);

describe("SemanticTransformer", () => {
	test("Can construct the transformer", () => {
		const transformer = new SemanticTransformer();
		expect(transformer.CLASS_NAME).toEqual("SemanticTransformer");
	});

	test("Can transform an empty document", async () => {
		const transformer = new SemanticTransformer();

		const { document } = await transformer.transform({}, {}, "TradeAgreement");

		expect(document).toEqual({});
	});

	test.todo("Can fill a root level property annotated with x-json-ld-property");

	test.todo("Can fill an entity matched by its property FQN and x-json-ld-type");

	test.todo("Can fill a property annotated with an FQN chain");

	test.todo("Can fill an array from a source array, one element per item");

	test("Can transform a sales contract extraction into a Trade Agreement", async () => {
		/**
		 * Adapts a date time.
		 * @param v value
		 * @param context context
		 * @returns Value
		 */
		function dateTimeFunction(v: unknown, context: IValueHookContext): unknown {
			return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00Z` : v;
		}

		const hooks = {
			byFormat: {
				"date-time": dateTimeFunction
			}
		};

		const transformer = new SemanticTransformer(hooks);

		const { document } = await transformer.transform(inputData, inputDataSchema, "TradeAgreement");

		console.log(JSON.stringify(document, null, 2));

		expect(document["@context"]).toEqual(
			"https://vocabulary.uncefact.org/unece-context-D23B.jsonld"
		);
		expect(document.type).toEqual("HeaderTradeAgreement");
		expect(document.buyerParty).toMatchObject({
			type: "TradeParty",
			name: "D.R. Wakefield & Company Ltd."
		});
		expect(document.sellerParty).toMatchObject({
			type: "TradeParty",
			name: "Jowam Coffee Traders Co. Ltd"
		});
		expect(document.includesItem).toHaveLength(3);
		const firstItem = (document.includesItem as IJsonLdNodeObject[])[0];
		expect(firstItem.applicableProduct).toMatchObject({
			type: "TradeProduct",
			itemNumber: "ctr/742",
			description: "Asali"
		});
		expect(document.applicableDeliveryTerms).toMatchObject({
			type: "DeliveryTerms",
			incotermsCode: "FOB"
		});
	});
});
