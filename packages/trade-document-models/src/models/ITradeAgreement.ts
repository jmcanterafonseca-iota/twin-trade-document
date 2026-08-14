// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeAgreement, IUneceNote } from "@twin.org/standards-unece";
import { ITradeItem } from "./ITradeItem.js";
import { ITradeParty } from "./ITradeParty.js";

/**
 * A seller issued sales contract, also called a sale confirmation.
 * The buyer issued mirror of this document is {@link IPurchaseOrder}; the
 * seller assigns the contract number, so `sellerReference` is mandatory here.
 * Incoterms, payment terms, shipment period, destination and governing terms
 * are all inherited. See docs/model-guide.md §2.3.
 */
export type ITradeAgreement = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "sellerReference">> & {
    /**
     * The date the document was issued.
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
     * A contracted lot. Optional: a single lot contract states quantity,
     * quality and price at header level and has no line breakdown.
     * @see https://vocabulary.uncefact.org/includedSupplyChainTradeLineItem
     */
    includedSupplyChainTradeLineItem?: ITradeItem[];

    /**
     * Contractual prose with no typed UN/CEFACT slot, discriminated by
     * `subject`. See {@link IPurchaseOrder.includedNote}.
     * @see https://vocabulary.uncefact.org/includedNote
     */
    includedNote?: IUneceNote[];
  };
