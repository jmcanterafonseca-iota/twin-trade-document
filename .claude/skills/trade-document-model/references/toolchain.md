# Toolchain behaviour and traps

All from `@twin.org/tools-core@0.9.2-next.1`, verified by running the tools, not by reading docs.

## Commands

Everything runs from `packages/trade-document-models` — there is no root `package.json`.

```shell
npm run build          # build:schema -> build:jsonld-context -> build:compile
npm run build:schema   # ts-to-schema: TS -> src/schemas/*.json
npm run build:compile  # tspc (ts-patch), NOT tsc
npm run test:build     # type-check the tests
npm test               # vitest
npm run dist           # the full gate — this is what must be green
```

`npm run clean` deletes `src/schemas/`, which is **generated output that is also committed**. After
any model change, rerun the build and commit the regenerated schemas in the same commit.

Use `tspc`, never `tsc`: `tsconfig.json` declares a `plugins` entry that only ts-patch honours, and
`tsc` silently drops `nameof` resolution.

## How `ts-to-schema` handles the house idiom

It parses the TypeScript **AST only** — there is no type checker, so everything is syntactic
pattern matching.

**`Required<Pick<Base, K>>` is inlined and makes every picked key required.** The generator resolves
`Base` to a concrete object schema, following the import into
`node_modules/@twin.org/standards-unece/dist/types/**.d.ts`, picks the keys, then sets
`required = Object.keys(properties)` unconditionally. This is the whole mechanism for promoting
optional UN/CEFACT fields to mandatory.

**Intersections flatten only if every member is an object or a bare `$ref`.** Bare `$ref` members
are preserved into `allOf` and contribute no properties. Later members overwrite earlier ones —
which is why a local `buyerParty: ITradeParty` correctly overrides the picked
`buyerParty: IUneceTradeParty`.

**A trailing `& { }` breaks flattening.** An empty type literal maps to `{"type":"object"}` with no
`properties`, the merge aborts, and the output degrades to a raw three-branch `allOf` with a dead
`{"type":"object"}` element. Never end a model that way.

**An inline anonymous narrowing works and needs no file.** This is how `ITradeItem` keeps the price
mandatory one level down:

```ts
specifiedLineTradeAgreement: IUneceLineTradeAgreement &
  Required<Pick<IUneceLineTradeAgreement, "agreedPriceProductPrice">>;
```

A *named exported* intermediate type would not: `ts-to-schema` emits a `$ref` to a schema it never
generates unless the type has its own file listed in `types`.

**JSDoc is load-bearing.** The leading comment becomes the schema `description` verbatim — keep it
short, it ships to consumers. `@json-schema format:date-time` becomes `"format": "date-time"`. Tags
also ride in from the dependency's `.d.ts`.

## `$ref` URLs

Two kinds, both **pure string construction at build time**; nothing is ever dereferenced or
existence-checked.

| `$ref` | live | why |
|---|---|---|
| `https://schema.twindev.org/unece/Unece*` | 200 | `standards-unece` is published |
| `https://schema.twindev.org/trade-document/*` | 404 | this package is not published |
| `#/$defs/TradeParty` | — | local |

Local refs are `baseUrl + StringHelper.stripPrefix(typeName)`. External refs come from the
`externalReferences` regex map in `ts-to-schema.json` — `"IUnece(.*)"` compiles to
`/^IUnece(.*)$/`. The 404 does not affect the build, and does not affect runtime validation either,
because `TradeDocumentTypes` values equal the schema `$id`s and `DataTypeHelper` resolves them from
its local factory first.

## `@json-schema embedded:defs|inline`

Hoists a referenced schema into the referencing file. Sharp constraints, all verified:

- **The tag goes on the referenced declaration, never on the referencing property.** On a property
  it is silently discarded — no error, no warning.
- **It does not reach through arrays.** The generator visits direct property references but never
  `items`, `additionalProperties`, `not`, `contains`, `propertyNames` or `if`/`then`/`else`. This is
  why `ITradeParty` embeds and `ITradeItem` does not.
- **It cannot reach an external package.** The mode map is not propagated back from the forked
  context in which a dependency's `.d.ts` is parsed, so tagging a UNECE interface does nothing.
- **`inline` corrupts the model** — it merges base properties over derived ones, silently widening
  narrowed types. Do not use it.

A fully self-contained schema is therefore **not achievable** with this toolchain.

## `ts-to-schema.json` — keep child types listed

Removing a child type from `types` does not remove the `$ref` to it. The tool exits 0, emits no
warning, and produces a dangling reference to a file it never writes. Conceptual hierarchy is
expressed with `embedded:defs`, not by shortening the `types` array.

## Runtime registration

`DataTypeHelper.registerTypes(namespace, context, types)` registers under the **raw string
concatenation** `namespace + type`; the schema's own `$id` is never consulted. Keep
`TradeDocumentTypes.X` equal to the `$id` segment so local `$ref`s resolve.

`DataTypeHelper.validate` returns `true` when nothing is registered under the given key — a typo in
the type URL silently passes. Always build the key from the constants.

**Call `UneceDataTypes.registerTypes()` before validating.** Without it every
`https://schema.twindev.org/unece/*` `$ref` is fetched over HTTP at first compile: the suite goes
from 9 s to 95 s and needs internet access.

## Other traps

- `.gitignore` has a bare `coverage` rule, so **`tests/coverage/` is ignored**. Put document specs
  under `tests/documents/`.
- `vitest.config.ts` sets `bail: 1`, so the run stops at the first failure.
- Tests use `globals: true` — do not import `describe`/`test`/`expect`.
- No `additionalProperties: false` is ever emitted, so a misspelled property passes validation
  silently. This is exactly how an `issueDate`/`issueDateTime` typo went unnoticed in the original
  test.
- All `@twin.org/*` deps are pinned to the `next` dist-tag. An unexplained type error after
  `npm install` may come from a dependency bump.
- `UneceCountryId` members are SCREAMING CASE: `UneceCountryId.KENYA`, not `.Kenya`.
- `ts-to-jsonld-context.json` still carries the `twin-aig` prefix and an empty `types` array, and
  the generator only visits `interface` declarations — all four models are type aliases, so listing
  them changes nothing.
