// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeAgreement } from "@twin.org/standards-unece";
import { IAllowanceCharge } from "./atoms/IAllowanceCharge.js";
import { IAmount } from "./atoms/IAmount.js";
import { IBasis } from "./atoms/IBasis.js";
import { IConditions } from "./atoms/IConditions.js";
import { IDate } from "./atoms/IDate.js";
import { IDeliveryTerms } from "./atoms/IDeliveryTerms.js";
import { IInsurance } from "./atoms/IInsurance.js";
import { ILocation } from "./atoms/ILocation.js";
import { INote } from "./atoms/INote.js";
import { IPaymentMeans } from "./atoms/IPaymentMeans.js";
import { IPaymentTerms } from "./atoms/IPaymentTerms.js";
import { IReferencedDocument } from "./atoms/IReferencedDocument.js";
import { ITradeDelivery } from "./atoms/ITradeDelivery.js";
import { ITradeItem } from "./atoms/ITradeItem.js";
import { ITradeParty } from "./atoms/ITradeParty.js";

/**
 * A buyer issued purchase contract, also called a purchase order.
 * Carries all eleven `credentialSubject` properties of the UNVTD purchase order
 * (https://unvtd.unece.org/docs/purchase-order/#schema). The seller issued
 * mirror of this document is {@link ITradeAgreement}.
 * See docs/model-guide.md §2.4 for the property mapping and its trade-offs.
 */
export type IPurchaseOrder = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type">> & {
    /**
     * The date the order was issued. UNVTD `orderDate`.
     * @see https://vocabulary.uncefact.org/issueDateTime
     */
    issueDateTime: IDate;

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
     * The `Basis` row, verbatim.
     */
    basis: IBasis;

    /**
     * The `Insurance` row, verbatim.
     */
    insurance: IInsurance;

    /**
     * The terms of payment. UNVTD `paymentTerms`.
     */
    paymentTerms: IPaymentTerms;

    /**
     * The `Conditions` row, verbatim.
     */
    conditions: IConditions;

    /**
     * The delivery terms in coded form: the Incoterm and its named place. The
     * verbatim source text of the same row is in `basis`.
     */
    applicableDeliveryTerms: IDeliveryTerms;

    /**
     * A document setting conditions on this order, such as a supplier code of
     * conduct.
     */
    purchaseConditionsDocument?: IReferencedDocument[];

    /**
     * A document whose terms govern this order, such as a standard trade
     * contract or a supplier code of conduct.
     */
    contractDocument?: IReferencedDocument[];

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
    totalOrderAmount?: IAmount;

    /**
     * The party to be invoiced, when neither buyer nor seller. UNVTD `invoicee`.
     */
    invoiceeParty?: ITradeParty;

    /**
     * The shipping details: instructions, despatch and delivery events, ship-to
     * and ship-from parties, consignments, packaging and transport equipment.
     * @see https://vocabulary.uncefact.org/applicableHeaderTradeDelivery
     */
    applicableHeaderTradeDelivery?: ITradeDelivery[];

    /**
     * Contractual prose with no typed UN/CEFACT slot, discriminated by
     * `subject`. The insurance allocation lives here: UN/CEFACT has no
     * insurance property on any header class.
     * @see https://vocabulary.uncefact.org/includedNote
     */
    includedNote?: INote[];
  };
