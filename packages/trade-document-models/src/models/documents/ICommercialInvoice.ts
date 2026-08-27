// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { ILocation } from "../entities/ILocation.js";
import type { IParty } from "../entities/IParty.js";
import type { TradeDocumentContexts } from "../tradeDocumentContexts.js";
import type { TradeDocumentTypes } from "../tradeDocumentTypes.js";
import type { IAllowanceCharge } from "../valueObjects/IAllowanceCharge.js";
import type { IMonetaryAmount } from "../valueObjects/IMonetaryAmount.js";
import type { IPaymentMeans } from "../valueObjects/IPaymentMeans.js";
import type { IPaymentTerms } from "../valueObjects/IPaymentTerms.js";
import type { ITradeItem } from "../valueObjects/ITradeItem.js";

/**
 * A commercial invoice: an itemized account of goods delivered together with a
 * demand for payment.
 */
export interface ICommercialInvoice {
	/**
	 * Context
	 */
	"@context": typeof TradeDocumentContexts.CommercialInvoiceContext;

	/**
	 * Commercial invoice
	 */
	type: typeof TradeDocumentTypes.CommercialInvoice;

	/**
	 * Identifier assigned by the buyer to an order.
	 */
	purchaseOrderNumber: string;

	/**
	 * Identifier of a contract concluded between parties such as between
	 * buyer and seller.
	 */
	contractNumber?: string;

	/**
	 * Reference number to identify an invoice.
	 */
	invoiceNumber: string;

	/**
	 * Date that a document was issued and when appropriate, signed or
	 * otherwise authenticated.
	 * @json-schema format:date-time
	 */
	issueDate: string;

	/**
	 * Date of issue of an invoice.
	 * @json-schema format:date-time
	 */
	invoiceDate: string;

	/**
	 * Date when an amount due should be made available to the creditor under
	 * the terms of payment.
	 * @json-schema format:date-time
	 */
	paymentDueDate: string;

	/**
	 * Carrier-issued Bill of Lading or Waybill number for the shipment.
	 */
	billOfLadingNumber?: string;

	/**
	 * Marks and numbers placed on packages to identify the consignment and
	 * link physical goods to the document.
	 */
	shippingMark?: string;

	/**
	 * Letter of Credit reference number if applicable for payment.
	 */
	letterOfCreditNumber?: string;

	/**
	 * Port where the goods will enter the destination country.
	 */
	portOfEntry?: ILocation;

	/**
	 * Two-letter ISO 3166-1 alpha-2 country code for final destination.
	 */
	destinationCountry?: string;

	/**
	 * Party to which merchandise or services are sold.
	 */
	buyer?: IParty;

	/**
	 * Party to whom an invoice is issued.
	 */
	invoicee: IParty;

	/**
	 * Party to whom the goods are consigned (may differ from buyer).
	 */
	consignee?: IParty;

	/**
	 * Bank designated by the seller to receive payment.
	 */
	sellersBank?: IParty;

	/**
	 * Party selling merchandise or services to a buyer.
	 */
	seller: IParty;

	/**
	 * Identifier of an account with the bank designated to receive payment.
	 */
	sellerBankAccountNumber?: string;

	/**
	 * Seaport, airport, freight terminal, rail station or other location
	 * where the goods were first loaded onto the means of transport being
	 * utilised for their carriage.
	 */
	originalLoadingLocation?: ILocation;

	/**
	 * Name of the country in which the goods have been produced or
	 * manufactured, according to criteria laid down for the application of
	 * the Customs tariff or quantitative restrictions, or any measure related
	 * to trade.
	 */
	originCountry?: ILocation;

	/**
	 * Free form description of delivery or transport terms (Incoterms).
	 */
	tradeTermsConditionsDescription?: string;

	/**
	 * Code specifying the delivery or transport terms (Incoterms).
	 */
	tradeTermsConditionsCode?: string;

	/**
	 * Identification of the terms of payment between the parties to a
	 * transaction (generic term).
	 */
	paymentTerms?: IPaymentTerms;

	/**
	 * Code specifying a method of payment.
	 */
	paymentMethod?: IPaymentMeans;

	/**
	 * Invoice line items
	 */
	itemsShipped: ITradeItem[];

	/**
	 * Cost of freight/shipping charges.
	 */
	freightCost?: IMonetaryAmount;

	/**
	 * Cost of insurance for the shipment.
	 */
	insuranceCost?: IMonetaryAmount;

	/**
	 * Discounts or surcharges applied at invoice level, after line item
	 * totals and before the final total.
	 */
	allowancesCharges?: IAllowanceCharge[];

	/**
	 * Total monetary amount charged in respect of one or more invoices.
	 */
	totalAmount: IMonetaryAmount;
}
