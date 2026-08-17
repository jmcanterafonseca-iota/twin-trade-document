// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import {
  IUneceDocument,
  IUneceHeaderTradeAgreement,
} from "@twin.org/standards-unece";
import { IAllowanceCharge } from "./atoms/IAllowanceCharge.js";
import { IDeliveryTerms } from "./atoms/IDeliveryTerms.js";
import { ILocation } from "./ILocation.js";
import { IPaymentMeans } from "./atoms/IPaymentMeans.js";
import { IPaymentTerms } from "./atoms/IPaymentTerms.js";
import { ITradeItem } from "./atoms/ITradeItem.js";
import { ITradeParty } from "./ITradeParty.js";
import { IMeasure } from "./atoms/IMeasure.js";
import { TradeDocumentTypes } from "./tradeDocumentTypes.js";

/**
 * A buyer issued purchase contract, also called a purchase order.
 * Carries all eleven `credentialSubject` properties of the UNVTD purchase order
 * (https://unvtd.unece.org/docs/purchase-order/#schema). The seller issued
 * mirror of this document is {@link ITradeAgreement}.
 * See docs/model-guide.md §2.4 for the property mapping and its trade-offs.
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
    buyerParty: ITradeParty;

    /**
     * The seller party the order is placed with. UNVTD `seller`.
     */
    sellerParty: ITradeParty;

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
    invoiceeParty?: ITradeParty;
  };
