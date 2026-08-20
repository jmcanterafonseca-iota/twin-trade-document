// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { UneceContexts } from "@twin.org/standards-unece";

/**
 * The contexts of trade document data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TradeDocumentContexts = {
	/**
	 * The canonical RDF namespace URI for trade documents. Prefixes every data
	 * type registration key and every generated schema `$id`.
	 */
	Namespace: "https://schema.twindev.org/trade-document/",

	/**
	 * The value to use in `@context`. Every property comes from UN/CEFACT
	 * Buy-Ship-Pay D23B, so the D23B context is the one that resolves them.
	 * Properties named after UNVTD wire names resolve only under that document's
	 * own context; see docs/model-guide.md §6.
	 */
	Context: `${UneceContexts.Context}`,

	/**
	 * The namespace location of the hosted version of the JSON Schema.
	 */
	JsonSchemaNamespace: "https://schema.twindev.org/trade-document/",

	/**
	 * Bill of lading context.
	 */
	BillOfLadingContext: "https://unvtd.unece.org/bill-of-lading-context.json",

	/**
	 * Commercial invoice context.
	 */
	CommercialInvoiceContext: "https://unvtd.unece.org/commercial-invoice-context.json",

	/**
	 * Purchase order context.
	 */
	PurchaseOrderContext: "https://unvtd.unece.org/purchase-order-context.json"
} as const;

/**
 * The contexts of trade document data.
 */
export type TradeDocumentContexts =
	(typeof TradeDocumentContexts)[keyof typeof TradeDocumentContexts];
