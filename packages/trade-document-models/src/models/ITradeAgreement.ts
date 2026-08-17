// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeAgreement } from "@twin.org/standards-unece";
import { IDeliveryTerms } from "./atoms/IDeliveryTerms.js";
import { IPaymentTerms } from "./atoms/IPaymentTerms.js";
import { ITradeItem } from "./atoms/ITradeItem.js";
import { IParty } from "./IParty.js";
import { IPeriod } from "./atoms/IPeriod.js";

/**
 * A seller issued sales contract, also called a sale confirmation.
 * The buyer issued mirror of this document is {@link IPurchaseOrder}; the
 * seller assigns the contract number, so `sellerReference` is mandatory here.
 * See docs/model-guide.md §2.3.
 */
export type ITradeAgreement = IUneceHeaderTradeAgreement &
  Required<
    Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "sellerReference">
  > & {
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
     * A contracted lot. Optional: a single lot contract states quantity,
     * quality and price at header level and has no line breakdown.
     * @see https://vocabulary.uncefact.org/includedSupplyChainTradeLineItem
     */
    includesItem: ITradeItem[];

    /**
     * The delivery terms: the Incoterm and its named place, plus the weight
     * basis, tolerance and tare rules as verbatim text.
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
