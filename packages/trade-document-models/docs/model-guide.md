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

Three of the four models follow one pattern: **take a UN/CEFACT interface, promote the fields the
document always carries to mandatory, then add what UN/CEFACT does not have.**

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
  `ITradeItem.ts` and `ITradeParty.ts` both do this today — compare `TradeParty.json` with
  `TradeAgreement.json`.
- **Write TSDoc on every local property.** It is the only source of the schema `description`, and
  the only place to record why a local property exists instead of a UN/CEFACT one.

## 2. Model-by-model state of play

### 2.1 `ITradeParty` — *supporting type*

```ts
export type ITradeParty = IUneceTradeParty &
  Required<Pick<IUneceTradeParty, "@context" | "postalAddress">> & { };
```

| | |
|---|---|
| Base | `IUneceTradeParty` (82 properties) |
| Promoted | `@context`, `postalAddress` |
| Schema | `src/schemas/TradeParty.json` — degraded `allOf` shape (trailing `& {}`) |
| Exported from `index.ts` | **no** |

Issues:

1. Trailing `& { }` — remove it.
2. Doc comment still says "Trade Agreement Document".
3. `postalAddress` is mandatory, but two of the three sample documents give the counterparty as a
   bare name (`D.R. Wakefield & Company Ltd. United Kingdom`, `Jowam Coffee Trading Co Ltd` — no
   address at all). **A verbatim extraction of the samples cannot satisfy this model.** Either
   `name` is the right thing to promote instead, or `postalAddress` must be demoted to optional.
4. Not exported, yet `ITradeAgreement.buyerParty: ITradeParty` is public — consumers cannot name the
   type of a property they receive.

Useful `IUneceTradeParty` properties not yet used: `name` (:1289), `identifier` (:1266),
`registeredId` (:1344), `partyRoleCode` (:1302), `specifiedLegalOrganization` (:1452),
`definedContact` (:1218), `emailURICommunication` (:1236), `telephoneCommunication` (:1494),
`uRICommunication` (:1506), `specifiedAuthoritativeSignatoryPerson` (:1404).

### 2.2 `ITradeItem` — *supporting type*

```ts
export type ITradeItem = IUneceLineTradeAgreement &
  Required<Pick<IUneceLineTradeAgreement, "@context" | "agreedPriceProductPrice">> & { };
```

| | |
|---|---|
| Base | `IUneceLineTradeAgreement` (79 properties) |
| Promoted | `@context`, `agreedPriceProductPrice` |
| Schema | `src/schemas/TradeItem.json` — degraded `allOf` shape |
| Exported from `index.ts` | **no** |

**This is the model with the largest structural gap.** `LineTradeAgreement` is the *pricing and
contractual-terms facet* of a line. It carries no quantity and no product:

| What a line needs | Where UN/CEFACT puts it | Reachable from `IUneceLineTradeAgreement`? |
|---|---|---|
| Ordered quantity (`200` bags) | `IUneceLineTradeDelivery.orderQuantity` (:375) | **no** |
| Product / grade / mark (`Asali, AB`) | `IUneceSupplyChainTradeLineItem.specifiedTradeProduct[]` (:227) | **no** |
| Line number / contract no (`46690`) | `IUneceSupplyChainTradeLineItem.associatedDocumentLineDocument` (:95) | **no** |
| Unit price (`290.00 USD / 50 kg`) | `IUneceLineTradeAgreement.agreedPriceProductPrice[]` → `IUneceTradePrice.unitAmount[]` + `.basisQuantity` | yes |
| Incoterm per line (`FOB`) | `IUneceLineTradeAgreement.applicableDeliveryTerms` (:51) | yes |

The quantities that *are* on `LineTradeAgreement` are ordering **constraints**, not the ordered
amount: `economicOrderQuantity` (:137), `minimum`/`maximum`/`incrementalProductOrderableQuantity`.
Do not repurpose them.

So `ITradeItem` can currently express *at what price*, but not *how much of what* — and every
sample document states quantity and quality on every line. This has to be resolved before either
document model is usable. See §4.

### 2.3 `ITradeAgreement` — *sale confirmation / sales contract*

```ts
export type ITradeAgreement = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement,
    "@context" | "buyerApprovedDateTime" | "sellerReference" | "buyerParty" | "sellerParty">> & {
    issueDateTime: string;
    buyerParty: ITradeParty;
    sellerParty: ITradeParty;
    includesTradeItem: ITradeItem[];
  };
```

| | |
|---|---|
| Base | `IUneceHeaderTradeAgreement` (69 properties) |
| Promoted | `@context`, `buyerApprovedDateTime`, `sellerReference`, `buyerParty`, `sellerParty` |
| Local | `issueDateTime`, `includesTradeItem`, narrowed `buyerParty`/`sellerParty` |
| Schema | `src/schemas/TradeAgreement.json` — flat shape, 7 required |
| Registered as | `https://schema.twindev.org/trade-document/HeaderTradeAgreement` |
| Exported from `index.ts` | yes |

Issues, most important first:

1. **`includesTradeItem` does not exist in UN/CEFACT.** `grep -rn "includesTradeItem"` over all 394
   BSP interfaces returns zero matches, in any casing. The BSP term is
   `SupplyChainTradeTransaction.includedSupplyChainTradeLineItem` (`IUneceSupplyChainTradeTransaction.ts:123`);
   the Web-Vocabulary term is `TradeAgreement.includesItem`. Neither is spelled `includesTradeItem`.
2. **`HeaderTradeAgreement` has no link to line items at all.** Header agreement and line agreements
   are *siblings* under `SupplyChainTradeTransaction`, not parent and child:

   ```
   IUneceSupplyChainTradeTransaction
   ├── applicableHeaderTradeAgreement   : IUneceHeaderTradeAgreement[]      (:44)
   ├── applicableHeaderTradeDelivery    : IUneceHeaderTradeDelivery[]       (:50)
   ├── applicableTradeSettlement        : IUneceHeaderTradeSettlement       (:62)
   └── includedSupplyChainTradeLineItem : IUneceSupplyChainTradeLineItem[]  (:123)
       ├── specifiedLineTradeAgreement  : IUneceLineTradeAgreement          (:203)
       ├── specifiedLineTradeDelivery   : IUneceLineTradeDelivery[]         (:209)
       ├── specifiedLineTradeSettlement : IUneceLineTradeSettlement[]       (:215)
       ├── specifiedTradeProduct        : IUneceTradeProduct[]              (:227)
       └── associatedDocumentLineDocument : IUneceDocumentLineDocument      (:95)
   ```

   Hanging lines off the header is a deliberate deviation. It may be the right call for an
   extraction target — but it should be a recorded decision, not an accident.
3. **`issueDateTime` is not on `HeaderTradeAgreement`.** The class has exactly one date/time:
   `buyerApprovedDateTime` (:95). `issueDateTime` *does* exist, on 20 other interfaces including
   `IUneceSupplyChainTradeTransaction` (:142), `IUneceDocument` (:212) and
   `IUneceDocumentLineDocument` (:77) — all as `issueDateTime?: string` with
   `@json-schema format:date-time`. The local declaration is `issueDateTime: string` with no TSDoc,
   so the generated schema has no `description` and **no `format: "date-time"`** — unlike
   `buyerApprovedDateTime`, which inherits both from the dependency's `.d.ts`.
4. **`buyerApprovedDateTime` is mandatory but is not the document's date.** It means "when the buyer
   approved". On a *seller's* sale confirmation the buyer's acceptance line is frequently left
   unsigned (both samples), so this field is often unknowable at extraction time.
5. **`sellerReference` is mandatory, and the buyer's paper does not have one.** The D.R. Wakefield
   purchase contract carries no reference to the seller's `S - JCT / 742-744` anywhere. If one model
   is to carry both issuer perspectives, neither reference can be mandatory.
6. The `Pick<>` list and the local literal both declare `buyerParty`/`sellerParty`. The local one
   wins (last-write-wins in the merger), which is what makes the schema point at the local
   `TradeParty` — but the duplication is easy to misread.

### 2.4 `IPurchaseOrder` — *buyer purchase order*

```ts
export interface IPurchaseOrder {
  "@context": typeof TradeDocumentContexts.ContextPurchaseOrder;
  buyer: ITradeParty;
  seller: ITradeParty;
  invoicee: ITradeParty;
  orderDate: string;
  purchaseOrderNumber: string;
  paymentTerms: IUnecePaymentTerms;
  paymentMethod: IUnecePaymentMeans;
  allowanceCharge: IUneceTradeAllowanceCharge;
  totalOrderAmount: IUneceAmountType;
  orderedItems: ITradeItem[];
}
```

| | |
|---|---|
| Base | **none** — standalone `interface`, not an intersection |
| Schema | **none** — not listed in `ts-to-schema.json` |
| `TradeDocumentTypes.PurchaseOrder` | `""` (empty string) |
| Registered | **no** |
| Exported from `index.ts` | **no** |

This model does not follow the house idiom, and it is the one place where the **two-vocabulary
problem** (README §4) becomes concrete. Its *property names* come from the Web Vocabulary; its
*types* come from BSP:

| Property | Origin of the name | Nearest BSP name | Nearest Web-Vocabulary name |
|---|---|---|---|
| `buyer` | Web Vocabulary | `buyerParty` | `unece:buyer` ✔ |
| `seller` | Web Vocabulary | `sellerParty` | `unece:seller` ✔ |
| `invoicee` | Web Vocabulary | — (BSP has `buyerParty`, `payerParty` on settlement) | `unece:invoicee` ✔ |
| `orderDate` | Web Vocabulary | — | `unece:orderDate` ✔ |
| `purchaseOrderNumber` | **invented** | `buyerReference` / `identifier` | `unece:contractId` |
| `paymentTerms` | shortened | `applicablePaymentTerms` | `unece:applicablePaymentTerms` |
| `paymentMethod` | **invented** | `specifiedPaymentMeans` (on `HeaderTradeSettlement`) | `unece:paymentMeansId` |
| `allowanceCharge` | shortened | `specifiedAllowanceCharge` / `appliedAllowanceCharge` | `unece:appliesCharge` |
| `totalOrderAmount` | **invented** | `…MonetarySummation.grandTotalAmount` | `unece:duePayableAmount` |
| `orderedItems` | **invented** | `includedSupplyChainTradeLineItem` | `unece:includesItem` |

So five of eleven property names exist in neither vocabulary. The result compiles, but nothing in
it round-trips to UN/CEFACT JSON-LD — which is the whole point of the repository.

Additional issues:

- Every property is mandatory. `allowanceCharge` and `invoicee` appear in **neither** sample
  document; `totalOrderAmount` appears in neither D.R. Wakefield document (the Blaser sale
  confirmation has a handwritten total, the purchase contract has none).
- `"@context": typeof TradeDocumentContexts.ContextPurchaseOrder` pins the context to
  `https://unvtd.unece.org/purchase-order-context.json`, a URL that is not the UNECE D23B context
  the other models use and is not published.
- There is no `type` property, so the payload carries no JSON-LD `@type`.

### 2.5 Supporting files

**`tradeDocumentTypes.ts`** — `TradeAgreement`/`TradeParty`/`TradeItem` are aliases of
`UneceTypes.HeaderTradeAgreement` / `TradeParty` / `LineTradeAgreement`. `PurchaseOrder: ""` is a
placeholder. Note that `UneceTypes` (643 members) has **no** `PurchaseOrder`, `Warrant`,
`DeliveryNote`, `HoldingCertificate` or `Transfer*` member — new document types will need locally
namespaced IRIs. Doc comment still says "auditable item graph data".

**`tradeDocumentContexts.ts`** — four URLs, three of them different, none cross-checked:

| Constant | Value | Used where |
|---|---|---|
| `Namespace` | `https://schema.twindev.org/trade-document/` | data-type registration key prefix |
| `Context` | `https://unvtd.unece.org/` | passed as `jsonLdContext` at registration |
| `ContextTradeAgreement` | `https://vocabulary.uncefact.org/unece-context-D23B.jsonld` | what the test puts in payloads |
| `ContextPurchaseOrder` | `https://unvtd.unece.org/purchase-order-context.json` | `IPurchaseOrder["@context"]` |

**`tradeDocumentDataTypes.ts`** — registers the three schemas correctly. Note the registration key
is `Namespace + type`, so `TradeAgreement.json` (whose `$id` says `…/TradeAgreement`) is registered
under `…/HeaderTradeAgreement`. Header comment says "auditable item graph".

**`index.ts`** — exports only `tradeDocumentDataTypes`, `ITradeAgreement`, `tradeDocumentContexts`,
`tradeDocumentTypes`. `ITradeParty`, `ITradeItem` and `IPurchaseOrder` are missing.

**`ts-to-schema.json`** — lists three of the four models. `IPurchaseOrder.ts` is absent.

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
  and price are all header-level. `includesTradeItem` being mandatory makes that document
  unrepresentable.
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

## 4. Where to put your hands

Ordered by dependency. Items marked **[decision]** need a human call before coding.

### 4.1 `src/models/ITradeItem.ts`

1. **[decision]** Choose how a line carries quantity and product. `IUneceLineTradeAgreement` cannot.
   Options:
   - **(a) Re-root on `IUneceSupplyChainTradeLineItem`** — UN/CEFACT-correct. Gives
     `specifiedTradeProduct[]`, `specifiedLineTradeDelivery[]` (quantity),
     `specifiedLineTradeAgreement` (price) and `associatedDocumentLineDocument` (line number) in one
     object. Costs one extra nesting level for the extractor and makes `TradeItem.json` much larger.
   - **(b) Keep `IUneceLineTradeAgreement` and add local flat properties** for quantity, product and
     line number. Cheap for the extractor, but invents terms — the same mistake `includesTradeItem`
     already makes.
   - **(c) Intersect both** — `IUneceLineTradeAgreement & Pick<IUneceSupplyChainTradeLineItem, …>`.
     Keeps the flat shape and every property name stays a real UN/CEFACT term.
2. Remove the trailing `& { }`.
3. Fix the doc comment.

### 4.2 `src/models/ITradeParty.ts`

1. Remove the trailing `& { }`.
2. **[decision]** Demote `postalAddress` or promote `name` instead — the samples give bare names.
3. Fix the doc comment.

### 4.3 `src/models/ITradeAgreement.ts`

1. **[decision]** Rename `includesTradeItem`. It exists in neither vocabulary. Candidates:
   `includedSupplyChainTradeLineItem` (BSP-correct) or `includesItem` (Web-Vocabulary-correct,
   shorter, and the direction UN/CEFACT is heading).
2. Make `includesTradeItem` **optional** — the Blaser sample has no lines.
3. Add TSDoc + `@json-schema format:date-time` to `issueDateTime`, so the generated schema gets a
   description and a format. Record in the TSDoc that BSP places `issueDateTime` on
   `SupplyChainTradeTransaction`/`Document`, not on `HeaderTradeAgreement`.
4. **[decision]** Demote `buyerApprovedDateTime` and `sellerReference` from the `Required<Pick<>>` —
   neither is universally present. Promote instead what every sample has: the parties and the issue
   date.
5. Add the header fields the samples need and BSP already provides: `applicableDeliveryTerms`
   (Incoterm + named place), `applicablePaymentTerms`, `shippingPeriod`, `buyerReference`,
   `applicableLocation` (destination), `contractDocument` (governing terms).
6. **[decision]** Decide how to carry the fields BSP has no home for: weight basis, franchise, tare
   method, insurance allocation, arbitration seat, shipment detail, issuer role. A single local
   `terms` sub-object keeps them together and clearly marked as non-standard.
7. Drop the duplicate `buyerParty`/`sellerParty` from the `Pick<>` list, or drop the local
   re-declaration — keeping both is confusing even though the behaviour is defined.

### 4.4 `src/models/IPurchaseOrder.ts`

1. **[decision]** Refactor to the house idiom. The buyer's purchase contract and the seller's sale
   confirmation are the same document class from opposite sides (see §3.2), so the natural base is
   the same `IUneceHeaderTradeAgreement`. Concretely: `IPurchaseOrder` becomes an intersection over
   `IUneceHeaderTradeAgreement` with `buyerReference` promoted instead of `sellerReference`.
2. Rename every property to a real vocabulary term (see the table in §2.4). `purchaseOrderNumber` →
   `buyerReference`; `orderedItems` → whatever §4.3.1 settles on; `buyer`/`seller` → `buyerParty`/
   `sellerParty` if BSP-rooted.
3. Make optional everything the samples do not always carry: `invoicee`, `allowanceCharge`,
   `totalOrderAmount`, `paymentMethod`.
4. Add a `type` property so payloads carry a JSON-LD `@type`.
5. **[decision]** Fix `ContextPurchaseOrder` — `https://unvtd.unece.org/purchase-order-context.json`
   is not published and is not the context the other models use.

### 4.5 Wiring (do all four, or the model is invisible)

1. `tradeDocumentTypes.ts` — give `PurchaseOrder` a real value.
2. `ts-to-schema.json` — add `./src/models/IPurchaseOrder.ts` to `types`.
3. `tradeDocumentDataTypes.ts` — import and register `PurchaseOrder.json`.
4. `index.ts` — export `ITradeParty`, `ITradeItem`, `IPurchaseOrder`.

### 4.6 Tests

1. Fix `Can validate an empty Trade Agreement` — it currently fails, sending `issueDate` where the
   model says `issueDateTime`, and omitting six required properties.
2. Un-skip `Can fail to validate an empty Trade Agreement` and correct the expected count (the real
   number today is 8, not 3 — and it is network-dependent unless `UneceDataTypes.registerTypes()`
   is called).
3. Add fixtures built from the real samples: the D.R. Wakefield sale confirmation (3 lines), the
   Blaser sale confirmation (0 lines), the D.R. Wakefield purchase contract (3 lines, buyer-issued).
   If a sample cannot be expressed, the model is wrong.
4. Rename the `describe` block — it still says `AuditableItemGraphDataTypes`.

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
- `UneceTypes` has no member for any of the five new documents; their `@type` values will be locally
  namespaced under `TradeDocumentContexts.Namespace`, even though their *document type codes* can
  come from `UneceDocumentCodeList`.
