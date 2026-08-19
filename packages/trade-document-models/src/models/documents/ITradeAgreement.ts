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
 * x-json-ld-type: https://vocabulary.uncefact.org/HeaderTradeAgreement
 */
export type ITradeAgreement = IUneceHeaderTradeAgreement &
	Required<
		Pick<
			IUneceHeaderTradeAgreement,
			"@context" | "type" | "sellerReference" | "buyerReference" | "identifier"
		>
	> & {
		/**
		 * The date the document was issued.
		 * x-json-ld-property: https://vocabulary.uncefact.org/issueDate
		 *
		 * @json-schema format:date-time
		 *
		 */
		issueDate: string;

		/**
		 * The date the agreement was concluded.
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/agreementDate
		 *
		 * @json-schema format:date-time
		 *
		 */
		agreementDate: string;

		/**
		 * The buyer party for this sales contract.
		 * x-json-ld-property: https://vocabulary.uncefact.org/buyerParty
		 */
		buyerParty: IParty;

		/**
		 * The seller party for this sales contract.
		 * x-json-ld-property: https://vocabulary.uncefact.org/sellerParty
		 */
		sellerParty: IParty;

		/**
		 * The items under agreement
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/includesItem
		 */
		includesItem: ITradeItem[];

		/**
		 * The delivery terms
		 * x-json-ld-property: https://vocabulary.uncefact.org/applicableDeliveryTerms
		 */
		applicableDeliveryTerms: IDeliveryTerms;

		/**
		 * The terms of payment.
		 * x-json-ld-property: https://vocabulary.uncefact.org/applicablePaymentTerms
		 */
		applicablePaymentTerms: IPaymentTerms;

		/**
		 * Shipping period
		 *
		 * x-json-ld-property: https://vocabulary.uncefact.org/shippingPeriod
		 */
		shippingPeriod: IPeriod;
	};
