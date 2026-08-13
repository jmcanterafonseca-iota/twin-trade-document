// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of trade document data.
 *
 * These are local profile names, not UN/CEFACT class names, and they are what
 * `DataTypeHelper` is keyed on: the registration key is
 * `TradeDocumentContexts.Namespace + TradeDocumentTypes.X`. Deriving them from
 * `UneceTypes` is no longer possible, because a sale confirmation and a
 * purchase order are the same UN/CEFACT class — both would resolve to
 * `HeaderTradeAgreement` and the second registration would silently overwrite
 * the first.
 *
 * Each value matches the `$id` of the schema generated for it, so that a
 * `$ref` between the generated schemas resolves against the local factory
 * instead of being fetched over HTTP.
 *
 * The JSON-LD `type` carried inside a payload is a different thing: it stays
 * the UN/CEFACT class name that the model's base interface pins it to, for
 * example `UneceTypes.HeaderTradeAgreement` for both document types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TradeDocumentTypes = {
	/**
	 * A seller issued sales contract, also called a sale confirmation.
	 */
	TradeAgreement: "TradeAgreement",

	/**
	 * A buyer issued purchase contract, also called a purchase order.
	 */
	PurchaseOrder: "PurchaseOrder",

	/**
	 * A single contracted lot, carried as one line of a trade document.
	 */
	TradeItem: "TradeItem",

	/**
	 * A party taking a role in a trade document.
	 */
	TradeParty: "TradeParty"
} as const;

/**
 * The types of trade document data.
 */
export type TradeDocumentTypes =
	(typeof TradeDocumentTypes)[keyof typeof TradeDocumentTypes];
