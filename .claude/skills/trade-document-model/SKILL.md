---
name: trade-document-model
description: Generate a UN/CEFACT-aligned TypeScript model, JSON Schema and coverage proof for a trade document in this repository, starting from a real sample PDF and, where one exists, the published UNVTD schema. Use when adding or revising any document model under packages/trade-document-models/src/models — bill of lading, commercial invoice, auction purchase confirmation, goods receipt note, transfer note, warrant, holding certificate, delivery note, or any other trade document.
---

# Trade document model generation

Turn a real trade document into a TypeScript model, a generated JSON Schema, and an executable
proof that the document round-trips without losing data.

## The two rules that decide every tie

1. **The real sample documents must be fully representable, with nothing left behind.** This
   outranks everything else, including matching a published schema's `required` list. If a standard
   demands a field the paper does not carry, the field is optional here.
2. **Take as much as possible from the published standard.** Where UNVTD publishes a schema for the
   document, its property set, its required list and above all its JSON-LD context are the starting
   point. The context is the valuable part: it maps UNVTD's friendly wire names onto UN/CEFACT BSP
   D23B IRIs, which is exactly what this repository models.

And two rules that follow from the first:

3. **Never derive, infer or synthesise a value.** If the page does not state it, leave the property
   absent. A composite invented to satisfy a `required` list — a range of line numbers standing in
   for a missing document number, a role code inferred from a letterhead — is data corruption, not
   completeness. Deterministic *format* normalisation of a value that IS on the page (a written date
   to ISO 8601, a stated month to its first and last day) is not derivation and is expected.

4. **Nothing committed carries real counterparty data.** The sample PDFs live under `.context/`,
   which is gitignored on purpose — they were deliberately kept out of the repository, and a
   verbatim transcription of one puts the same content back in, in a form that is structured and
   searchable. See "Anonymisation" below for how to anonymise without weakening the proof.

## Anonymisation

Everything committed — fixture, spec, model TSDoc (which is copied verbatim into the published
schema `description`), model guide, README — uses **fictional** parties, addresses, references,
quantities, prices and dates. The verbatim reading of the real page lives only in the fact
inventory you work from and in the gitignored `.ocr-preview/` artefact.

This costs the proof nothing: it demonstrates that every *field* is carried, and field coverage does
not depend on the literal values.

**Replace the shape, not just the string.** The awkwardness of a real document is exactly what
tests the model, so every fictional value must reproduce the format, length and irregularity of the
one it replaces:

| keep | because |
|---|---|
| a UK postcode alphanumeric, with its space (`BS1 4RN`) | UNVTD's `zip: number` rejects it — that is a finding |
| leading zeros in postal codes (`00240`) | they get eaten by numeric types |
| comma-joined tokens with no space (`Mwitu,AB`) | it is what the parser must split |
| consecutive line numbers with no header number | it is why `identifier` is optional |
| the typed-vs-stamped party name mismatch | a real contradiction the model must be able to hold |
| a price basis that differs from the packing unit (per 50 kg on 60 kg bags) | the factor that UNVTD loses |
| industry and regulatory boilerplate — Incoterms, `N.S.W`, `Actual Tare`, `Grain Pro`, `EUDR`, the European Standard Contract for Coffee, arbitration seats, grades, origin country | public terms, not counterparty data |

Recompute anything derived from the changed numbers — line totals, contract totals, the figures
quoted in the docs — and check the diff: a bulk find-and-replace will silently hit values it should
not. In this repo it turned the 50 kg price basis into 45.

State in the fixture header that the values are anonymised and that the shape is preserved.

**Do not record the substitution.** Writing `real → fictional` anywhere in a committed file puts the
real value back in the repository, which is the thing rule 4 exists to prevent. Show the fictional
value and describe the shape it preserves.

## Step 0 — Collect the inputs

Ask the user, in one `AskUserQuestion` call, unless they have already said:

- **Which standard to align to.** Offer the UNVTD document name if one plausibly exists — check
  `references/unvtd.md` for the published list of 21 — or "none, generate from the PDF".
- **The sample PDF(s).** Path under `.context/Document Samples/`. More than one sample of the same
  document type is much better than one: it reveals which fields are optional.
- **The model name**, e.g. `IBillOfLading`. Follow the existing `I<Document>` convention.

If the user already named a UNVTD URL and a PDF, skip the question and proceed.

## Step 1 — Read the document exhaustively

This is the step that determines quality. Do not skim it.

```shell
pdfinfo "<pdf>"                                   # page size, and whether there is a text layer
pdftotext -layout "<pdf>" -                       # try the text layer first
pdftoppm -png -r 200 "<pdf>" /tmp/doc             # render, then Read the PNG
```

- **Find the native resolution before choosing a dpi.** These scans are single JPEGs; rendering
  above the raster's own dpi only interpolates and recovers nothing. `pdfimages -list` shows it.
- **Text layers on scanned samples are frequently corrupt.** Read the render visually and treat it
  as authoritative; use the text layer only to cross-check spellings.
- **Faint regions need contrast stretching, not more dpi.** Crop the native pixels and stretch.
- Read the whole page systematically, top to bottom. Empty boxes, blank ruled rows, stamps,
  manuscript marks and small print all count.

Produce a numbered **atomic fact inventory** — one row per indivisible fact:

| id | verbatim string | where | H/L | meaning | data kind |

Splitting rules, learned the hard way:

- Split every composite string into its atoms. `FOB origin, N.S.W, 0.5% franchise, Actual Tare.` is
  **four** facts. `NDW, Felixstowe, United Kingdom` is **three**. `$/50kg` is **two**. `Mwitu,AB` is
  **two**.
- Classify each fact as **data bearing** or **page furniture**. Furniture — logos, straplines,
  column captions, field labels, ruling, empty boxes, scanner dust, blank page area — needs no home
  in a schema and must not inflate the coverage claim.
- Flag low-confidence readings explicitly and carry the flag through to the fixture comments.
- Note contradictions on the page itself. Real documents contain them: a typed party name that
  differs from the stamped one, a header total that disagrees with the line sum, a struck-through
  value amended by hand. The model must be able to hold what the page says, not a tidied version.

Record the totals: total atomic facts, data bearing, page furniture.

## Step 2 — Fetch the standard

If a UNVTD document exists:

```shell
curl -sS https://unvtd.unece.org/<name>-schema.yaml  -o /tmp/<name>-schema.yaml
curl -sS https://unvtd.unece.org/<name>-context.json -o /tmp/<name>-context.json
```

Read **both**. Only `credentialSubject` and below matters — the rest is the Verifiable Credential
envelope, which this repository does not model.

**The context is the important file.** It tells you which UN/CEFACT class the document is and which
D23B IRI each wire name expands to. For the purchase order it declares
`"PurchaseOrder": "unece:HeaderTradeAgreement"`, `"orderDate": "unece:issueDateTime"`,
`"orderedItems": "unece:includedSupplyChainTradeLineItem"` — which is how the base class and half
the property names were chosen. Do the same for your document.

Be aware that the UNVTD schemas have real defects; see `references/unvtd.md`. They are not valid
JSON Schema 2020-12 despite declaring it, they set no `additionalProperties`, and several field
types are wrong (`zip` as a number, `unlocode` as a URI). Use them for *vocabulary and structure*,
not as a validation authority.

If no UNVTD document exists, say so explicitly with the URLs you probed, and generate from the PDF
alone — staying coherent with the existing models and reusing their classes.

## Step 3 — Find a grep-proven home for every data-bearing fact

Work in `.context/twin-standards/packages/standards-unece/src/models/`, which matches the installed
`@twin.org/standards-unece`.

**Never name a property you have not confirmed.** Every claim needs a `file:line`:

```shell
BSP=.context/twin-standards/packages/standards-unece/src/models/bsp
grep -nE '^\s+<property>\??:' $BSP/IUnece<Class>.ts       # does it exist, and what type
grep -rn '<property>' $BSP/                                # who else declares it
grep -rnE '^\s+[a-zA-Z]*<Concept>[a-zA-Z]*\??:' $BSP/      # find candidates by concept
```

For code list values, quote the exact member:

```shell
grep -nB2 -E '^\s+<Member>:' .context/twin-standards/packages/standards-unece/src/models/lists/<list>.ts
```

`references/unece-property-map.md` has the paths already proven for the coffee documents — parties,
lines, prices, quantities, packaging, incoterms, periods, locations, documents, clauses, notes,
authentications — plus the known gaps. Start there before searching.

For each fact record: **HOME** with the full path, or **NO HOME** with the closest miss and why it
fails. A near-miss that means something else is not a home. Two real examples from this repo:
`IUneceCargoInsurance` exists but hangs off a physical `Consignment`, so it cannot carry a contract's
insurance allocation; `IUneceMarking` is documented as an inscription *on packaging*, so it cannot
carry a rubber stamp on paper.

## Step 4 — Write the model

The package has two layers, and the distinction is the point:

```
src/models/                 documents — one file per trade document
├── IPurchaseOrder.ts
├── ITradeAgreement.ts
└── atoms/                  child types — the pieces documents are made of
    ├── ITradeParty.ts  ITradeItem.ts  ILocation.ts  IAmount.ts
    ├── IPaymentTerms.ts  IPaymentMeans.ts  IAllowanceCharge.ts
    ├── INote.ts  ITradeDelivery.ts  IDeliveryTerms.ts  IReferencedDocument.ts
    └── IBasis.ts  IInsurance.ts  IConditions.ts
```

### Atoms are the decoupling layer

**A document model should not name an `IUnece*` type in its own properties.** Every child type goes
through an atom, so the document depends on the atom and only the atom depends on UN/CEFACT.
`ITradeItem` wraps `IUneceSupplyChainTradeLineItem`, `ITradeParty` wraps `IUneceTradeParty`,
`ILocation` wraps `IUneceLogisticsLocation`, and so on. That buys three things:

- **one place to change** when the vocabulary moves under us — every `@twin.org/*` dependency is
  pinned to the `next` dist-tag, so it does move;
- **one place to constrain** — an atom is where a field becomes mandatory for the whole package,
  rather than being re-promoted in every document that uses it;
- **a name the domain uses** — `ILocation` rather than `IUneceLogisticsLocation`.

The document's *own* base is still a direct `IUnece*` intersection; only its child properties go
through atoms.

### Reuse before you create

Check `src/models/atoms/` first. If an existing atom nearly fits, **widen it rather than fork it** —
every document in the package should share one party type, one line type, one location type. A
second party atom is almost always a mistake. Only create a new atom when the concept is genuinely
absent, and prefer widening the base or relaxing a promoted field to duplicating.

### The two atom shapes

**Derived from UN/CEFACT** — the normal case:

```ts
/**
 * One or two lines. This becomes the schema description, verbatim.
 * @json-schema embedded:defs
 */
export type ILocation = IUneceLogisticsLocation &
  Required<Pick<IUneceLogisticsLocation, "@context" | "type" | "name">>;
```

**Local, when UN/CEFACT has no class for it** — a document row that is only ever text. It is still
an object, never a bare `export type IFoo = string`: a bare alias breaks coherence with every other
type *and* is still emitted as a `$ref`, so it buys nothing. Follow UN/CEFACT's own convention for
scalar values (`AmountTypeValue`, `QuantityTypeValue`) and name the field `<Name>Value`:

```ts
export interface IBasis {
    /** JSON-LD Context. */
    "@context": UneceContextType;
    /** JSON-LD Type. */
    type: typeof TradeDocumentTypes.Basis;
    /** The verbatim text of the `Basis` row. */
    BasisValue: string;
}
```

`ts-to-schema` resolves the local const and emits `"const": "Basis"`, exactly as it does for
`UneceTypes` members. Growing such an atom later — a coded Incoterm, a numeric franchise — adds
properties beside `<Name>Value` without changing the documents that use it.

### Rules for both layers

- **Always promote `@context` and `type`.** Every object, at every depth, carries its own JSON-LD
  scaffolding. Making `@context` mandatory on an atom means every nested instance must set it —
  that is the intended cost.
- **Tag every atom `@json-schema embedded:defs`** so it is hoisted into the referencing document's
  `$defs` instead of an external URL. It is a no-op for atoms reached only through an array, which
  is a tool limitation, not a reason to omit it.
- **Promote to mandatory only what every sample carries.** Two samples disagreeing means optional.
- **Choose the document's base from the standard**, via the UNVTD context if there is one, otherwise
  by matching semantics to a BSP class. `references/unece-property-map.md §1` lists what each class
  in use can and cannot hold.
- **Never end a type with `& { }`** — it silently degrades the generated schema.
- **Never name a type you have not verified exists.** `IUneceDeliveryLocation` reads like it should
  exist and does not; the vocabulary's location classes are `IUneceLocation`,
  `IUneceLogisticsLocation`, `IUneceSpecifiedLocation`, `IUneceTradeLocation`,
  `IUneceSubordinateLocation`, `IUneceTransportServiceLocation`, `IUneceTTLocation`.
- **A local property must reuse a UN/CEFACT name that exists somewhere**, even if on another class,
  rather than inventing one. `includedNote`, `issueDateTime` and
  `includedSupplyChainTradeLineItem` are all used off-domain here for that reason, and UNECE's own
  UNVTD context does the same. The exception is a document row with no UN/CEFACT concept at all —
  `basis`, `insurance`, `conditions` — where the paper's own label is the honest name.
- **Mirror the document's fields.** If the paper has a labelled row, the model should have a
  property a reader can find without tracing an inherited chain. Re-declaring an inherited property
  to narrow it to an atom is the normal way to do that.
- **Keep the verbatim text and the coded value both**, when a row carries more than the code can
  express. `basis` holds `FOB origin, N.S.W, 0.5% franchise, Actual Tare.` while
  `applicableDeliveryTerms` holds the coded Incoterm and its named place. This is the pipeline's
  verbatim and normalized stages, not redundancy.
- **Choose between a note and an atom deliberately.** A labelled row on the document — `Basis`,
  `Insurance`, `Conditions` — is a field and deserves its own atom, even when the value is only
  text. A stray remark with no row of its own — a precedence rule buried in a footer clause, an
  arbitration seat, a vessel-nomination undertaking — goes in `includedNote[]`, discriminated by
  `subject`.
- **Keep TSDoc to one or two lines per property, four or five for the type.** The comment is copied
  **verbatim** into the published schema's `description`. Rationale, mapping tables and the history
  of a decision belong in `docs/model-guide.md` — link to the section instead of restating it.

### Naming against a standard

Where a published standard names a property differently from D23B, decide once per document and say
so in the type's TSDoc. `IPurchaseOrder` uses UNVTD's wire names (`deliveryLocation`,
`paymentTerms`, `paymentMethod`, `allowanceCharge`, `totalOrderAmount`) because that is the schema
it is aligned to; the cost is that a payload expands under the UNVTD context but not under the plain
D23B one. Record the trade-off rather than leaving it implicit.

## Step 5 — Wire it, every place

A model or atom that misses any of these is invisible or silently broken. **Atoms need all four too**:

1. `src/models/tradeDocumentTypes.ts` — add a local profile name. It must equal the schema `$id`
   segment, and be unique even when two documents share a UN/CEFACT class. A local atom also reads
   its `type` const from here.
2. `ts-to-schema.json` — add the file path to `types`. **Every atom must be listed**, including
   primitive-looking ones: omitting one emits a dangling `$ref` with no warning and exit 0.
3. `src/dataTypes/tradeDocumentDataTypes.ts` — import and register the generated schema.
4. `src/index.ts` — re-export it.

See `references/toolchain.md` for what the generator does with the idiom and where it will surprise
you.

## Step 6 — Prove it, executably

Two files, and they are the deliverable as much as the model is:

**`tests/fixtures/<document>.ts`** — the whole sample transcribed into the model, every property
tagged with its fact id in a comment. If a path does not exist with the right type, `tspc` rejects
the file, which is the point: the compiler does the verification.

**`tests/documents/<document>.spec.ts`** — three things:

1. the fixture validates against the generated schema;
2. `test.each` over a `[factId, label, actual, expected]` table asserting **every** data-bearing
   fact individually;
3. an assertion that the covered fact-id set is **exactly** the inventory's data-bearing set, and a
   "nothing is derived" test asserting that what the page does not state is absent.

Put them under `tests/documents/`. **Not** `tests/coverage/` — `.gitignore` has a bare `coverage`
rule, so a spec there is silently never committed. If `docs/model-guide.md` says otherwise, the
guide is stale; this file and `references/toolchain.md` are the authority on repository mechanics.

Then run the gate and do not stop until it is green:

```shell
cd packages/trade-document-models && npm run dist
```

## Step 7 — Simulate the OCR output and look at it

Before documenting anything, produce the artefact that shows what the pipeline would actually emit
for this PDF, and read it against the page:

```shell
node .claude/skills/trade-document-model/scripts/ocr-preview.mjs \
  --fixture packages/trade-document-models/tests/fixtures/<document>.ts \
  --export  <FIXTURE_EXPORT> \
  --type    <TradeDocumentTypes value> \
  --pdf     "<path to the sample PDF>"
```

It writes to `.ocr-preview/<document>/`, which is gitignored — **none of it is committed**, and it
is regenerated on demand. Three files:

- `normalized.json` — the instance the pipeline would commit to TWIN Core, pretty-printed.
- `mapping.md` — every leaf as a JSON path and value, so the conversion can be read line by line
  against the page. JSON-LD scaffolding is listed separately so it does not drown the payload.
- `validation.txt` — the real result of validating against the generated schema, via the same
  `DataTypeHelper` a consumer would use.

Because it loads the fixture and the generated schema directly, it cannot drift from what the tests
assert. Then do the three checks `mapping.md` ends with:

1. **Every value in the preview is on the page.** Anything that is not is a derivation — remove it
   and leave the property absent.
2. **Every fact on the page is in the preview**, or is deliberately absent and recorded as such.
   Compare against the fact inventory from step 1; page furniture does not count.
3. **Nothing landed in a property that means something else.** This is the check the schema cannot
   do for you: a value in a syntactically valid but semantically wrong slot validates fine.

Show the user the payload count and the validation result, and offer them the path. Reviewing this
artefact is cheaper than reviewing the model, and it is the step that catches a wrong mapping.

## Step 8 — Document it

Add a section to `packages/trade-document-models/docs/model-guide.md`:

- the fact totals — atomic, data bearing, page furniture;
- where the non-obvious facts landed;
- which facts needed `includedNote` and why no typed slot exists, with the grep that proves it;
- anything left absent because the page does not state it;
- residual limitations, separating what is missing here from what is missing upstream.

Update the target-document table in the root `README.md`.

## Report honestly

State the coverage as a count, not an impression: *N atomic facts, M data bearing, all M carried* —
or, if not all, exactly which are not and why. If a fact could only be placed by bending a property
to mean something it does not, say so rather than counting it as covered. If the sample contradicts
itself, report the contradiction; do not resolve it silently.

## What a run delivers

| | committed |
|---|---|
| `src/models/I<Document>.ts` | yes |
| any new or widened atom under `src/models/atoms/` | yes |
| the four wiring edits, for the document **and** for each new atom | yes |
| `src/schemas/*.json`, regenerated — one per document and per atom | yes |
| `tests/fixtures/<document>.ts` and `tests/documents/<document>.spec.ts` | yes |
| a section in `docs/model-guide.md` and a row in the root `README.md` | yes |
| the atom table in `references/unece-property-map.md §1`, if you added one | yes |
| `.ocr-preview/<document>/` — the simulated conversion | **no**, gitignored, regenerate on demand |

## References

- `references/unece-property-map.md` — proven property paths, the classes in use, the known gaps
- `references/unvtd.md` — the published UNVTD suite, its house style, its defects
- `references/toolchain.md` — ts-to-schema behaviour, build chain, the traps
- `scripts/ocr-preview.mjs` — the step 7 generator
