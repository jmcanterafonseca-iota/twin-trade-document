// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceTradeParty } from "@twin.org/standards-unece";

/**
 * Trade Agreement Document
 */
export type ITradeParty = IUneceTradeParty &
  Required<
    Pick<IUneceTradeParty, "@context" | "postalAddress">
  > & {
  };
