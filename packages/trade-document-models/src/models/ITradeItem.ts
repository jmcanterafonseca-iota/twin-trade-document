// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceLineTradeAgreement } from "@twin.org/standards-unece";

/**
 * Trade Agreement Document
 */
export type ITradeItem = IUneceLineTradeAgreement &
  Required<
    Pick<IUneceLineTradeAgreement, "@context" | "agreedPriceProductPrice">
  > & {
  };
