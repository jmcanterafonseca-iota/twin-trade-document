# Model guide — where to put your hands

Companion to the repository [README](../../../README.md). The README explains *how the machinery
works*; this document explains *what the models currently say, where they are wrong, and what to
change next*.

Every UN/CEFACT claim below was verified against
`.context/twin-standards/packages/standards-unece/src/models/bsp/` (394 interfaces, BSP D23B —
identical to the installed `@twin.org/standards-unece@0.9.2-next.1`). File:line references are to
that checkout.

---

## 1. The house idiom

All four models follow one pattern: **take a UN/CEFACT interface, promote the fields the document
always carries to mandatory, then add what UN/CEFACT does not have.**

```ts
export type IFoo = IUneceBar &
  Required<Pick<IUneceBar, "@context" | "alwaysPresentField">> & {
    localField: string;
  };
```

The `Required<Pick<…>>` member is what `ts-to-schema` turns into the schema's `required` array;
everything upstream is optional, so without it nothing would be required at all.

Two mechanical rules:

- **Never end the type with `& { }`.** An empty type literal aborts the intersection flattening and
  degrades the generated schema to a three-branch `allOf` with a dead `{"type":"object"}` element.
- **Write TSDoc on every local property.** It is the only source of the schema `description`, and
  the only place to record why a local property exists instead of a UN/CEFACT one. Keep it short:
  the whole comment is copied verbatim into the published schema.
- **Promote `type` as well as `@context`.** `Required<Pick<Base, "type">>` is a semantic no-op —
  `type` is already mandatory upstream — but it surfaces the JSON-LD `@type` const into the local
  schema, so the discriminator is checked without resolving the remote UN/CEFACT `$ref`.

## 2. Model-by-model state of play

All four models are wired end to end: listed in `ts-to-schema.json`, generating a schema, registered
in `tradeDocumentDataTypes.ts`, exported from `src/index.ts`, and exercised by a test built from a
real sample document.

### 2.1 `ITradeParty` — *supporting type*

```ts
export type ITradeParty = IUneceTradeParty &
  Required<Pick<IUneceTradeParty, "@context" | "type" | "name">>;
```

| | |
|---|---|
| Base | `IUneceTradeParty` (82 properties) |
| Promoted | `@context`, `type`, `name` |
| Schema | `src/schemas/TradeParty.json` — flat shape, **and** hoisted into each document's `$defs` |
| Registered as | `https://schema.twindev.org/trade-document/TradeParty` |

It carries `@json-schema embedded:defs`, so `TradeAgreement.json` and `PurchaseOrder.json` reference
it as `#/$defs/TradeParty` instead of by external URL. See §7 for what that tag does and does not
fix.

`name` is promoted rather than `postalAddress`: two of the three sample documents give the
counterparty as a bare name (`D.R. Wakefield & Company Ltd. United Kingdom`, `Jowam Coffee Trading
Co Ltd`), so requiring an address would reject a real document. `postalAddress` is still available,
optional, from the base.

Useful `IUneceTradeParty` properties not yet promoted: `identifier` (:1266), `registeredId` (:1344),
`partyRoleCode` (:1302 — carries `Buyer`/`Seller`/`Exporter` from `UnecePartyRoleCodeList`),
`specifiedLegalOrganization` (:1452), `definedContact` (:1218), `emailURICommunication` (:1236),
`telephoneCommunication` (:1494), `uRICommunication` (:1506),
`specifiedAuthoritativeSignatoryPerson` (:1404).

### 2.2 `ITradeItem` — *supporting type*

```ts
export type ITradeItem = IUneceSupplyChainTradeLineItem &
  Required<
    Pick<
      IUneceSupplyChainTradeLineItem,
      | "@context" | "type" | "associatedDocumentLineDocument"
      | "specifiedTradeProduct" | "specifiedLineTradeDelivery"
    >
  > & {
    specifiedLineTradeAgreement: IUneceLineTradeAgreement &
      Required<Pick<IUneceLineTradeAgreement, "agreedPriceProductPrice">>;
  };
```

| | |
|---|---|
| Base | `IUneceSupplyChainTradeLineItem` (re-based from `IUneceLineTradeAgreement`) |
| Promoted | `@context`, `type`, line document, product, delivery, agreement |
| Schema | `src/schemas/TradeItem.json` — flat shape, with a nested narrowed agreement |
| Registered as | `https://schema.twindev.org/trade-document/TradeItem` |

**Why the re-base was unavoidable.** `IUneceLineTradeAgreement` is the *pricing and contractual
terms* facet of a line. It carries no quantity and no product, so it could not express
`200 Bags AB Asali` — the primary content of every line on every sample:

| What a line needs | UN/CEFACT location | On `LineTradeAgreement`? |
|---|---|---|
| Ordered quantity (`200`) | `IUneceLineTradeDelivery.orderQuantity` (:375) | no |
| Product / grade / mark (`Asali, AB`) | `IUneceSupplyChainTradeLineItem.specifiedTradeProduct[]` (:227) | no |
| Line number (`46690`, `ctr/742`) | `IUneceSupplyChainTradeLineItem.associatedDocumentLineDocument` (:95) | no |
| Unit price (`290.00 USD / 50 kg`) | `IUneceLineTradeAgreement.agreedPriceProductPrice[]` | yes |

`IUneceSupplyChainTradeLineItem` is the join node reaching all four. The quantities that *are* on
`LineTradeAgreement` — `economicOrderQuantity` (:137), `minimum`/`maximum`/
`incrementalProductOrderableQuantity` — are ordering **constraints**, not the ordered amount; do not
repurpose them.

The previous model's mandatory `agreedPriceProductPrice` is preserved one level down, by narrowing
`specifiedLineTradeAgreement` inline. `ts-to-schema` renders that as a nested object with its own
`required` and its own `allOf` `$ref` to `UneceLineTradeAgreement` — an anonymous type literal, so
it needs no file of its own. (A *named* exported intermediate type would: `ts-to-schema` would emit
a `$ref` to a schema it never generates.)

### 2.3 `ITradeAgreement` — *sale confirmation / sales contract*

```ts
export type ITradeAgreement = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "sellerReference">> & {
    issueDateTime: string;
    buyerParty: ITradeParty;
    sellerParty: ITradeParty;
    includedSupplyChainTradeLineItem?: ITradeItem[];
  };
```

| | |
|---|---|
| Base | `IUneceHeaderTradeAgreement` (69 properties) — unchanged |
| Required | `@context`, `type`, `sellerReference`, `issueDateTime`, `buyerParty`, `sellerParty` |
| Schema | `src/schemas/TradeAgreement.json` |
| Registered as | `https://schema.twindev.org/trade-document/TradeAgreement` |
| Payload `type` | `HeaderTradeAgreement` |

What changed and why:

- `includesTradeItem` → `includedSupplyChainTradeLineItem`. The old name exists in neither
  vocabulary — `grep -rn "includesTradeItem"` over all 394 BSP interfaces returns zero matches. The
  new name is a real UN/CEFACT term.
- It is now **optional**. The Blaser sale confirmation states quantity, quality and price at header
  level and has no line breakdown at all; requiring lines made that document unrepresentable.
- `buyerApprovedDateTime` is no longer required. It is the *buyer's* approval timestamp, and the
  buyer's acceptance block is unsigned on both sale confirmation samples.
- `issueDateTime` gained TSDoc and `@json-schema format:date-time`, so the generated schema now
  carries a description and enforces the format.
- `buyerParty`/`sellerParty` were declared twice, in the `Pick<>` list *and* in the local literal.
  The local narrowing alone makes them required, so the duplicate `Pick<>` entries are gone.

Everything the samples need at header level is inherited from the base and needs no local
declaration: `applicableDeliveryTerms` (Incoterm + named place), `applicablePaymentTerms`,
`shippingPeriod`, `applicableLocation[]` (destination), `buyerReference`, `contractDocument[]`,
`salesConditionsDocument[]`, `applicableRegulatoryProcedure[]`.

### 2.4 `IPurchaseOrder` — *buyer purchase order*

```ts
export type IPurchaseOrder = IUneceHeaderTradeAgreement &
  Required<
    Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "identifier" | "applicableLocation">
  > & {
    issueDateTime: string;
    buyerParty: ITradeParty;
    sellerParty: ITradeParty;
    includedSupplyChainTradeLineItem: ITradeItem[];
  };
```

| | |
|---|---|
| Base | `IUneceHeaderTradeAgreement` — was a standalone `interface` with no base |
| Required | `@context`, `type`, `applicableLocation`, `issueDateTime`, `buyerParty`, `sellerParty`, `includedSupplyChainTradeLineItem` |
| Schema | `src/schemas/PurchaseOrder.json` — new |
| Registered as | `https://schema.twindev.org/trade-document/PurchaseOrder` |
| Payload `type` | `HeaderTradeAgreement` |

**The mandatory set is UNVTD's, translated.** Unlike `ITradeAgreement`, this document has a
published UN/CEFACT counterpart, so its required properties are taken from
`https://unvtd.unece.org/purchase-order-schema.yaml` and expressed in the D23B terms that schema's
own context expands its wire names into:

| UNVTD `credentialSubject` required | context expands to | here |
|---|---|---|
| `purchaseOrderNumber` | `unece:identifier` | `identifier` — **optional here**, see below |
| `orderDate` | `unece:issueDateTime` | `issueDateTime` |
| `buyer` | `unece:buyerParty` | `buyerParty` |
| `seller` | `unece:sellerParty` | `sellerParty` |
| `deliveryLocation` | `unece:shipToParty` | `applicableLocation` — see below |
| `orderedItems` (`minItems: 1`) | `unece:includedSupplyChainTradeLineItem` | `includedSupplyChainTradeLineItem`, no longer optional |

A test asserts this correspondence property by property, so the two cannot drift apart silently.

Two notes on the translation:

- **`deliveryLocation`.** UNVTD maps it onto `unece:shipToParty`, a *Party* class that lives on the
  delivery facet and is not reachable from a header trade agreement. A delivery address is a place,
  not a party, so `applicableLocation: IUneceLogisticsLocation[]` is used instead, with
  `locationFunctionTypeCode` set to `UneceLocationFunctionCodeList.PlaceOfDelivery`
  (`unece:LocationFunctionCodeList#7`). The sample's `CWT, Tilbury, United Kingdom` decomposes into
  `name`, `description`, `countryName` and `logisticsLocationCountryId`.
- **`purchaseOrderNumber` → `identifier`, not `buyerReference`.** `identifier` is the document's own
  number; `buyerReference`/`sellerReference` are the *counterparty's* references as cited. UNVTD
  defines `purchaseOrderNumber` as "Identifier assigned by the buyer to an order", and its context
  points at `unece:identifier`.
  **It is the one required property not carried over**, and deliberately. The sample contract
  numbers each line (`46690`/`46691`/`46692`) and has none at document level, so making it mandatory
  would force a value that appears nowhere on the paper. Representing the real documents without
  inventing data outranks matching a published required set, so `identifier` stays optional and is
  left absent. This is the only place where the two priorities conflict, and the first one wins.

`ITradeAgreement` keeps its own evidence-driven required set instead, because UNVTD publishes no
sale-confirmation schema to align to (§6.1).

The old model transcribed UNVTD's wire names onto BSP types — matching UNVTD on names only and D23B
on types only, so it would not have serialised correctly for either. The migration:

| was (UNVTD wire name) | now (D23B) | note |
|---|---|---|
| `buyer`, `seller` | `buyerParty`, `sellerParty` | inherited from the base |
| `orderDate` | `issueDateTime` | |
| `purchaseOrderNumber` | `identifier` | |
| `orderedItems` | `includedSupplyChainTradeLineItem` | |
| `paymentTerms` | `applicablePaymentTerms` | inherited; UNVTD types it as a bare string, D23B as an object |
| *(absent)* | `applicableLocation` | UNVTD's required `deliveryLocation` was missing entirely |
| `invoicee` | *(dropped)* | `IUneceHeaderTradeSettlement.invoiceeParty`; on no sample |
| `paymentMethod` | *(dropped)* | `specifiedPaymentMeans[]` on the settlement facet |
| `allowanceCharge` | *(dropped)* | `specifiedAllowanceCharge[]` on the settlement facet |
| `totalOrderAmount` | *(dropped)* | settlement monetary summation; on no sample |
| `"@context": ContextPurchaseOrder` | `UneceContextType` from the base | that URL is live, but it is the *per-document* UNVTD context and defines none of these terms |

The four dropped properties all belong on `IUneceHeaderTradeSettlement` and appear on neither
D.R. Wakefield document. When a settlement facet is genuinely needed — the Coffee DSS invoice will
need one — add it then, under its real UN/CEFACT name.

### 2.4.1 Where the contract table columns live

Nothing from the buyer's table is declared on `IPurchaseOrder` itself: it is all on
{@link ITradeItem}, one level down. A test asserts each of these against the fixture.

| column | sample | path from `includedSupplyChainTradeLineItem[]` |
|---|---|---|
| `Contract No` | `46690` | `associatedDocumentLineDocument.lineId` |
| `Origin` | `Kenya` | `specifiedTradeProduct[].originCountry[].countryId` (`UneceCountryId.KENYA`) |
| `Quality` | `Asali,AB` | `specifiedTradeProduct[].name` = `Asali`, `.designation` = `AB` |
| `Quantity` | `200` | `specifiedLineTradeDelivery[].orderQuantity.QuantityTypeValue` |
| `Unit Type` | `Grain Pro` | `specifiedLineTradeDelivery[].includedPackaging[].packageTypeCode` = `UnecePackageTypeCodeList.Bag`, `.description` = `Grain Pro` |
| `Kg per Unit` | `60` | `specifiedLineTradeDelivery[].perPackageUnitQuantity.QuantityTypeValue` |
| `Price` | `290.00` | `specifiedLineTradeAgreement.agreedPriceProductPrice[].unitAmount[].AmountTypeValue` |
| `Units` | `$/50kg` | `.unitAmount[].AmountTypeCurrency` = `USDollar`, `.basisQuantity.QuantityTypeValue` = `50` |

Because both the 50 kg price basis and the 60 kg per bag are expressible, the contract total is
computable from the model: `(200 × 60 ÷ 50 × 290) + (50 × 60 ÷ 50 × 296) + (70 × 60 ÷ 50 × 318)` =
**114,072 USD**. A test asserts that figure. UNVTD's `unitPrice` is `{amount, currency}` with no
basis quantity and its `quantityOrdered` is a bare number, so the same three lines there read as
**95,060 USD** — see §6.2.

One residual gap: `perPackageUnitQuantity` carries `60` but not `kg`. `IUneceQuantityCode` declares
no value property at all — only `@context` and `type` — so `IUneceQuantityType` cannot express its
unit of measure. This affects every quantity in the package. See §4.2.

### 2.5 The two off-domain properties

`issueDateTime` and `includedSupplyChainTradeLineItem` are real UN/CEFACT terms used **off-domain**:
D23B declares both on `SupplyChainTradeTransaction`, not on `HeaderTradeAgreement`. BSP domains are
`schema:domainIncludes`-style and therefore non-constraining, so both still expand correctly under
the D23B context — unlike `includesTradeItem`, which expanded to nothing.

**UNECE does exactly the same thing.** The published UNVTD purchase-order context declares
`"PurchaseOrder": "unece:HeaderTradeAgreement"`, `"orderDate": "unece:issueDateTime"` and
`"orderedItems": "unece:includedSupplyChainTradeLineItem"` — the same two terms, hung off the same
class. See §6. So this is the sanctioned shape for this document type, not a local shortcut.

The alternative is to re-root both documents on `IUneceSupplyChainTradeTransaction`, which owns
`issueDateTime` natively and is the only class UN/CEFACT gives a link to line items:

```
IUneceSupplyChainTradeTransaction
├── applicableHeaderTradeAgreement   : IUneceHeaderTradeAgreement[]      (:44)
├── applicableHeaderTradeDelivery    : IUneceHeaderTradeDelivery[]       (:50)
├── applicableTradeSettlement        : IUneceHeaderTradeSettlement       (:62)
└── includedSupplyChainTradeLineItem : IUneceSupplyChainTradeLineItem[]  (:123)
```

That removes both deviations and gives the delivery and settlement facets a proper home — at the
cost of four more files and a deeper access path for the extraction pipeline
(`doc.applicableHeaderTradeAgreement[0].buyerParty.name` instead of `doc.buyerParty.name`). It was
measured, not guessed: the faithful variant compiles clean and generates 8 schemas totalling ~8 KB
against the current 4. It is the recommended direction once the extraction layer is settled.

### 2.6 Supporting files

**`tradeDocumentTypes.ts`** — now local profile names (`"TradeAgreement"`, `"PurchaseOrder"`,
`"TradeItem"`, `"TradeParty"`) instead of aliases of `UneceTypes`. Two reasons:

1. A sale confirmation and a purchase order are the *same* UN/CEFACT class. Deriving both from
   `UneceTypes` would key both registrations on `…/trade-document/HeaderTradeAgreement`, and the
   second would silently overwrite the first in `DataTypeHandlerFactory`.
2. Each value now equals its schema's `$id`, so a `$ref` between the generated schemas resolves
   against the local factory instead of 404-ing over HTTP.

Note the consequence: **`TradeDocumentTypes.X` is the registration key, not the payload's `type`.**
A payload's JSON-LD `@type` stays the UN/CEFACT class name that the base pins it to —
`HeaderTradeAgreement` for both document models.

**`tradeDocumentContexts.ts`** — reduced to `Namespace`, `Context` and `JsonSchemaNamespace`.
`Context` is now `UneceContexts.Context` (the D23B context), because every property in every model
comes from BSP D23B. The removed `ContextTradeAgreement` and `ContextPurchaseOrder` pointed at
`https://unvtd.unece.org/…`, a host that appears nowhere in `standards-unece` and publishes no
context document.

**`tradeDocumentDataTypes.ts`** — registers all four schemas. Its TSDoc now tells consumers to call
`UneceDataTypes.registerTypes()` first.

**`index.ts`** — exports all four models plus the two const objects.

**`ts-to-schema.json`** — lists all four model files.
## 3. What the sample documents actually contain

Samples analysed:

- `01-Sale Confirmation(s)/Seller_s Sale Confirmation (D.R. Wakefield).pdf` — Jowam → D.R. Wakefield
- `01-Sale Confirmation(s)/Seller_s Sale Confirmation (Blaser Trading)_.webp` — Jowam → Blaser
- `02-Buyer Purchase Contract(s)/Buyer_s Purchase Contract.pdf` — D.R. Wakefield ← Jowam

The first and the third **describe the same trade**, issued four days apart from opposite sides.

### 3.1 Field coverage matrix

`✔` = the model can carry it today. `~` = the base interface has a home for it, but the model does
not use it. `✘` = no home anywhere in BSP.

**Header level**

| Document field | Sample value | BSP path | Status |
|---|---|---|---|
| Seller's reference | `S - JCT / 742-744` | `HeaderTradeAgreement.sellerReference` (:414) | ✔ |
| Buyer's reference | `TBA` / `46690`… | `HeaderTradeAgreement.buyerReference` (:120) | ~ |
| Document issue date | `6th September 2024` | *not on HeaderTradeAgreement* — `SupplyChainTradeTransaction.issueDateTime` (:142) or `Document.issueDateTime` (:212) | local `issueDateTime` |
| Agreement date ("having sold on …") | `6th September 2024` | — (BSP has no `agreementDate`; Web Vocabulary does) | ✘ |
| Buyer party | `D.R. Wakefield & Company Ltd.` | `buyerParty` (:114) | ✔ |
| Seller party | `Jowam Coffee Traders Co. Ltd.` | `sellerParty` (:408) | ✔ |
| Buyer acceptance date | stamp `10 SEP 2024` | `buyerApprovedDateTime` (:95) | ✔ |
| Total quantity | `320 Bags of 60 kg net` | `HeaderTradeDelivery.agreedQuantity` (:89) — different class | ~ |
| Incoterm | `FOB` / `Free On Board` | `applicableDeliveryTerms` (:46) → `DeliveryTerms.deliveryTermsDeliveryTypeCode` (:43) = `UneceDeliveryTermsCodeList.FreeOnBoard` = `unece:DeliveryTermsCodeList#FOB` | ~ |
| Named place | `FOB origin` | `DeliveryTerms.relevantLocation` (:67) → `TradeLocation.name` | ~ |
| Weight basis | `Net Shipping Weight` / `N.S.W` | — | ✘ |
| Weight franchise | `0.5% franchise` | — | ✘ |
| Tare method | `Actual Tare` | — | ✘ |
| Shipment period | `November 2024`, `July/August 2025` | `shippingPeriod` (:425) → `IUneceSpecifiedPeriod` | ~ |
| Destination | `CWT, Tilbury, United Kingdom` | `applicableLocation[]` (:64) → `IUneceLogisticsLocation` | ~ |
| Payment terms | `Nett Cash Against Documentation on first presentation in London` | `applicablePaymentTerms` (:70) → `IUnecePaymentTerms` | ~ |
| Insurance allocation | `For buyer's account.` | — (BSP `IUneceCargoInsurance` exists but is not reachable from the agreement) | ✘ |
| Condition precedent | `Subject to approval of preshipment sample by buyer.` | `salesConditionsDocument[]` (:384) / `purchaseConditionsDocument[]` (:306) — both `IUneceDocument`, awkward for a sentence | ~/✘ |
| Governing terms | `European Standard Contract for Coffee, latest edition` | `contractDocument[]` (:174) | ~ |
| Arbitration seat | `London Arbitration` | — | ✘ |
| Regulatory declaration | `EUDR Compliant` | `applicableRegulatoryProcedure[]` (:77) | ~ |
| Shipment detail | `Buyer to nominate vessel.` | — | ✘ |
| Packaging (inner) | `GrainPro`, `Grain Pro` | `TradeProduct` / `IUneceSupplyChainPackaging` — line level | ~ |
| Total contract value | `160,896.00` (handwritten) | `HeaderTradeSettlement` monetary summation — different class | ~ |

**Line level**

| Document field | Sample value | BSP path | Status |
|---|---|---|---|
| Line contract number | `46690`, `ctr/742` | `SupplyChainTradeLineItem.associatedDocumentLineDocument` (:95) | ✘ from `ITradeItem` |
| Origin | `Kenya` | `LineTradeAgreement.targetMarketCountry[]` is the *market*, not origin; origin belongs on `TradeProduct` | ✘ from `ITradeItem` |
| Quality (mark + estate + grade) | `Acacias,Thunguri,AA` | `SupplyChainTradeLineItem.specifiedTradeProduct[]` (:227) | ✘ from `ITradeItem` |
| Quantity | `200` | `LineTradeDelivery.orderQuantity` (:375) | ✘ from `ITradeItem` |
| Packaging type | `Grain Pro` | `TradeProduct` / packaging | ✘ from `ITradeItem` |
| Kg per unit | `60` | `LineTradeDelivery.productUnitQuantity` (:455) | ✘ from `ITradeItem` |
| Unit price | `290.00` | `agreedPriceProductPrice[]` → `TradePrice.unitAmount[]` → `AmountType.AmountTypeValue` | ✔ |
| Currency | `$` / `USD` | `AmountType.AmountTypeCurrency` | ✔ |
| Price basis | `/50kg` | `TradePrice.basisQuantity` → `QuantityType` (`50`, `KGM`) | ✔ |
| Line incoterm | `FOB` | `LineTradeAgreement.applicableDeliveryTerms` (:51) | ~ |

### 3.2 What the samples tell us about cardinality

- **Line items are optional.** The Blaser sale confirmation has **zero** lines — quantity, quality
  and price are all header-level. This is why `includedSupplyChainTradeLineItem` is optional.
- **Line identifiers are optional.** The buyer's contract numbers each line (`46690`/`46691`/`46692`);
  the seller's confirmation has one document-level reference covering a range (`S - JCT / 742-744`).
- **At most one of `sellerReference` / `buyerReference` is populated at issue time.** Both sale
  confirmations carry `Buyer's Ref: TBA`; the purchase contract carries no seller reference.
- **Issuer role is a first-class fact, not derivable from the fields.** Same content class, issued
  by the seller ("We hereby confirm having sold…") or by the buyer ("We have bought the following
  coffee from you"). Downstream needs to know which.
- **The same facts are structured in one document and prose in the other.** The purchase contract
  has `Origin` / `Unit Type` / `Kg per Unit` / `Units` columns; the sale confirmation embeds the
  identical facts in `320 Bags of 60 kg net in bags` and `at USD 290/50 kgs FOB`. A verbatim source
  string should be preserved alongside the normalized value — the extraction stage is explicitly
  verbatim-only (README §1).

### 3.3 Data-quality findings in the samples

These are properties of the corpus, not of the models, but they constrain what can be asserted:

- The D.R. Wakefield sale confirmation is **internally inconsistent**: header says `320 Bags`, the
  three lines sum to `330` (the `60 Bags PB Zawadi` line should be `50`, as the buyer's contract
  says).
- The sale confirmation's shipment month was **amended by hand**: printed `October 2024` struck
  through, `November 2024` written above with countersign initials. A text-layer extraction returns
  the struck-through value.
- Destinations **disagree**: `London Gateway` (seller) vs `CWT, Tilbury` (buyer). Two different
  Thames ports; not reconciled on the face of either document.
- The two documents share **no identifier**. Matching is only possible on parties + quality + price.
- Seller legal name differs: `Jowam Coffee Traders Co. Ltd.` vs `Jowam Coffee Trading Co Ltd` — the
  buyer's paper is wrong, as the seller's own stamp on it reads `TRADERS`.
- Quality strings use opposite token order and different delimiters: `AB Asali` vs `Asali,AB`.

## 4. Where to put your hands next

`ITradeAgreement` and `IPurchaseOrder` are done: they validate all three sample documents and
`npm run dist` is green. What follows is what is left, ordered by how much it blocks.

### 4.1 Fields the samples carry that nothing yet stores

These are real facts on the paper with no home in either the models or BSP D23B. None of them
blocks the current tests, and each needs a decision before it gets a local property:

| Fact | Sample value | Nearest BSP home | Proposal |
|---|---|---|---|
| Weight basis | `Net Shipping Weight`, `N.S.W` | none | `applicableDeliveryTerms.description`, verbatim |
| Weight franchise | `0.5% franchise` | none | `specifiedAllowanceCharge[]` with `calculationPercent`, or free text |
| Tare method | `Actual Tare` | none | free text alongside the weight basis |
| Insurance allocation | `For buyer's account.` | none reachable from the agreement | a note, or `IUneceCargoInsurance` if the delivery facet is added |
| Arbitration seat | `London Arbitration` | none | `contractDocument[]` clause text |
| Place of payment presentation | `on first presentation in London` | none | `applicablePaymentTerms.description`, verbatim |
| Shipment detail | `Buyer to nominate vessel.` | none | a note |
| Issuer role | seller-issued vs buyer-issued | `partyRoleCode` on the party | already expressible — promote `partyRoleCode` if it must be mandatory |
| Verbatim source string | the whole extraction stage is verbatim-only | none | a parallel `sourceText` structure, deliberately non-standard |

The pragmatic grouping is a single local `terms` sub-object, clearly marked as non-UN/CEFACT, rather
than scattering free text across inherited `description` fields.

### 4.2 Price basis unit

`IUneceTradePrice.basisQuantity` is an `IUneceQuantityType`, whose `QuantityTypeCode` is an
`IUneceQuantityCode` object. The sample's `$/50kg` currently stores the `50` but the tests do not
set the `kg`. Confirm the house convention for the unit code before more documents are modelled —
the Coffee DSS invoice uses the same 50 kg basis.

### 4.3 Delivery and settlement facets

Total quantity (`320 Bags`), destination, total contract value and payment means all belong on
`IUneceHeaderTradeDelivery` / `IUneceHeaderTradeSettlement`, which the current flat models do not
reach. Adding them is the natural moment to reconsider the re-rooting described in §2.5, since
`SupplyChainTradeTransaction` is what composes all three facets.

### 4.4 JSON-LD context generation

`ts-to-jsonld-context.json` still carries the `twin-aig` prefix, the `https://schema.twindev.org/aig/`
URL and an empty `types` array, so `src/schemas/types.jsonld` is generated near-empty. Two traps
before fixing it:

1. The generator only visits `interface` declarations. All four models are type *aliases*, so
   listing their files changes nothing.
2. It throws `noJsonLdProps` for any property without a `@json-ld` JSDoc tag, so every local
   property needs one first.

### 4.5 Schema strictness

No generated schema emits `additionalProperties: false`, so a misspelled property passes validation
silently — which is exactly how the old test's `issueDate` typo went unnoticed. Decide whether the
extraction output should be validated strictly.

## 5. Roadmap for the remaining five documents

Field inventories for all five were taken from the samples. Candidate base interfaces below were
verified to exist in the BSP folder.

| Model | Sample | Issuer | Candidate BSP base | Notes |
|---|---|---|---|---|
| `IAuctionPurchaseConfirmation` | `12- …/{ALLIANCE,KCCE,KIPKELION,KIRINYAGA SLOPES}.pdf` | seller-side brokerage | `IUneceSupplyChainTradeTransaction` + `IUneceHeaderTradeSettlement` | Titled "COFFEE DSS INVOICE". 4 samples, identical template. Levy = 0.1 % of line total. Price basis is **50 KGM**. |
| `IWarrant` | `03-Storage Warrant(s)-…/` (2) | warehouse operator | `IUneceExchangedDocument` | `documentTypeCode` = `UneceDocumentCodeList.WarehouseWarrant` (`#635`). Negotiable by endorsement; two-category approval maps to `first`/`secondSignatoryAuthentication`. **Gap:** BSP has no endorsement *chain*. |
| `IDeliveryNote` | `13- Warehouse Delivery Note(s)/` (1, scanned) | releasing warehouse | `IUneceHeaderTradeDelivery` wrapped in `IUneceExchangedDocument` | `documentTypeCode` = `DeliveryNote` (`#270`). The GRN in `11-Goods Receipt Note(s)` is the machine-printed counterpart and is better structural evidence for the line model. |
| `IHoldingCertificate` | `05-Holding Certificate(s)/` (1, photo) | collateral manager | `IUneceSpecifiedCertificate` | Tripartite (issuer / secured creditor / depositor). Explicitly **non**-negotiable. 6-month validity → `expiryDateTime` + `validIndicator`. Two-signature rule is normative (CMA Schedule 1). |
| `ITransferNote` | **none** | — | — | **No sample exists in the corpus.** See below. |

### 5.1 `ITransferNote` — no evidence

An exhaustive search of `.context/Document Samples/` found no transfer note: no filename or folder
contains "transfer"; a full-text grep for `transfer note|transfer advice|delivery order|title
transfer` returns zero hits; the CMA's only schedules are the Holding Certificate and a Release
Authorization Request. The `Weight Note` and `Goods Receipt Note` were checked and are different
documents.

The closest thing in the corpus is the **`FURTHER ENDORSEMENT`** section of the storage warrant
(columns `DELIVERED TO` / `SIGNED` / `DATE`, two rows, blank in both samples), which warrant
clause 3 makes the legally operative transfer mechanism.

Recommendation: either model transfer of title as an endorsement record nested in `IWarrant`, or
obtain a sample before committing to a standalone model. The two nearest BSP document codes are
both poor fits — `ContainerTransferNote` (`#976`, container-level) and `RequestForTransfer` (`#303`,
a payment instruction).

### 5.2 Cross-document join keys

Verified against sample values. These are what let the seven documents form one trade graph:

| Key | Appears in | Example |
|---|---|---|
| **Outturn code** (primary lot identity) | Warrant, DSS invoice, Holding Certificate, Delivery Note, GRN | `41KN0012` |
| Lot number + sale number | Warrant, DSS invoice, GRN | `6624` + `34` |
| **ESlip number** (settlement link) | DSS invoice header ↔ warrant payment endorsement | `E2608064LL` |
| Warehouse code | DSS invoice → warrant issuer | `BTL`, `MAXA`, `KCE` |
| DO / M.R. receipt no | Delivery Note ↔ GRN | `2993` |
| Buyer | constant across the corpus | `JOWAM COFFEE TRADERS LTD` (`Buyer Code : 149`) |

### 5.3 Modelling hazards that apply to all seven

- **"Bags + pockets" is two package counts, never one number.** `34.0`/`44.0` in separate warrant
  columns, `11+65` on the Holding Certificate, `6+38` per Delivery Note line, separate totals in the
  GRN. Model as two quantities.
- **Price basis is per 50 KG**, not per kg or per bag.
- **Three date formats appear, one of them malformed** (`2026-08-06 09:46:00.761`,
  `Thu Aug 06 15:06:58 EAT 2026`, `09/07/2025`, and a handwritten `04/07/025`).
- **Amounts carry an inline `US$` prefix** on top of a `US $` column header.
- **Address fields contain a duplicated literal label** (`P.O BOX P.O BOX 554` in all four DSS
  invoices) — a source-system template bug.
- **The Delivery Note's `CERTIFICATION` column is the GRN's `Location`** (`15-19` vs `WH15-19`). Do
  not model it as a certification.
- **Sample dates are in the future (2025–2026)** — the corpus is synthetic/anonymised.
- `UneceTypes` has no member for any of the five new documents. That does not matter for
  `TradeDocumentTypes`, which now holds local profile names anyway (§2.6); it matters for the
  payload's JSON-LD `@type`, which comes from whichever UN/CEFACT base each model extends. The
  *document type codes* can and should come from `UneceDocumentCodeList`.

## 6. Relationship to UN/CEFACT Verifiable Trade Documents (UNVTD)

`https://unvtd.unece.org/` is a second, live UN/CEFACT deliverable, distinct from BSP D23B. It
publishes **21 trade documents as W3C Verifiable Credentials**: for each, a self-contained JSON
Schema at `<name>-schema.yaml` and a JSON-LD context at `<name>-context.json`. Both were verified
live.

**The context is a mapping layer, not a rival vocabulary.** `purchase-order-context.json` binds
UNVTD's friendly wire names onto BSP D23B IRIs under the prefix
`"unece": "https://vocabulary.uncefact.org/"`:

| UNVTD wire name | expands to |
|---|---|
| `PurchaseOrder` (the credential type) | `unece:HeaderTradeAgreement` |
| `buyer` / `seller` / `invoicee` | `unece:buyerParty` / `unece:sellerParty` / `unece:invoiceeParty` |
| `orderDate` | `unece:issueDateTime` |
| `purchaseOrderNumber` | `unece:identifier` |
| `orderedItems` | `unece:includedSupplyChainTradeLineItem` |
| `TradeLineItem` | `unece:SupplyChainTradeLineItem` |
| `product` / `productIdentifier` | `unece:specifiedTradeProduct` / `unece:identifier` |
| `deliveryLocation` | `unece:shipToParty` |
| `quantityOrdered` | `unece:billedQuantity` |
| `unitPrice` / `lineTotal` / `totalOrderAmount` | `unece:chargeAmount` / `unece:lineTotalAmount` / `unece:grandTotalAmount` |
| `name` / `street` / `city` / `state` / `zip` / `country` | `schema:*` — the address is schema.org, not UN/CEFACT |

So UNVTD independently confirms three of the choices in §2: a purchase order **is** a
`HeaderTradeAgreement`; its date **is** `issueDateTime` on that class; its lines **are**
`includedSupplyChainTradeLineItem` of `SupplyChainTradeLineItem`. What §2.5 calls "off-domain" is
exactly what UNECE itself publishes for this document.

### 6.1 Coverage of the seven targets

Probed 62 URL spellings; cross-checked against the authoritative `/docs` index of 21 documents.

| target | nearest UNVTD schema | verdict |
|---|---|---|
| Buyer purchase order → `IPurchaseOrder` | `purchase-order` | **direct hit on identity, shallow on content** — 11 `credentialSubject` properties against 71 on `IUneceHeaderTradeAgreement` |
| Sales contract → `ITradeAgreement` | `purchase-order` | same class, **wrong direction**: `purchaseOrderNumber` is required and buyer-assigned; no seller-reference property exists |
| Coffee warrant → `IWarrant` | `warehouse-receipt` | structurally close, **legally not the same document**: no holder, no negotiability flag, no endorsement chain |
| Holding certificate → `IHoldingCertificate` | `warehouse-receipt` | partial — the receipt records the deposit **event**, a holding certificate attests a **state** for a named current holder |
| Auction purchase confirmation | `commercial-invoice` | weak — zero auction vocabulary, and its `required` list is empty |
| Warehouse delivery note | `ships-delivery-order` | poor, wrong domain — 12 of 15 properties are required and maritime (B/L number, vessel, seal) |
| Transfer note | *(none)* | no analogue |

**UNVTD publishes nothing for six of the seven.** Only `IPurchaseOrder` has a real counterpart.

### 6.2 Can UNVTD accept the sample purchase contract?

An instance of the D.R. Wakefield contract was written and validated for real with ajv against the
live schema. It **validates** — but that proves little, because `additionalProperties` is absent at
every level, so almost anything validates. Of 53 distinct facts on the page:

- **~38% survive intact** — the commercial skeleton: parties, date, quality marks, quantities, price
  amounts, destination, payment terms.
- **~15% survive degraded** — the three contract numbers only by putting a *contract* reference into
  `productIdentifier` (a *product* reference); the seller's PO Box asserted as a street; the
  `Exporter/Shipper` role flattened to the closed enum value `Seller`.
- **~47% have no home at all** — origin `Kenya`, packaging `Grain Pro`, `60 kg` per unit, the whole
  `Basis` line (`FOB origin, N.S.W, 0.5% franchise, Actual Tare`), shipment month, shipment detail,
  insurance allocation, the sample-approval condition, **`EUDR Compliant`**, the European Standard
  Contract for Coffee, the code of conduct, the precedence clause, `London Arbitration`, and every
  trace that the document was stamped and signed.

The loss is not random. What survives is *who, what, how many, how much*; what is lost is the entire
**legal and regulatory layer** — which for an EU-bound 2024 coffee contract is the part a customs
authority would actually query.

**Four required properties cannot be honestly supplied by the PDF:**

1. `purchaseOrderNumber` — a single header-level string, but the document numbers each line
   separately (`46690`/`46691`/`46692`) and has no document-level number. An array is rejected
   (`must be string`), so any value is a fabrication.
2. `buyer.id` and `seller.id` — `format: uri`, exemplified as DIDs. The page carries no URI, DID,
   DUNS, GLN, VAT, EORI, registration number, website or email. Unsatisfiable by any paper document
   that predates a DID registry.
3. `orderedItems[].productIdentifier` — the document has no product code; only the buyer's contract
   number, which is a different thing.

**And one silent corruption.** `unitPrice` is `{amount, currency}` with no basis quantity, but the
contract prices per 50 kg on 60 kg bags. A consumer multiplying `unitPrice.amount` by
`quantityOrdered` computes **95,060 USD** against a true **114,072 USD** — the schema produces a
confidently wrong number, which is worse than a gap. The current models carry the basis in
`agreedPriceProductPrice[].basisQuantity`.

### 6.3 Four defects in the UNVTD purchase-order schema, proven by execution

1. **Not valid JSON Schema 2020-12 despite declaring it.** It uses OpenAPI annotations — `name:` as
   a schema keyword and `example:` (JSON Schema spells it `examples`, an array). ajv in default
   strict mode refuses to compile it: `strict mode: unknown keyword: "name"`.
2. **`credentialSubject` is entirely open** — `additionalProperties` appears nowhere in the file, so
   arbitrary keys validate. But those keys are undefined in the context, so a strict JSON-LD
   processor will drop or reject them. The schema and the context disagree about extension.
3. **`zip` is `type: number`** in 67 of the 68 party objects across the whole suite. `SE1 0UQ` is
   rejected; Nairobi's `00200` round-trips as `200`.
4. **`unlocode` is `format: uri`** — a UN/LOCODE is `GBTIL`, five characters, and is rejected.

### 6.4 What this means for the repo

The two are layers, not alternatives: UNVTD is a **wire format** for credential exchange, D23B is
the **semantic layer** it expands into, and this package models the semantic layer. Three options,
should UNVTD interop become a requirement:

- **Do nothing.** The models already emit the IRIs UNVTD's context expands to. A consumer that
  expands both to RDF sees compatible triples for the properties both express.
- **Add a projection.** A `toUnvtdPurchaseOrder()` serializer that emits the credential envelope and
  the 11 `credentialSubject` properties, lossily and by design, from a full `IPurchaseOrder`. This
  is the only option that produces a verifiable credential a third party can check against the
  published schema, and it keeps the lossless model intact. Cost: the four unsatisfiable required
  properties still have to be sourced from outside the document — party DIDs in particular.
- **Adopt UNVTD as the model.** Rejected on the evidence above: it would discard 47% of the sample
  document, cannot express the price basis without producing a wrong total, and covers only one of
  the seven target documents.

## 7. The `$ref` URLs in the generated schemas

Two kinds appear, and only one of them is a problem.

| `$ref` | live status | why |
|---|---|---|
| `https://schema.twindev.org/unece/Unece*` | **200** | `@twin.org/standards-unece` is published |
| `https://schema.twindev.org/trade-document/*` | **404** | this package is not published yet |
| `#/$defs/TradeParty` | n/a | local, always resolves |

### 7.1 How they are minted

Both are **pure string construction at build time**. `ts-to-schema` never dereferences, fetches or
existence-checks a `$ref`; a 404 has no build-time meaning.

- **Local** — `baseUrl` from `ts-to-schema.json` is passed as both the namespace and the package
  name, and every schema gets `$id = baseUrl + StringHelper.stripPrefix(typeName)`. `ITradeParty` →
  `TradeParty` → `https://schema.twindev.org/trade-document/TradeParty`. A cross-reference between
  two types of the same package reuses that `$id` verbatim.
- **External** — the `externalReferences` regex map. `"IUnece(.*)"` compiles to `/^IUnece(.*)$/` and
  rewrites `IUneceHeaderTradeAgreement` → `https://schema.twindev.org/unece/UneceHeaderTradeAgreement`.

The `trade-document/*` 404 therefore has exactly one cause — the package is unpublished — and
exactly one fix: publish it. It does not affect the build, and it does not affect runtime validation
either, because `TradeDocumentTypes` values now equal the schema `$id`s (§2.6), so
`DataTypeHelper`'s schema loader resolves them from the local factory before ever reaching the
network. It matters only to a third party who fetches one of these files standalone.

### 7.2 Can a schema be emitted self-contained?

**Partially.** `@twin.org/tools-core` supports `@json-schema embedded:defs` and
`@json-schema embedded:inline`, which hoist a referenced schema into the referencing file. Verified
empirically; the constraints are sharp:

- **The tag goes on the referenced *declaration*, never on the referencing property.** Placed on a
  property it is silently discarded — no error, no warning.
- **It does not reach through arrays.** `ts-to-schema` visits direct property references but never
  `items`, `additionalProperties`, `not`, `contains`, `propertyNames` or `if`/`then`/`else`. This is
  why `ITradeParty` embeds and `ITradeItem` does not — every document references `ITradeItem`
  through an array. The tag is on `ITradeItem` anyway, to record the intent.
- **It cannot reach an external package.** The mode map is not propagated back from the forked
  context in which a dependency's `.d.ts` is parsed, so tagging a UNECE interface has no effect. The
  root `allOf: [{$ref: .../unece/UneceHeaderTradeAgreement}]` cannot be embedded.
- **`inline` corrupts the model.** It merges the base's properties over the derived ones, so
  `buyerParty`/`sellerParty` revert from the narrowed `ITradeParty` to the wide `IUneceTradeParty`.
  Under `allOf` both constraints apply; after flattening only the wide one survives. Do not use it.

So a fully self-contained `TradeAgreement.json` is **not achievable with this toolchain today**.
`embedded:defs` on `ITradeParty` is the whole of what is available, and it is applied.

### 7.3 Should the child types be in `ts-to-schema.json`?

They look like they should not — only `ITradeAgreement` and `IPurchaseOrder` are documents, and
`ITradeParty` / `ITradeItem` are their children. But **removing them breaks the output silently**:

- Removed from `types`, the tool still exits 0 with no warning, still emits
  `$ref: .../trade-document/TradeParty` and `.../TradeItem` — now pointing at files it never writes.
  Six dangling refs. (The URL is minted from the type name; nothing checks that a target exists.
  Truncating the source files to zero bytes produces the same refs.)
- With `embedded:defs`, removing `ITradeParty.ts` becomes safe. Removing `ITradeItem.ts` does not,
  because of the array gap above.

**Keep all four entries.** Conceptual hierarchy is expressed by the `embedded` tag, not by the
`types` array.

### 7.4 Upstream issues worth filing against `@twin.org/tools-core`

1. `inlineEmbeddedSchemasInNode` never visits schema-valued keywords, so `embedded` is ignored for
   any type referenced through an array.
2. `embeddedSchemaModes` is not propagated back from forked external contexts, so the tag is
   unreachable in a dependency's `.d.ts`.
3. `flattenInlineAllOfBranches` lets base properties overwrite derived ones, silently widening
   narrowed types.
4. `@json-schema embedded:` on a property is silently discarded instead of producing a diagnostic.

## 8. Coverage proof — the buyer's purchase contract

`.context/Document Samples/02-Buyer Purchase Contract(s)/Buyer_s Purchase Contract.pdf` was read at
its native resolution (a single 1654×2338 px JPEG at 200 dpi — rendering higher only interpolates)
and decomposed into **106 atomic facts**, splitting every composite string into its parts:
`FOB origin, N.S.W, 0.5% franchise, Actual Tare.` is four facts, `CWT, Tilbury, United Kingdom` is
three, `$/50kg` is two.

| | count |
|---|---|
| Atomic facts on the page | 106 |
| **Data bearing** | **71** — 40 header level, 31 line level |
| Page furniture | 35 — logo, `EST.1970`, 8 column captions, 7 terms labels, ruling, the empty EUDR box, scanner dust, the blank lower 55% of the page |

**All 71 data-bearing facts are expressible.** The proof is executable, not asserted:

- `tests/fixtures/buyerPurchaseContract.ts` transcribes the whole document into an `IPurchaseOrder`,
  every fact tagged with its id. If a property path did not exist with the right type, `tspc` would
  reject the file.
- `tests/coverage/buyerPurchaseContract.spec.ts` validates the instance against the generated schema
  and then asserts each of the 71 facts individually, plus that the covered id set is *exactly* the
  inventory's data-bearing set. 83 tests, all green.

### 8.1 Where the harder facts landed

| fact | value | path |
|---|---|---|
| `FOB` + named place | `FOB origin` | `applicableDeliveryTerms.deliveryTermsDeliveryTypeCode` = `#FOB`, `.relevantLocation.name` |
| `N.S.W` | nett shipped weights | `…specifiedLineTradeDelivery[].quantityCalculationMethodCode` |
| `0.5% franchise` | claims tolerance | `…specifiedTradeProduct[].applicableProductCharacteristic[].valueTolerance[].minusValuePercent` |
| `Actual Tare` | tare method | `…applicableProductCharacteristic[].valueMethod[].name` |
| `November 2024` | shipment month | `shippingPeriod.name` + `.startDateTime` / `.endDateTime` |
| `Nett Cash Against Documentation` | payment method | `applicablePaymentTerms.paymentTermsTypeCode` = `PaymentTermsTypeCodeList#72` |
| `on first presentation` | payment trigger | `applicablePaymentTerms.paymentTermsEventTimeReferenceFromEventCode` = `TimeReferenceCodeList#71` |
| `in London` | place of presentation | a second `applicableLocation[]` entry with `locationFunctionTypeCode` = `PlaceOfPayment` |
| `Subject to approval of preshipment sample` | condition precedent | `purchaseConditionsDocument[].processCondition` |
| `EUDR Compliant` | regulatory assertion | `applicableRegulatoryProcedure[].certificationBasis` |
| `European Standard Contract for Coffee` / `latest edition` | governing terms | `contractDocument[].name` + `.versionId` |
| `D.R Wakefield suppliers code of conduct` | second governing doc | `purchaseConditionsDocument[].name` |
| `Shipping instructions to follow.` | deferred instructions | `supplyInstructionDocument[].remarks` |
| the Jowam stamp + signature | acceptance | `sellerParty.confirmedAuthentication[]` — `.signatory`, `.actualDateTime`, `.statement` |
| `Exporter/Shipper` + `Seller` | two roles, one block | `sellerParty.partyRoleCode` = `[#SE, #EX]` |
| `P .O. Box 58513- 00200` | seller address | `sellerParty.postalAddress.postOfficeBox` + `.postcodeCode` |
| `SE1 0UQ` / `Thompson House` | buyer address | `buyerParty.postalAddress.postcodeCode` + `.buildingName` |

### 8.2 The six facts that needed `includedNote`

`IUneceHeaderTradeAgreement` is a pure association hub: of its 69 properties only three carry free
text (`buyerReference`, `sellerReference`, `reference`), so contractual prose has nowhere to go.
`includedNote?: IUneceNote[]` was lifted onto both document models — the term is UN/CEFACT's own,
declared on `Document` and echoed as `additionalInformationNote` / `informationNote` /
`statementNote` on three other classes, so nothing is invented. Each note is discriminated by
`subject`:

| fact | subject | why no typed slot exists |
|---|---|---|
| `We have bought the following coffee from you :` | `Trade direction` | direction is structural, but the operative sentence itself is prose |
| `Buyer to nominate vessel.` | `Vessel nomination` | `carrierParty` names a carrier once known; nothing expresses an obligation to name one. `grep -i nominat` over all 394 interfaces returns zero hits |
| `For buyer's account.` | `Insurance` | no insurance property on any header class; the only insurance text in reach hangs off a physical `Consignment` |
| `which override all others` | `Precedence` | no precedence vocabulary; array order is not significant in JSON-LD |
| `London Arbitration.` | `Dispute resolution` | `grep -i arbitration` over all interfaces and code lists returns zero hits |
| `Please sign and return.` | `Countersignature instruction` | would otherwise need `buyerOrderDocument` used as a self-reference |

### 8.3 Two residual limitations, both upstream

1. **Quantities cannot carry their unit.** `IUneceQuantityCode` declares no value property — only
   `@context` and `type` — so `IUneceQuantityType` stores `60` but not `kg`, and `200` but not
   `bags`. This affects every quantity in the package, not just this document.
2. **Three low-confidence readings in the source**, flagged in the fixture: the buyer's postcode
   `SE1 0UQ` (below the recovery threshold of the 200 dpi scan; the outward code `SE1` is reliable,
   the inward code is provisional), whether `D.R Wakefield` has a second full stop, and whether
   `Please sign and return` ends in a comma or a full stop.

### 8.4 Nothing is derived

The rule is absolute: **a value the page does not state is left absent**, never synthesised to
satisfy a schema. A test asserts it. Three things are consequently missing from the fixture and that
is correct:

- **`identifier`** — the contract numbers each line (`46690`/`46691`/`46692`) and carries no
  document-level order number. UNVTD requires one; a range like `46690-46692` appears nowhere on the
  paper, so it is not written and `identifier` was demoted to optional (§2.4).
- **`buyerParty.partyRoleCode`** — the page has no "Buyer" label at all. The seller's roles *are*
  printed (`Exporter/Shipper` over `Seller`), so only the seller carries one.
- **the content of the manuscript signature** — fact 93 is an illegible blue ballpoint scrawl. Its
  presence is recorded by the `confirmedAuthentication` object existing, not by prose describing it.

Deterministic *format* normalisation is not derivation and is expected: `10 September 2024` →
`2024-09-10T00:00:00.000Z`, and the stated shipment month `November 2024` → its first and last day.
Both values are on the page; only their encoding changes.
