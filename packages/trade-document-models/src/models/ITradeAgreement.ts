// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeAgreement } from "@twin.org/standards-unece";
import { IDate } from "./atoms/IDate.js";
import { IDeliveryTerms } from "./atoms/IDeliveryTerms.js";
import { ILocation } from "./atoms/ILocation.js";
import { INote } from "./atoms/INote.js";
import { IPaymentTerms } from "./atoms/IPaymentTerms.js";
import { IReferencedDocument } from "./atoms/IReferencedDocument.js";
import { ITradeDelivery } from "./atoms/ITradeDelivery.js";
import { ITradeItem } from "./atoms/ITradeItem.js";
import { ITradeParty } from "./atoms/ITradeParty.js";

/**
 * A seller issued sales contract, also called a sale confirmation.
 * The buyer issued mirror of this document is {@link IPurchaseOrder}; the
 * seller assigns the contract number, so `sellerReference` is mandatory here.
 * See docs/model-guide.md §2.3.
 */
export type ITradeAgreement = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "sellerReference">> & {
    /**
     * The date the document was issued.
     * @see https://vocabulary.uncefact.org/issueDateTime
     */
    issueDateTime: IDate;

    /**
     * The date the sale was concluded, as stated in the confirmation sentence.
     * Distinct from `issueDateTime`: a confirmation can be written up after the
     * sale is struck.
     */
    saleDate: IDate;

    /**
     * The buyer party for this sales contract.
     */
    buyerParty: ITradeParty;

    /**
     * The seller party for this sales contract.
     */
    sellerParty: ITradeParty;

    /**
     * A contracted lot. Optional: a single lot contract states quantity,
     * quality and price at header level and has no line breakdown.
     * @see https://vocabulary.uncefact.org/includedSupplyChainTradeLineItem
     */
    includedSupplyChainTradeLineItem: ITradeItem[];

    /**
     * The delivery terms: the Incoterm and its named place, plus the weight
     * basis, tolerance and tare rules as verbatim text.
     */
    applicableDeliveryTerms: IDeliveryTerms;

    /**
     * A place named by this contract, such as the destination. Discriminate
     * with `locationFunctionTypeCode`.
     */
    applicableLocation: ILocation[];

    /**
     * The terms of payment.
     */
    applicablePaymentTerms: IPaymentTerms;

    /**
     * Conditions the contract is subject to, in `processCondition`.
     */
    salesConditionsDocument?: IReferencedDocument[];

    /**
     * A document whose terms govern this contract.
     */
    contractDocument?: IReferencedDocument[];

    /**
     * The shipping details.
     * @see https://vocabulary.uncefact.org/applicableHeaderTradeDelivery
     */
    applicableHeaderTradeDelivery?: ITradeDelivery[];

    /**
     * Contractual prose with no typed UN/CEFACT slot, discriminated by
     * `subject`. See {@link IPurchaseOrder.includedNote}.
     * @see https://vocabulary.uncefact.org/includedNote
     */
    includedNote?: INote[];
  };
