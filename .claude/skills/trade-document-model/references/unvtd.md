# UN/CEFACT Verifiable Trade Documents (UNVTD)

`https://unvtd.unece.org/` publishes trade documents as W3C Verifiable Credentials: for each, a
self-contained JSON Schema at `<name>-schema.yaml` and a JSON-LD context at `<name>-context.json`.
Both were verified live.

**It is not a rival vocabulary — it is a serialization of BSP D23B.** Each context binds friendly
wire names onto `https://vocabulary.uncefact.org/` IRIs. That mapping is the single most useful
input when choosing a base class and property names for a new model.

## The published suite — 21 documents

Both URLs return 200 for each:

```
purchase-order              warehouse-receipt           commercial-invoice
packing-list                bill-of-lading              certificate-of-origin
sea-waybill                 air-waybill                 letter-of-credit
payment-confirmation        ships-delivery-order        shippers-letter-of-instructions
insurance-certificate       promissory-note             bill-of-exchange
customs-declaration         customs-bond                dangerous-goods-declaration
preferential-certificate-of-origin                      rail-consignment-note
road-consignment-note
```

The authoritative list is the `/docs` index. There is **no** machine-readable catalogue —
`index.json`, `catalog.json`, `manifest.json`, `sitemap.xml` all 404.

**Confirmed absent** after probing 62 URL spellings: sale confirmation, sales contract, trade
agreement, delivery note, transfer note, holding certificate, auction purchase confirmation, storage
warrant. If your document is one of these, generate from the PDF.

## House style, consistent across all 21

**Envelope.** `"@context"` is a single string pinned by `const` to the document's own context URL;
`type` is a 2-item array `[VerifiableCredential, <DocName>]`; `credentialSchema` is `{id, type}`
with both `const`; `issuer` is a `format: uri` DID; `credentialSubject` is the whole payload.
`validTo` is required in 10 of 21, `validFrom` never.

**Parties** — one shape, four sizes. All 99 party objects across the suite have `type` + `id` +
`name`; 62 add `street`, `city`, `state`, `zip`, `country`. `type` is a single-value enum acting as
a discriminator, not a JSON-LD `@type`. In every context the address expands to `schema:*`
(`schema:streetAddress`, `schema:addressLocality`, …) while the role class expands to
`unece:TradeParty` — 38 role names all collapse to that one IRI.

**Money** — `{amount, currency}`, 32 occurrences. **Quantities** — `{amount, unit}`, 46 occurrences.
Note both use the key `amount` and differ only in the second key.

**Line items** — the one inconsistent area. 10 of 21 schemas have an array collection and no two
agree on the property name or item shape: `orderedItems`, `storedGoods`, `itemsShipped`, `goods`,
`packages`, `declarationGoods`.

## Known defects — use for vocabulary, not validation

Proven by executing ajv against the live schema:

1. **Not valid JSON Schema 2020-12 despite declaring it.** Uses OpenAPI annotations: `name:` as a
   schema keyword and `example:` (JSON Schema spells it `examples`, an array). ajv in default strict
   mode refuses to compile: `strict mode: unknown keyword: "name"`.
2. **`additionalProperties` appears nowhere**, at any level. Arbitrary keys validate — but they are
   undefined in the context, so a strict JSON-LD processor drops or rejects them. The schema and the
   context disagree about whether extension is allowed.
3. **`zip` is `type: number`** in 67 of 68 party objects. `SE1 0UQ` is rejected; `00200` round-trips
   as `200`.
4. **`unlocode` is `format: uri`** — a UN/LOCODE is `GBTIL`, five characters, and is rejected.

Two semantic mappings in the purchase-order context are also questionable and were not followed
here: `quantityOrdered` → `unece:billedQuantity` (a settlement term, where the order quantity is
`orderQuantity` on `LineTradeDelivery`), and `deliveryLocation` → `unece:shipToParty` (a Party class
for what is a place).

## What UNVTD cannot express

Measured against the D.R. Wakefield buyer's purchase contract, a real coffee contract: of 53 to 71
atomic facts depending on how they are counted, roughly **38% survive intact, 15% degrade, 47% have
no home**. What survives is the commercial skeleton — who, what, how many, how much. What is lost is
the legal and regulatory layer: the Incoterm, the governing standard contract, the arbitration
forum, the precedence rule, the condition precedent, the insurance allocation, the EUDR assertion,
and every trace of signature and stamp.

Four of its required properties cannot be honestly supplied by a paper document: a header-level
`purchaseOrderNumber` when the paper numbers each line, `buyer.id` and `seller.id` (DIDs — no paper
contract predating a DID registry has one), and `orderedItems[].productIdentifier` when the document
has no product code.

And one silent corruption: `unitPrice` is `{amount, currency}` with no basis quantity, so a contract
priced per 50 kg on 60 kg bags reads as **95,060 USD** against a true **114,072 USD**.

**This is why the repo models BSP directly and treats UNVTD as the wire format.** If UNVTD interop
is needed, add a lossy `toUnvtd<Document>()` projection rather than adopting its shape.
