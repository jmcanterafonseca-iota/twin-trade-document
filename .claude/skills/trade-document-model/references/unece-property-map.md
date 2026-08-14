# UN/CEFACT BSP D23B — proven property paths and known gaps

Everything here was confirmed by grep against
`.context/twin-standards/packages/standards-unece/src/models/`, which is byte-equivalent to the
installed `@twin.org/standards-unece@0.9.2-next.1` (394 interfaces, 640 type constants). Line
numbers are from that checkout and may drift by a line or two across versions — re-grep before
relying on one.

Shorthand below: `BSP` = `.../src/models/bsp`, `LISTS` = `.../src/models/lists`.

---

## 1. What already exists — reuse this before writing anything

### Documents — `src/models/`

| Model | Base | Holds | Does **not** hold |
|---|---|---|---|
| `ITradeAgreement` | `IUneceHeaderTradeAgreement` | seller issued sales contract / sale confirmation | — |
| `IPurchaseOrder` | `IUneceHeaderTradeAgreement` | buyer issued purchase contract, aligned to UNVTD | — |

Both root on the same class: UNVTD's context says `"PurchaseOrder": "unece:HeaderTradeAgreement"`,
and a sale confirmation is the same class from the other side. Two models on one base cannot carry
different `type` literals — the intersection collapses to `never` — so they are distinguished by
their key in `TradeDocumentTypes`, not by their payload `type`.

**`IUneceHeaderTradeAgreement` is an association hub.** Of its 69 properties only three carry free
text (`buyerReference`, `sellerReference`, `reference`), two are bare code strings, two are
identifiers, and exactly one is a date. Everything else references another class. Any prose on the
paper must go into a child object or a lifted local property.

### Atoms — `src/models/atoms/`

The decoupling layer: documents reference these, and only these reference `IUnece*`. **Check this
table before creating anything new, and widen rather than fork.**

| Atom | Base | Promoted to mandatory | Use for |
|---|---|---|---|
| `ITradeParty` | `IUneceTradeParty` | `name` | any party: buyer, seller, invoicee, shipper, warehouse keeper |
| `ITradeItem` | `IUneceSupplyChainTradeLineItem` | line document, product, delivery, agreement | one line of any document with a goods table |
| `ILocation` | `IUneceLogisticsLocation` | `name` | any place; discriminate with `locationFunctionTypeCode` |
| `IAmount` | `IUneceAmountType` | `AmountTypeValue`, `AmountTypeCurrency` | any monetary amount |
| `IPaymentTerms` | `IUnecePaymentTerms` | — | terms of payment |
| `IPaymentMeans` | `IUnecePaymentMeans` | — | how payment is made |
| `IAllowanceCharge` | `IUneceTradeAllowanceCharge` | `chargeIndicator` | an allowance or a charge |
| `INote` | `IUneceNote` | `content`, `subject` | prose with no typed slot |
| `ITradeDelivery` | `IUneceHeaderTradeDelivery` | — | shipping details: instructions, despatch and delivery events, ship-to/from, consignments, transport equipment |
| `IDeliveryTerms` | `IUneceDeliveryTerms` | — | Incoterm plus named place |
| `IReferencedDocument` | `IUneceDocument` | — | another document referenced by this one |
| `IBasis` | *(local)* | `BasisValue` | the verbatim `Basis` row |
| `IInsurance` | *(local)* | `InsuranceValue` | the verbatim `Insurance` row |
| `IConditions` | *(local)* | `ConditionsValue` | the verbatim `Conditions` row |

All fourteen promote `@context` and `type` as well, and carry `@json-schema embedded:defs`.

The three local ones exist because UN/CEFACT has no class for what the row says. Insurance is the
clearest case: `grep -i insurance` over the three header classes returns zero hits, and
`IUneceCargoInsurance` hangs off a physical `IUneceConsignment`, not off an agreement.

### Atoms worth adding when a document needs them

None of these exists yet; each has an obvious base if a future document calls for it:
`IUneceConsignment` for a consignment, `IUneceTradeProduct` for a product referenced outside a line,
`IUneceQuantityType` for a standalone quantity, `IUneceAuthentication` for a signature or stamp
carried at document level, `IUneceSpecifiedPeriod` for a standalone period,
`IUneceRegulatoryProcedure` for a compliance assertion, `IUneceSpecifiedCertificate` for a
certificate, `IUneceExchangedDocument` for a document envelope with a signature workflow.

## 2. The header/line structure

`IUneceHeaderTradeAgreement` has **no** link to line items. In UN/CEFACT the facets are siblings
under the transaction:

```
IUneceSupplyChainTradeTransaction
├── applicableHeaderTradeAgreement   : IUneceHeaderTradeAgreement[]      (:44)
├── applicableHeaderTradeDelivery    : IUneceHeaderTradeDelivery[]       (:50)
├── applicableTradeSettlement        : IUneceHeaderTradeSettlement       (:62)
└── includedSupplyChainTradeLineItem : IUneceSupplyChainTradeLineItem[]  (:123)
    ├── associatedDocumentLineDocument : IUneceDocumentLineDocument      (:95)
    ├── specifiedTradeProduct          : IUneceTradeProduct[]            (:227)
    ├── specifiedLineTradeDelivery     : IUneceLineTradeDelivery[]       (:209)
    ├── specifiedLineTradeAgreement    : IUneceLineTradeAgreement        (:203)
    └── specifiedLineTradeSettlement   : IUneceLineTradeSettlement[]     (:215)
```

This repo flattens that: the document models root on `HeaderTradeAgreement` and lift
`includedSupplyChainTradeLineItem` and `issueDateTime` onto it. That keeps the shape
extraction-friendly, uses only real UN/CEFACT terms, and is what UNECE's own UNVTD context does.
If a new document needs the **delivery** or **settlement** facet — totals, payment means, dispatch
events, gross/net weights — that is the moment to reconsider rooting it on
`IUneceSupplyChainTradeTransaction` instead.

---

## 3. Proven paths by concept

### Parties — `IUneceTradeParty`

| what | property | line |
|---|---|---|
| name | `name?: string` | :337 |
| role | `partyRoleCode?: (UnecePartyRoleCodeList \| string)[]` | :349 |
| address | `postalAddress?: IUneceTradeAddress` | :361 |
| identifiers | `identifier`, `registeredId`, `gLNId`, `dUNSId`, `globalId` | :313, :391, :301, :259, :307 |
| legal entity | `specifiedLegalOrganization?: IUneceLegalOrganization` | :499 |
| contacts | `definedContact`, `emailURICommunication`, `telephoneCommunication`, `uRICommunication` | :265, :283, :541, :553 |
| **stamp / signature** | `confirmedAuthentication?: IUneceAuthentication[]` | :241 |

`IUneceTradeAddress`: `buildingName`, `streetName`, `cityName`, `postcodeCode`, `postOfficeBox`,
`countryName`, `tradeAddressCountryId`.

`IUneceAuthentication`: `signatory`, `actualDateTime`, `statement`, `information`,
`signatoryImageBinaryObject`, `providerParty`, `issueLogisticsLocation`, `representationTypeCode`,
`includedClause`.

Role codes in `LISTS/unecePartyRoleCodeList.ts`: `Buyer` `#BY`, `Seller` `#SE`, `Exporter` `#EX`,
and ~1500 more.

### Line items — `IUneceSupplyChainTradeLineItem`

| what | path |
|---|---|
| line / contract number | `associatedDocumentLineDocument.lineId` |
| product name, grade, second name | `specifiedTradeProduct[].name`, `.designation`, `.tradeName` |
| origin | `specifiedTradeProduct[].originCountry[].countryId` (`IUneceCountry`) |
| tolerances | `specifiedTradeProduct[].applicableProductCharacteristic[].valueTolerance[]` → `IUneceTolerance` (`minusValuePercent`, `surplusValuePercent`, `marginValuePercent`, `minusValueQuantity`) |
| measurement method | `…applicableProductCharacteristic[].valueMethod[]` → `IUneceSpecifiedMethod` (`name`, `measurementCode`, `standardTypeCode`) |
| ordered quantity | `specifiedLineTradeDelivery[].orderQuantity` |
| per-package quantity | `specifiedLineTradeDelivery[].perPackageUnitQuantity` |
| packaging | `specifiedLineTradeDelivery[].includedPackaging[]` → `packageTypeCode`, `description` |
| weight rule | `specifiedLineTradeDelivery[].quantityCalculationMethodCode` |
| price | `specifiedLineTradeAgreement.agreedPriceProductPrice[]` → `unitAmount[]`, `basisQuantity` |
| line incoterm | `specifiedLineTradeAgreement.applicableDeliveryTerms` |

Sibling quantities on `IUneceLineTradeDelivery` for other lifecycle stages: `agreedQuantity`,
`requestedQuantity`, `despatchedQuantity`, `receivedQuantity`, `billedQuantity`, `packageQuantity`,
`productUnitQuantity`, `rejectedQuantity`, `returnedQuantity`.

**Do not use `IUneceLineTradeAgreement` as a line base.** Its quantities are ordering *constraints*
(`economicOrderQuantity`, `minimum`/`maximum`/`incrementalProductOrderableQuantity`), not the
ordered amount, and it has no product.

### Money and quantity

`IUneceAmountType`: `AmountTypeValue: string`, `AmountTypeCurrency: UneceAmountCurrency`
(`USDollar` = `unece:AmountCurrency#USD`).

`IUneceQuantityType`: `QuantityTypeValue: string`, `QuantityTypeCode: IUneceQuantityCode`.

> **Gap.** `IUneceQuantityCode` declares no value property — only `@context` and `type` — so a
> quantity **cannot carry its unit of measure**. `60` is storable, `60 kg` is not. This affects
> every quantity in the package. Keep the unit in an adjacent free-text or code property, and say so.

### Delivery terms — `IUneceDeliveryTerms`

`deliveryTermsDeliveryTypeCode?: UneceDeliveryTermsCodeList` (:43) — `FreeOnBoard` =
`unece:DeliveryTermsCodeList#FOB`; the list also has `CFR`, `CIF`, `CIP`, `CPT`, `DAP`, `DDP`,
`DPU`, `EXW`, `FAS`, `FCA`. There is **no Incoterms revision-year property anywhere**.

Also: `relevantLocation?: IUneceTradeLocation` (:67) for the named place,
`deliveryTermsFunctionCode` (:49), `riskResponsibilityCode` (:73), `description` (:55),
`partialDeliveryAllowedIndicator` (:61).

### Payment terms — `IUnecePaymentTerms`

`paymentTermsTypeCode?: (UnecePaymentTermsTypeCodeList | string)[]` (:132) —
`CashAgainstDocuments` = `#72`, `DocumentsAgainstPayment` = `#63`,
`DocumentsAgainstAcceptance` = `#61`, `Cash` = `#56`.

`paymentTermsEventTimeReferenceFromEventCode?: string` (:120) — takes
`unece:TimeReferenceCodeList#71` (*date of presentation of documents*).

Also `description` (:55), `information` (:83), `dueDateTime` (:62), `settlementPeriodMeasure`
(:139), `payeeParty` (:114), `instructedAmount` (:90).

> **Gap.** No location on `IUnecePaymentTerms`. A place of presentation must go in a second
> `applicableLocation[]` entry discriminated by `locationFunctionTypeCode`.

### Locations — `IUneceLogisticsLocation`

`name`, `description`, `countryName`, `logisticsLocationCountryId`, `identifier`, `postalAddress`,
and crucially `locationFunctionTypeCode?: (UneceLocationFunctionCodeList | string)[]` (:88) — the
discriminator that lets one array hold several kinds of place. `PlaceOfDelivery` = `#7`,
`PlaceOfPayment` = `#57`, `PlaceOfDischarge` = `#11`, `PortOfDischarge` = `#12`.

### Documents — `IUneceDocument`

Reachable from `IUneceHeaderTradeAgreement` through 27 slots, each with its own meaning:
`contractDocument[]`, `purchaseConditionsDocument[]`, `salesConditionsDocument[]`,
`additionalDocument[]`, `supplyInstructionDocument[]`, `buyerOrderDocument`, `sellerOrderDocument`,
`letterOfCreditDocument`, `exportLicenceDocument`, `importLicenceDocument`, `quotationDocument`, …

Useful members: `name`, `description`, `information`, `remarks`, `identifier`, `issuerAssignedId`,
`issueDateTime`, `issuerParty`, `versionId`, `documentTypeCode` (`UneceDocumentCodeList`),
`processCondition`, `contractualClause[]` (`IUneceClause`: `content`, `identifier`, `uRLId`),
`includedNote[]`, `signatoryAuthentication[]`, `validityPeriod`, `attachedBinaryFile`.

`UneceDocumentCodeList` has `Contract` `#315`, `PurchaseOrder` `#105`, `Order` `#220`,
`WarehouseWarrant` `#635`, `DeliveryNote` `#270`, `GoodsReceipt` `#632`,
`ForwarderSWarehouseReceipt` `#631`, `ContainerTransferNote` `#976`. It has **no**
`SaleConfirmation` and **no** holding-certificate code.

### Periods — `IUneceSpecifiedPeriod`

`name`, `description`, `startDateTime`, `endDateTime`, `completeDateTime`, `duration`,
`durationMeasure`, `purposeCode`, `seasonCode`, `typeCode`.

### Notes — `IUneceNote`

`content`, `subject`, `noteSubjectCode`, `name`, `identifier`, `creationDateTime`.

`includedNote` is declared on `IUneceDocument` (:199) and the same shape appears as
`additionalInformationNote` on `IUneceSupplyChainTradeLineItem`, `informationNote` on
`IUneceLineTradeDelivery` and `statementNote` on `IUneceRegulatoryProcedure`. It is lifted onto the
document models here as the home for prose with no typed slot.

### Regulatory — `IUneceRegulatoryProcedure`

`categoryCode`, `certificationBasis`, `remark`, `statementNote[]`, `document[]`,
`freeTradeAgreementName`, `originCriteria`, `goodsStatusCode`, plus a large customs vocabulary.

---

## 4. Confirmed absences — do not go looking

Each of these was searched across all 394 interfaces and all code lists, and returns zero hits:

| concept | grep | consequence |
|---|---|---|
| vessel nomination | `-i nominat` | 0 hits outside a party role code |
| arbitration / dispute forum | `-i arbitration` | 0 hits in interfaces **and** lists |
| clause precedence | `-i "override\|precedence\|prevail\|supersede"` | only a customs `requestOverrideCode` |
| insurance on an agreement | `-i insurance` on the three header classes | 0 hits; `IUneceCargoInsurance` hangs off `IUneceConsignment` only |
| Incoterms revision year | — | not modelled at all |
| `includesTradeItem` | `-rn includesTradeItem` | 0 hits — it is not a UN/CEFACT term in any casing |
| `orderedQuantity` | `-rn "orderedQuantity"` | 0 hits; the term is `orderQuantity`, on `LineTradeDelivery` only |

Vessel nomination, precedence and arbitration belong in `includedNote[]` with a discriminating
`subject`. Insurance got its own atom, `IInsurance`, because the `Insurance` row is a document field
in its own right rather than a stray remark.

Also note: everything under `.../src/models/typeCodes/` is **not** a domain enumeration — those
members are association-slot names. Every `typeCode` property is unioned with `| string`, so domain
values are free strings.
