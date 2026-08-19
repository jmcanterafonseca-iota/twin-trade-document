// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { readFileSync } from "node:fs";
import type { IJsonSchema } from "@twin.org/data-core";
import type { IJsonLdNodeObject } from "@twin.org/data-json-ld";
import { SemanticTransformer } from "../src/semanticTransformer.js";

const inputData: { [key: string]: unknown } = JSON.parse(
	readFileSync(new URL("./data/extracted-data.json", import.meta.url), "utf8")
);
const inputDataSchema: IJsonSchema = JSON.parse(
	readFileSync(new URL("./schema/sales_contract.schema.json", import.meta.url), "utf8")
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
		const transformer = new SemanticTransformer();

		const { document } = await transformer.transform(inputData, inputDataSchema, "TradeAgreement");

		expect(document["@context"]).toEqual(
			"https://vocabulary.uncefact.org/unece-context-D23B.jsonld"
		);
		expect(document.type).toEqual("HeaderTradeAgreement");
		expect(document.buyerReference).toEqual("TBA");
		expect(document.sellerReference).toEqual("S - JCT / 742-744");
		expect(document.issueDate).toEqual("2024-09-06T00:00:00Z");
		expect(document.buyerParty).toMatchObject({
			type: "TradeParty",
			name: "D.R. Wakefield & Company Ltd."
		});
		expect(document.sellerParty).toMatchObject({
			type: "TradeParty",
			name: "Jowam Coffee Traders Co. Ltd."
		});
		expect(document.includesItem).toHaveLength(3);
		const firstItem = (document.includesItem as IJsonLdNodeObject[])[0];
		expect(firstItem.applicableProduct).toMatchObject({
			type: "TradeProduct",
			identifier: "ctr/742",
			description: "Asali"
		});
		expect(document.applicableDeliveryTerms).toMatchObject({
			type: "DeliveryTerms",
			incotermsCode: "FOB"
		});
	});
});
