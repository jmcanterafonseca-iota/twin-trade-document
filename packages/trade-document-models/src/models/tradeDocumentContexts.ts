// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { UneceContexts } from "@twin.org/standards-unece";

/**
 * The contexts of trade document data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TradeDocumentContexts = {
	/**
	 * The canonical RDF namespace URI for trade documents.
	 * Used as the prefix of every data type registration key, and as the
	 * `baseUrl` from which the generated schemas take their `$id`.
	 */
	Namespace: "https://schema.twindev.org/trade-document/",

	/**
	 * The value to use in `@context`.
	 *
	 * Every property of every model in this package comes from UN/CEFACT
	 * Buy-Ship-Pay D23B, via `@twin.org/standards-unece`, so the D23B context
	 * is the one that resolves them.
	 *
	 * The previous values pointed at `https://unvtd.unece.org/` and
	 * `https://unvtd.unece.org/purchase-order-context.json`. Both are live: that
	 * is the UN/CEFACT Verifiable Trade Documents project, which publishes 21
	 * document schemas as Verifiable Credentials. Its contexts are not wrong,
	 * they are a different layer — each maps one document's shorthand wire names
	 * onto D23B IRIs, so `purchase-order-context.json` only defines terms for a
	 * purchase order and would leave every property of these models undefined.
	 */
	Context: `${UneceContexts.Context}`,

	/**
	 * The namespace location of the hosted version of the JSON Schema.
	 */
	JsonSchemaNamespace: "https://schema.twindev.org/trade-document/"
} as const;

/**
 * The contexts of trade document data.
 */
export type TradeDocumentContexts =
	(typeof TradeDocumentContexts)[keyof typeof TradeDocumentContexts];
