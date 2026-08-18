// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceHeaderTradeAgreement } from "@twin.org/standards-unece";
import type { IParty } from "../entities/IParty.js";
import type { IDeliveryTerms } from "../valueObjects/IDeliveryTerms.js";
import type { IPaymentTerms } from "../valueObjects/IPaymentTerms.js";
import type { IPeriod } from "../valueObjects/IPeriod.js";
import type { ITradeItem } from "../valueObjects/ITradeItem.js";

/**
 * A seller issued sales contract
 */
export type ITradeAgreement = IUneceHeaderTradeAgreement &
	Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "sellerReference">> & {
		/**
		 * The date the document was issued.
		 * @see https://vocabulary.uncefact.org/issueDateTime
		 *
		 * @json-schema format:date-time
		 *
		 */
		agreementDate: string;

		/**
		 * The buyer party for this sales contract.
		 */
		buyer: IParty;

		/**
		 * The seller party for this sales contract.
		 */
		seller: IParty;

		/**
		 * The items under agreement
		 */
		includesItem: ITradeItem[];

		/**
		 * The delivery terms
		 */
		applicableDeliveryTerms: IDeliveryTerms;

		/**
		 * The terms of payment.
		 */
		applicablePaymentTerms: IPaymentTerms;

		/**
		 * Shipping period
		 */
		shippingPeriod: IPeriod;
	};
