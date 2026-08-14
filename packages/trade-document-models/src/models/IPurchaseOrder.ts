// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import {
  IUneceAmountType,
  IUneceHeaderTradeAgreement,
  IUneceHeaderTradeDelivery,
  IUneceLogisticsLocation,
  IUneceNote,
  IUnecePaymentMeans,
  IUnecePaymentTerms,
  IUneceTradeAllowanceCharge,
} from "@twin.org/standards-unece";
import { ITradeItem } from "./ITradeItem.js";
import { ITradeParty } from "./ITradeParty.js";

/**
 * A buyer issued purchase contract, also called a purchase order.
 * Carries all eleven `credentialSubject` properties of the UNVTD purchase order
 * (https://unvtd.unece.org/docs/purchase-order/#schema). The seller issued
 * mirror of this document is {@link ITradeAgreement}.
 * See docs/model-guide.md §2.4 for the property mapping and its trade-offs.
 */
export type IPurchaseOrder = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type">> & {

    // NOTE: MISSING FIELDS FROM THE EXAMPLE PDF
    // - CONDITIONS
    // - BASIS
    // - INSURANCE


    /**
     * The date the order was issued. UNVTD `orderDate`.
     * @see https://vocabulary.uncefact.org/issueDateTime
     * @json-schema format:date-time
     */
    issueDateTime: string;

    /**
     * The buyer party placing this order. UNVTD `buyer`.
     */
    buyerParty: ITradeParty;

    /**
     * The seller party the order is placed with. UNVTD `seller`.
     */
    sellerParty: ITradeParty;

    /**
     * Where the goods are to be delivered. UNVTD `deliveryLocation`.
     * UN/CEFACT declares no DeliveryLocation class; other places, such as a
     * place of payment presentation, go in the inherited `applicableLocation`.
     */
    deliveryLocation: IUneceLogisticsLocation;

    /**
     * An ordered lot. UNVTD `orderedItems`, minimum one.
     * @see https://vocabulary.uncefact.org/includedSupplyChainTradeLineItem
     */
    includedSupplyChainTradeLineItem: ITradeItem[];

    /**
     * The terms of payment. UNVTD `paymentTerms`.
     */
    paymentTerms?: IUnecePaymentTerms;

    /**
     * The means by which payment is to be made. UNVTD `paymentMethod`.
     */
    paymentMethod?: IUnecePaymentMeans;

    /**
     * An allowance or charge applied to this order. UNVTD `allowanceCharge`.
     */
    allowanceCharge?: IUneceTradeAllowanceCharge;

    /**
     * The total amount of this order. UNVTD `totalOrderAmount`.
     */
    totalOrderAmount?: IUneceAmountType;

    /**
     * The party to be invoiced, when neither buyer nor seller. UNVTD `invoicee`.
     */
    invoiceeParty?: ITradeParty;

    /**
     * The shipping details: instructions, despatch and delivery events, ship-to
     * and ship-from parties, consignments, packaging and transport equipment.
     * @see https://vocabulary.uncefact.org/applicableHeaderTradeDelivery
     */
    applicableHeaderTradeDelivery?: IUneceHeaderTradeDelivery[];

    /**
     * Contractual prose with no typed UN/CEFACT slot, such as an insurance
     * allocation or an arbitration forum, discriminated by `subject`.
     * @see https://vocabulary.uncefact.org/includedNote
     */
    includedNote?: IUneceNote[];
  };
