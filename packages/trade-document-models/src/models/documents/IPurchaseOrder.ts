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
 * A buyer issued purchase contract, also called a purchase order.
 *
 */
export interface IPurchaseOrder {
	/**
	 * The context
	 */
	"@context": typeof TradeDocumentContexts.PurchaseOrderContext;

	/**
	 * Purchase order type
	 */
	type: typeof TradeDocumentTypes.PurchaseOrder;

	/**
	 * Identifier assigned by the buyer to an order.
	 */
	purchaseOrderNumber: string;

	/**
	 * Date of order.
	 * @json-schema format:date-time
	 */
	orderDate: string;

	/**
	 * Party to which merchandise or services are sold.
	 */
	buyer: IParty;

	/**
	 * Party selling merchandise or services to a buyer.
	 */
	seller: IParty;

	/**
	 * Party to whom an invoice is issued.
	 */
	invoicee?: IParty;

	/**
	 * Location to which a consignment is to be delivered to the final
	 * consignee.
	 */
	deliveryLocation: ILocation;

	/**
	 * Identification of the terms of payment between the parties to a
	 * transaction.
	 */
	paymentTerms?: IPaymentTerms;

	/**
	 * Code specifying a method of payment.
	 */
	paymentMethod?: IPaymentMeans;

	/**
	 * Code specifying a type of an adjustment to a monetary amount such as an
	 * allowance or charge.
	 */
	allowanceCharge?: IAllowanceCharge;

	/**
	 * Total amount of an order.
	 */
	totalOrderAmount?: IMonetaryAmount;

	/**
	 * Items being ordered
	 */
	orderedItems: ITradeItem[];
}
