// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceDocument } from "@twin.org/standards-unece";
import type { IAllowanceCharge } from "./atoms/IAllowanceCharge.js";
import type { IDeliveryTerms } from "./atoms/IDeliveryTerms.js";
import type { IMeasure } from "./atoms/IMeasure.js";
import type { IPaymentMeans } from "./atoms/IPaymentMeans.js";
import type { IPaymentTerms } from "./atoms/IPaymentTerms.js";
import type { ITradeItem } from "./atoms/ITradeItem.js";
import type { ILocation } from "./ILocation.js";
import type { IParty } from "./IParty.js";
import type { TradeDocumentTypes } from "./tradeDocumentTypes.js";

/**
 * A buyer issued purchase contract, also called a purchase order.
 *
 */
export type IPurchaseOrder = IUneceDocument &
	Required<Pick<IUneceDocument, "@context">> & {
		type: typeof TradeDocumentTypes.PurchaseOrder;
		/**
		 * The date the order was issued. UNVTD `orderDate`.
		 * @see https://vocabulary.uncefact.org/issueDateTime
		 * @json-schema format:date-time
		 */
		issueDateTime: string;

		/**
		 * The buyer party placing this order. UNVTD `buyer`.
		 */
		buyerParty: IParty;

		/**
		 * The seller party the order is placed with. UNVTD `seller`.
		 */
		sellerParty: IParty;

		/**
		 * Where the goods are to be delivered. UNVTD `deliveryLocation`.
		 * Other places, such as a place of payment presentation, go in the
		 * inherited `applicableLocation`.
		 */
		deliveryLocation: ILocation;

		/**
		 * An ordered lot. UNVTD `orderedItems`, minimum one.
		 * @see https://vocabulary.uncefact.org/includedSupplyChainTradeLineItem
		 */
		includedSupplyChainTradeLineItem: ITradeItem[];

		/**
		 * The terms of payment. UNVTD `paymentTerms`.
		 */
		paymentTerms: IPaymentTerms;

		/**
		 * The delivery terms in coded form: the Incoterm and its named place. The
		 * verbatim source text of the same row is in `basis`.
		 */
		applicableDeliveryTerms: IDeliveryTerms;

		/**
		 * The means by which payment is to be made. UNVTD `paymentMethod`.
		 */
		paymentMethod?: IPaymentMeans;

		/**
		 * An allowance or charge applied to this order. UNVTD `allowanceCharge`.
		 */
		allowanceCharge?: IAllowanceCharge;

		/**
		 * The total amount of this order. UNVTD `totalOrderAmount`.
		 */
		totalOrderAmount?: IMeasure;

		/**
		 * The party to be invoiced, when neither buyer nor seller. UNVTD `invoicee`.
		 */
		invoiceeParty?: IParty;
	};
