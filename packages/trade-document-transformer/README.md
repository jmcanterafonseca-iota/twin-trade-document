# TWIN Trade Document Transformer

Transforms extracted source documents (e.g. the fields captured from a scanned sales contract) into semantic trade documents conforming to the JSON-LD annotated schemas of `@twin.org/trade-document-models`.

Fields are matched purely by their JSON-LD semantics, never by name or position. The source JSON schema annotates each field with:

- `x-json-ld-property` — the UN/CEFACT vocabulary FQN of the field, or an array of FQNs describing the full semantic nesting chain (e.g. `["…/agreedPriceProductPrice", "…/chargeAmount", "…/AmountTypeValue"]`).
- `x-json-ld-type` — the entity type an object represents, or, on a leaf, the entity type owning the value.

The target document type is resolved from the registered data types.

## Usage

```ts
import { SemanticTransformer } from "@twin.org/trade-document-transformer";

const transformer = new SemanticTransformer();

const { document, report } = await transformer.transform(
 inputData, // the extracted source document
 inputDataSchema, // its annotated JSON schema
 "TradeAgreement" // the target document type
);
```

## Examples

- Annotated source schema: [tests/schema/sales_contract.schema.json](tests/schema/sales_contract.schema.json)
- Extracted source document: [tests/data/extracted-data.json](tests/data/extracted-data.json)
- End-to-end test: [tests/semanticTransformer.spec.ts](tests/semanticTransformer.spec.ts)

## What is exported

- `SemanticTransformer` (`ITransformer`) — registers the JSON-LD, UN/CEFACT and trade document data types and performs the transformation.
