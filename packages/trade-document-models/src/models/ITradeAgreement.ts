// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeAgreement, IUneceNote } from "@twin.org/standards-unece";
import { ITradeItem } from "./ITradeItem.js";
import { ITradeParty } from "./ITradeParty.js";

/**
 * A seller issued sales contract, also called a sale confirmation.
 *
 * The seller always assigns its own contract number, so `sellerReference`
 * carries it ("S - JCT / 742-744") and is mandatory. The buyer's number is
 * frequently still "TBA" when the confirmation is issued, so `buyerReference`
 * — inherited from IUneceHeaderTradeAgreement — stays optional.
 *
 * The mirror document, a buyer issued purchase contract, is the same UN/CEFACT
 * class seen from the other side and is modelled by {@link IPurchaseOrder}.
 *
 * Terms observed on the sample documents are all inherited from the base and
 * need no local declaration:
 * - Incoterm and named place — `applicableDeliveryTerms`, whose
 *   `deliveryTermsDeliveryTypeCode` takes UneceDeliveryTermsCodeList.FreeOnBoard
 *   and whose `relevantLocation.name` takes the named port.
 * - Payment terms — `applicablePaymentTerms`.
 * - Shipment month or window — `shippingPeriod`.
 * - Destination — `applicableLocation[]`.
 * - Governing standard terms — `contractDocument[]`, `salesConditionsDocument[]`.
 * - Buyer's countersignature date — `buyerApprovedDateTime`, optional because
 *   the buyer's acceptance block is unsigned on both sale confirmation samples.
 *
 * Two properties deviate from UN/CEFACT and are deliberate:
 * `issueDateTime` and `includedSupplyChainTradeLineItem` are real UN/CEFACT
 * terms, but D23B declares them on SupplyChainTradeTransaction rather than on
 * HeaderTradeAgreement. They are used off-domain here to keep the flat,
 * extraction-friendly shape of this model. See docs/model-guide.md.
 */
export type ITradeAgreement = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "sellerReference">> & {
    /**
     * The date, time or date time the document was issued.
     * UN/CEFACT declares issueDateTime on SupplyChainTradeTransaction and on
     * Document, not on HeaderTradeAgreement, which carries no date of its own.
     * @see https://vocabulary.uncefact.org/issueDateTime
     * @json-schema format:date-time
     */
    issueDateTime: string;

    /**
     * The buyer party for this sales contract.
     */
    buyerParty: ITradeParty;

    /**
     * The seller party for this sales contract.
     */
    sellerParty: ITradeParty;

    /**
     * A contracted lot within this sales contract.
     * Optional because a single lot contract states its quantity, quality and
     * price at header level and has no line breakdown at all.
     * @see https://vocabulary.uncefact.org/includedSupplyChainTradeLineItem
     */
    includedSupplyChainTradeLineItem?: ITradeItem[];

    /**
     * A note on this sales contract, discriminated by its `subject` or
     * `noteSubjectCode`. See {@link IPurchaseOrder.includedNote} for why the
     * term is lifted onto a header trade agreement.
     * @see https://vocabulary.uncefact.org/includedNote
     */
    includedNote?: IUneceNote[];
  };
