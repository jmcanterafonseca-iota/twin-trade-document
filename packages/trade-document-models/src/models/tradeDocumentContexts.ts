// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { UneceContexts } from "@twin.org/standards-unece";

/**
 * The contexts of auditable item graph data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TradeDocumentContexts = {
	/**
	 * The canonical RDF namespace URI for Auditable Item Graph.
	 */
	Namespace: "https://schema.twindev.org/trade-document/",

	/**
	 * The value to use in context for Auditable Item Graph.
	 */
	Context: "https://unvtd.unece.org/",

	/**
	 * The canonical RDF namespace URI for TWIN Common.
	 */
	ContextTradeAgreement: `${UneceContexts.Context}`,

} as const;

/**
 * The contexts of auditable item graph data.
 */
export type TradeDocumentContexts =
	(typeof TradeDocumentContexts)[keyof typeof TradeDocumentContexts];
