# twin-trade-document

Trade document schemas for the TWIN platform.

This repository defines the **output schemas** of an OCR/extraction pipeline that turns scanned
coffee trade documents into validated, normalized, UN/CEFACT-aligned JSON-LD records stored in
TWIN Core.

The deliverable of this repository is *not* the pipeline — it is the **contract**: a set of
TypeScript interfaces from which JSON Schemas and JSON-LD contexts are generated automatically,
so that the extractor, the reviewer UI, TWIN Core and third-party consumers all agree on the
same shape.

---

## 1. Where this sits in the pipeline

The end-to-end design lives in `.context/OCR.pdf`. Summarised:

```
1. File ingestion        PDF (native text) → PDF analyzer
                         PDF (scanned) / image → Paddle OCR

2. Data extraction       Single LLM pass (QWEN, hosted in EU).
   [stochastic]          VERBATIM extraction only — no normalization here.
                         Output conforms to the *Extraction Schema* (1:1 copy of the document).

3. Data normalization    Deterministic. Normalize (Spain → ES, Hong Kong → HK) and align to
   [deterministic]       UN/CEFACT + ISO code lists.
                         Output conforms to the *Output Schema*  ← THIS REPOSITORY

3A. Manual approval      Before committing, a human MUST approve or correct the parsed fields.

4. Storage               TWIN Core: one auditable-item-graph node per document, carrying a
                         UN/CEFACT JSON-LD annotation object with ISO code values throughout.
```

Two consequences drive every modelling decision here:

- **Schemas are generated, never hand-written.** You edit TypeScript; `ts-to-schema` produces the
  JSON Schema. Hand-editing `src/schemas/*.json` is always wrong — it is regenerated on build.
- **Terms are reused, not reinvented.** A property should come from `@twin.org/standards-unece`
  wherever UN/CEFACT already defines it. Locally invented property names are technical debt that
  breaks alignment with downstream consumers (OCR, TWIN Core, TWIN Finance).

## 2. Target document set

Seven coffee trade documents are in scope. Sample PDFs for each live in `.context/Document Samples/`.

| # | Document | Sample folder | Model | Status |
|---|---|---|---|---|
| 1 | Sales contract / Sale confirmation | `01-Sale Confirmation(s)` | `ITradeAgreement` | strawman |
| 2 | Buyer purchase order | `02-Buyer Purchase Contract(s)` | `IPurchaseOrder` | strawman |
| 3 | Auction purchase confirmation (Coffee DSS invoice) | `12- Auction Purchase Confirmation(s)` | `IAuctionPurchaseConfirmation` | not started |
| 4 | Coffee warrant | `03-Storage Warrant(s)-…` | `IWarrant` | not started |
| 5 | Warehouse delivery note | `13- Warehouse Delivery Note(s)` | `IDeliveryNote` | not started |
| 6 | Transfer note | — (no sample yet) | `ITransferNote` | not started |
| 7 | Holding certificate | `05-Holding Certificate(s)` | `IHoldingCertificate` | not started |

Supporting types shared by all of them: `ITradeParty`, `ITradeItem`.

See [`packages/trade-document-models/docs/model-guide.md`](packages/trade-document-models/docs/model-guide.md)
for the per-model state of play, the field-by-field mapping against the sample documents, and the
step-by-step recipe for adding the next one.

## 3. Repository layout

The repo is monorepo-*shaped* but has **no root `package.json` and no workspace tooling**. Every
npm command runs from inside the package directory.

```
twin-trade-document/
├── README.md                          ← this file
├── CLAUDE.md                          ← agent guidance (gitignored)
├── .context/                          ← research inputs, gitignored, not shipped
│   ├── OCR.pdf                        ← end-to-end pipeline design
│   ├── vocabulary_reference.md        ← UN/CEFACT Web Vocabulary (BSP) reference — see §4
│   ├── Document Samples/              ← real coffee trade documents, per type
│   └── twin-standards/                ← checkout of iotaledger/twin-standards (read-only reference)
└── packages/
    └── trade-document-models/         ← the only package: @twin.org/trade-document-models
        ├── src/
        │   ├── models/                ← hand-written TypeScript — THE SOURCE OF TRUTH
        │   │   ├── ITradeAgreement.ts
        │   │   ├── IPurchaseOrder.ts
        │   │   ├── ITradeItem.ts
        │   │   ├── ITradeParty.ts
        │   │   ├── tradeDocumentTypes.ts     ← JSON-LD @type values
        │   │   └── tradeDocumentContexts.ts  ← JSON-LD @context / namespace URLs
        │   ├── schemas/               ← GENERATED and committed — do not hand-edit
        │   │   ├── TradeAgreement.json
        │   │   ├── TradeItem.json
        │   │   ├── TradeParty.json
        │   │   └── types.jsonld
        │   ├── dataTypes/
        │   │   └── tradeDocumentDataTypes.ts ← binds each @type to its JSON Schema at runtime
        │   └── index.ts               ← the single barrel export
        ├── tests/
        ├── locales/en.json            ← error message strings, checked by validate-locales
        ├── docs/
        │   └── model-guide.md         ← where to put your hands, per model
        ├── ts-to-schema.json          ← which models get a schema, and external $ref mapping
        ├── ts-to-jsonld-context.json  ← JSON-LD context generation config
        ├── tsconfig.json              ← note the ts-patch `plugins` entry
        └── vitest.config.ts
```

## 4. Two UN/CEFACT vocabularies — read this before modelling

This is the single most confusing thing about the repository. **There are two different UN/CEFACT
vocabularies in play, and they are not interchangeable.**

| | **BSP D23B** (what the code compiles against) | **Web Vocabulary** (what `vocabulary_reference.md` documents) |
|---|---|---|
| Namespace | `https://vocabulary.uncefact.org/` | `https://test.uncefact.org/vocabulary/` |
| Available as TypeScript | **yes** — `@twin.org/standards-unece`, 394 interfaces | **no** — reference document only |
| Size | ~394 classes, 640 type constants | 87 classes, 738 properties, 110 code lists |
| Status | released (D23B) | every term is `ts:proposed`; terms may vanish without deprecation |
| Sales contract class | `HeaderTradeAgreement` (69 props, one date) | `TradeAgreement` (21 props) |
| Line item class | `SupplyChainTradeLineItem` + `LineTradeAgreement` + `LineTradeDelivery` | `TradeItem` (6 props) |
| Party class | `TradeParty` | `Party` |
| Buyer / seller | `buyerParty` / `sellerParty` | `buyer` / `seller` |
| Header→lines link | `SupplyChainTradeTransaction.includedSupplyChainTradeLineItem` | `TradeAgreement.includesItem` |
| Ordered quantity | `…LineTradeDelivery.orderQuantity` | `TradeItem.orderedQuantity` |
| Incoterm | `DeliveryTerms.deliveryTermsDeliveryTypeCode` | `TradeAgreement.incotermsCode` |

The Web Vocabulary is a *distillation* of BSP — much friendlier for an extraction pipeline — but
until `@twin.org/standards-unece` ships interfaces for it, **only the BSP model is usable in code**.

Practical rules:

1. Any type you `import { IUnece… } from "@twin.org/standards-unece"` is **BSP**.
2. Before adding a local property, `grep` for it under
   `.context/twin-standards/packages/standards-unece/src/models/bsp/`. If BSP already has it, use
   the BSP spelling.
3. If BSP genuinely lacks it, prefer the **Web Vocabulary** spelling for the local property, so the
   eventual migration is a rename and not a redesign. Document the choice in the property's TSDoc.
4. `vocabulary_reference.md` is a *design* reference. Never cite it as proof that a TypeScript
   property exists.

## 5. How a model becomes a validated schema

```
  src/models/IFoo.ts                       (hand-written TypeScript)
          │
          │  npm run build:schema  ─  ts-to-schema, driven by ts-to-schema.json
          ▼
  src/schemas/Foo.json                     (JSON Schema draft 2020-12, committed)
          │
          │  npm run build:jsonld-context  ─  ts-to-jsonld-context
          ▼
  src/schemas/types.jsonld                 (JSON-LD context, committed)
          │
          │  npm run build:compile  ─  tspc (ts-patch), copies JSON into dist/es/schemas
          ▼
  TradeDocumentDataTypes.registerTypes()   (src/dataTypes/tradeDocumentDataTypes.ts)
          │
          ▼
  DataTypeHelper.validate(…)               (consumer validates a payload)
```

### 5.1 Commands

All from `packages/trade-document-models`:

```shell
npm run build          # schema → jsonld-context → compile, in that order
npm run build:schema   # ts-to-schema: TS types → src/schemas/*.json
npm run build:jsonld-context
npm run build:compile  # tspc (ts-patch compiler)

npm test               # vitest, single run
npm run test:coverage
npm run test:build     # type-check the tests (tspc -p tests/tsconfig.json --noEmit)
npm run validate-locales

npm run docs           # typedoc → docs/reference (markdown)
npm run dist           # clean + build + validate-locales + test:build + test — the full gate
```

Run a single test file or test name:

```shell
npx vitest --run --config ./vitest.config.ts tests/dataTypes/tradeDocumentDataTypes.spec.ts
npx vitest --run --config ./vitest.config.ts -t "Can validate an empty Trade Agreement"
```

Requires Node >= 24. ESM only (`"type": "module"`), so relative imports carry the `.js` extension.

### 5.2 Build-chain specifics you will trip over

- **Use `tspc`, not `tsc`.** `tsconfig.json` declares
  `"plugins": [{ "transform": "@twin.org/nameof-transformer" }]`, and `plugins` is only honoured by
  ts-patch. Running `tsc` directly silently drops `nameof` resolution. Tests get the equivalent via
  `NameOfPlugin` in `vitest.config.ts`.
- **`src/schemas/` is generated output that is also committed.** `npm run clean` deletes it
  (`rimraf dist coverage src/schemas`); `build:schema` regenerates it. After changing a model,
  rerun the build and commit the regenerated schema in the same commit.
- **A new model file is invisible until it is listed in `ts-to-schema.json`.** The `types` array
  holds *file paths*, not type names; each entry produces one output file, named from the file
  basename with the `I` prefix stripped (`ITradeAgreement.ts` → `TradeAgreement.json`).
- **`externalReferences` maps imported types to hosted URLs.** `"IUnece(.*)"` compiles to
  `/^IUnece(.*)$/` and rewrites `IUneceTradeParty` → `https://schema.twindev.org/unece/UneceTradeParty`.
  Without a matching entry, an imported type would be emitted as a local `$ref` that resolves to
  nothing.
- **All `@twin.org/*` deps are pinned to the `next` dist-tag.** They are moving targets; an
  unexplained type error after `npm install` may come from a dependency bump rather than local code.
- **There is no lint script and no eslint/prettier config**, despite `eslint-disable` comments
  inherited from the upstream template.

### 5.3 What `ts-to-schema` actually does with the model idiom

`ts-to-schema` parses the TypeScript **AST only** — there is no type checker — and pattern-matches
on type nodes. Three behaviours matter:

**`Required<Pick<Base, K>>` is inlined, and makes *every* picked key required.** The generator
resolves `Base` to a concrete object schema (following the import into
`node_modules/@twin.org/standards-unece/dist/types/**.d.ts`), picks the keys, then sets
`required = Object.keys(properties)` unconditionally. This is the mechanism that promotes optional
UN/CEFACT fields to mandatory.

**Intersections are flattened only if every member is an object or a bare `$ref`.** Bare `$ref`
members are preserved into `allOf` and contribute no properties. Later members overwrite earlier
ones, which is how `ITradeAgreement`'s local `buyerParty: ITradeParty` overrides the picked
`buyerParty: IUneceTradeParty`.

**A trailing `& { }` breaks the flattening.** An empty type literal maps to `{ "type": "object" }`
with no `properties`, the merge aborts, and the output degrades to a raw three-branch `allOf` with a
dead `{"type":"object"}` element. `ITradeParty.ts` and `ITradeItem.ts` both end in `& { }` today and
both produce that degraded shape — compare `TradeParty.json` with `TradeAgreement.json` to see it.

**JSDoc is load-bearing.** The leading description becomes the schema `description`; `@json-schema
format:date-time` becomes `"format": "date-time"`. Note that these ride in from the dependency's
shipped `.d.ts` too — `buyerApprovedDateTime`'s `format` in `TradeAgreement.json` comes from
`IUneceHeaderTradeAgreement.d.ts`, not from any file in this repo.

### 5.4 Runtime registration and validation

`TradeDocumentDataTypes.registerTypes()` calls
`DataTypeHelper.registerTypes(namespace, jsonLdContext, types)`, which registers each schema under
the **raw string concatenation** `namespace + type`. The schema's own `$id` is never consulted.

```ts
JsonLdDataTypes.registerTypes();
UneceDataTypes.registerTypes();      // see the gotcha below
TradeDocumentDataTypes.registerTypes();

await DataTypeHelper.validate(
  "",
  `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.TradeAgreement}`,
  payload,
  validationFailures
);
```

Two traps:

- **A wrong type URL silently passes.** `DataTypeHelper.validate` returns `true` when nothing is
  registered under the given key, unless `failOnMissingType` is set. Always build the key from the
  constants, never by hand.
- **Consumers should also call `UneceDataTypes.registerTypes()`** from `@twin.org/standards-unece`
  before validating. Otherwise every `https://schema.twindev.org/unece/*` `$ref` in the generated
  schemas is fetched over HTTP at first compile (~95 s cold, and silently degraded to `{}` when
  offline). This is exactly why the current test suite takes 95 seconds and needs internet access.

## 6. Current state

Bootstrapped from the `twin-auditable-item-graph` template; the port is incomplete. Treat the
following as work in progress, **not** as conventions to copy.

**Verified working**

- `npm run build` exits 0, with no warnings. The committed `src/schemas/*` are in sync with the
  sources (a rebuild produces a zero-byte diff).
- `npm run validate-locales` and `npm run test:build` both pass.

**Verified broken**

- **`npm test` is RED**: 1 failed, 1 skipped, 0 passed. `Can validate an empty Trade Agreement`
  sends `{ "@context": […], type, issueDate }` but `TradeAgreement.json` requires 7 properties, and
  `issueDate` is a typo for the model's `issueDateTime` — silently ignored, because no schema emits
  `additionalProperties: false`. Result: `expected 6 to deeply equal +0`.
- The skipped test `Can fail to validate an empty Trade Agreement` asserts 3 validation failures;
  the real number is 8 (7 local `required` + `type` from the remote UNECE base). The `3` is
  template residue.
- **Registration key ≠ schema `$id`.** `TradeAgreement.json` has
  `$id: …/trade-document/TradeAgreement` but is registered under
  `…/trade-document/HeaderTradeAgreement` (because `TradeDocumentTypes.TradeAgreement` resolves to
  `UneceTypes.HeaderTradeAgreement`). Same for `TradeItem` / `LineTradeAgreement`. Consequence: a
  `$ref` to `…/trade-document/TradeItem` cannot be resolved locally, goes to the network and 404s,
  so `includesTradeItem[]` elements are effectively unvalidated.
- **`src/index.ts` does not export `ITradeParty`, `ITradeItem` or `IPurchaseOrder`.** Anything
  public must be re-exported there; `ITradeAgreement.buyerParty: ITradeParty` currently references a
  type consumers cannot import.
- **`TradeDocumentContexts` is internally inconsistent**: `Namespace` is
  `https://schema.twindev.org/trade-document/`, `Context` is `https://unvtd.unece.org/`,
  `ContextTradeAgreement` is the UNECE D23B context, `ContextPurchaseOrder` is a third URL. Nothing
  cross-checks them at runtime.
- **`TradeDocumentTypes.PurchaseOrder` is the empty string**; `IPurchaseOrder` has no schema, is not
  in `ts-to-schema.json`, and is not registered.
- **`ts-to-jsonld-context.json` still uses the `twin-aig` prefix and an empty `types` array**, so
  `types.jsonld` is generated near-empty. Note that simply adding the model files will not work:
  the generator only visits `interface` declarations, and `ITradeAgreement` / `ITradeParty` /
  `ITradeItem` are type *aliases*.

**Template residue**

`docs/examples.md` and `docs/changelog.md` still describe the auditable-item-graph package;
doc comments across `src/models/` and `src/dataTypes/` still say "auditable item graph"; the test
`describe` block is named `AuditableItemGraphDataTypes`.

## 7. Adding a new document model

1. Read the samples in `.context/Document Samples/<folder>/` and build a field inventory
   (label → verbatim value → header/line → semantic meaning).
2. Find the BSP class that owns each field. `grep` under
   `.context/twin-standards/packages/standards-unece/src/models/bsp/`. Do not guess property names.
3. Create `src/models/IFoo.ts` following the house idiom — intersect the UN/CEFACT interface with a
   `Required<Pick<…>>` to promote the fields the document always carries, then add local fields:

   ```ts
   export type IFoo = IUneceBar &
     Required<Pick<IUneceBar, "@context" | "someAlwaysPresentField">> & {
       /** TSDoc here — it becomes the schema description. */
       localField: string;
     };
   ```

   Do **not** end the type with `& { }` (see §5.3).
4. Add a `@type` value to `tradeDocumentTypes.ts` and a context URL to `tradeDocumentContexts.ts`.
5. Add the file path to the `types` array in `ts-to-schema.json`.
6. Register the generated schema in `src/dataTypes/tradeDocumentDataTypes.ts`.
7. Re-export the type from `src/index.ts`.
8. `npm run build`, then commit the regenerated `src/schemas/*.json` alongside the source.
9. Add a test that validates a payload built from a real sample document.

## Licence

Apache-2.0. See [LICENSE](packages/trade-document-models/LICENSE).
