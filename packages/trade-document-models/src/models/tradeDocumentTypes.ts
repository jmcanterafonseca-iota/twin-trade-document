// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of trade document data.
 * These are local profile names, used as the data type registration key
 * (`Namespace + type`) and matching each generated schema's `$id`. They are not
 * UN/CEFACT class names: two documents can share one class, so deriving them
 * from `UneceTypes` would collide. A payload's JSON-LD `type` stays the
 * UN/CEFACT class name its base interface pins it to.
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
