// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The types of trade document data.
 *
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
	Party: "TradeParty",

	/**
	 * A place named by a trade document.
	 */
	Location: "Location",

	/**
	 * A postal address of a trade party.
	 */
	Address: "Address",

	/**
	 * A monetary amount together with its currency.
	 */
	MonetaryAmount: "MonetaryAmount",

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
	 * The delivery terms of a trade document.
	 */
	DeliveryTerms: "DeliveryTerms",

	/**
	 * A commercial invoice: goods delivered together with a demand for payment.
	 */
	CommercialInvoice: "CommercialInvoice",

	/**
	 * A measured value such as a weight.
	 */
	Measure: "Measure",

	/**
	 * A period of time delimited by start and end date times.
	 */
	Period: "Period",

	/**
	 * How goods are packed.
	 */
	ProductPackage: "ProductPackage",

	/**
	 * The goods on a line.
	 */
	Product: "Product"
} as const;

/**
 * The types of trade document data.
 */
export type TradeDocumentTypes = (typeof TradeDocumentTypes)[keyof typeof TradeDocumentTypes];
