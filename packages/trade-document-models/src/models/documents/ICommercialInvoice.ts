// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceDocument } from "@twin.org/standards-unece";
import type { IMeasure } from "../valueObjects/IMeasure.js";
import type { IMonetaryAmount } from "../valueObjects/IMonetaryAmount.js";
import type { IProductPackage } from "../valueObjects/IProductPackage.js";
import type { ILocation } from "../entities/ILocation.js";
import type { IParty } from "../entities/IParty.js";
import type { IProduct } from "../entities/IProduct.js";
import type { TradeDocumentTypes } from "../tradeDocumentTypes.js";

/**
 * A commercial invoice: an itemized account of goods delivered together with a
 * demand for payment.
 */
export type ICommercialInvoice = IUneceDocument &
	Required<Pick<IUneceDocument, "@context" | "type">> & {
		type: typeof TradeDocumentTypes.CommercialInvoice;

		/**
		 * The invoice number, as printed in the document's own heading.
		 * UNVTD `invoiceNumber`.
		 */
		invoiceNumber: string;

		/**
		 * The date the invoice was issued. UNVTD `invoiceDate`.
		 * @see https://vocabulary.uncefact.org/issueDateTime
		 * @json-schema format:date-time
		 */
		issueDateTime: string;

		/**
		 * The party issuing the invoice and to be paid.
		 */
		invoicerParty: IParty;

		/**
		 * The party the invoice is addressed to.
		 */
		invoiceeParty: IParty;

		/**
		 * The party to be notified of the shipment. UN/CEFACT declares no
		 * notify-party property on any settlement or agreement class.
		 */
		notifyParty: IParty;

		/**
		 * The goods being invoiced: `description` carries the goods row verbatim,
		 * `designation` the grade when the document states one.
		 * @see https://vocabulary.uncefact.org/specifiedTradeProduct
		 */
		specifiedTradeProduct: IProduct[];

		/**
		 * The number of packages invoiced, such as the total number of bags.
		 * @see https://vocabulary.uncefact.org/packageQuantity
		 */
		packageQuantity: number;

		/**
		 * How the goods are packed, when the document states it.
		 * @see https://vocabulary.uncefact.org/includedPackaging
		 */
		includedPackaging?: IProductPackage[];

		/**
		 * The destination of the goods.
		 * @see https://vocabulary.uncefact.org/finalDestinationLocation
		 */
		finalDestinationLocation: ILocation;

		/**
		 * The gross weight of the consignment.
		 * @see https://vocabulary.uncefact.org/grossWeightMeasure
		 */
		grossWeightMeasure: IMeasure;

		/**
		 * The tare weight of the consignment.
		 * @see https://vocabulary.uncefact.org/tareWeightMeasure
		 */
		tareWeightMeasure: IMeasure;

		/**
		 * The net weight of the consignment.
		 * @see https://vocabulary.uncefact.org/netWeightMeasure
		 */
		netWeightMeasure: IMeasure;

		/**
		 * The unit price and the quantity it is quoted against.
		 */
		price: IMonetaryAmount;

		/**
		 * The total value of the invoice, as printed.
		 */
		totalInvoiceAmount: IMonetaryAmount[];

		/**
		 * The amount the invoicee is asked to pay. Kept separate from
		 * `totalInvoiceAmount`: a real invoice can print two different figures.
		 */
		duePayableAmount: IMonetaryAmount[];

		/**
		 * The party payment is due to, when the document names one.
		 */
		payeeParty?: IParty[];

		/**
		 * The bank details for payment: institution, account, branch and codes.
		 */
		// specifiedPaymentMeans: IPaymentMeans[];
	};
