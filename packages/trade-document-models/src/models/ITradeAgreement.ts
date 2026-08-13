// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeAgreement } from "@twin.org/standards-unece";
import { ITradeParty } from "./ITradeParty.js";
import { ITradeItem } from "./ITradeItem.js";

/**
 * Trade Agreement Document
 */
export type ITradeAgreement = IUneceHeaderTradeAgreement &
  Required<
    Pick<IUneceHeaderTradeAgreement, "@context" | "buyerApprovedDateTime" | "sellerReference" | "buyerParty" | "sellerParty">
  > & {
    issueDateTime: string;
    buyerParty: ITradeParty;
    sellerParty: ITradeParty;

    includesTradeItem: ITradeItem[];
  };
