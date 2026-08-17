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
	TradeParty: "TradeParty",

	/**
	 * A place named by a trade document.
	 */
	Location: "Location",

	/**
	 * A monetary amount.
	 */
	Amount: "Amount",

	/**
	 * The terms of payment.
	 */
	PaymentTerms: "PaymentTerms",

	/**
	 * The means by which a payment is made.
	 */
	PaymentMeans: "PaymentMeans",

	/**
	 * An allowance or a charge.
	 */
	AllowanceCharge: "AllowanceCharge",

	/**
	 * Contractual prose with no typed UN/CEFACT slot.
	 */
	Note: "Note",

	/**
	 * The shipping details of a trade document.
	 */
	TradeDelivery: "TradeDelivery",

	/**
	 * The delivery terms of a trade document.
	 */
	DeliveryTerms: "DeliveryTerms",

	/**
	 * Another document referenced by a trade document.
	 */
	ReferencedDocument: "ReferencedDocument",

	/**
	 * The trading basis of a document, verbatim.
	 */
	Basis: "Basis",

	/**
	 * How insurance is allocated between the parties, verbatim.
	 */
	Insurance: "Insurance",

	/**
	 * Conditions the document is subject to, verbatim.
	 */
	Conditions: "Conditions",

	/**
	 * A date carried by a trade document.
	 */
	Date: "Date",

	/**
	 * A commercial invoice: goods delivered together with a demand for payment.
	 */
	CommercialInvoice: "CommercialInvoice",

	/**
	 * A measured value such as a weight.
	 */
	Measure: "Measure",

	/**
	 * The quality of the goods, verbatim.
	 */
	Quality: "Quality",

	/**
	 * A counted or measured quantity.
	 */
	Quantity: "Quantity",

	/**
	 * How goods are packed.
	 */
	Packaging: "Packaging",

	/**
	 * The goods on a line.
	 */
	Product: "Product",

	/**
	 * A unit price and the quantity it is quoted against.
	 */
	Price: "Price",

	/**
	 * The delivery facet of a line.
	 */
	LineDelivery: "LineDelivery",

	/**
	 * The pricing facet of a line.
	 */
	LineAgreement: "LineAgreement",
} as const;

/**
 * The types of trade document data.
 */
export type TradeDocumentTypes =
	(typeof TradeDocumentTypes)[keyof typeof TradeDocumentTypes];
