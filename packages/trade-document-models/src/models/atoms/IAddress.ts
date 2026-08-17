// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceTradeAddress } from "@twin.org/standards-unece";

/**
 * An allowance or a charge applied to a trade document. `chargeIndicator` is
 * mandatory because it is what distinguishes the two.
 */
export type IAddress = IUneceTradeAddress &
  Required<Pick<IUneceTradeAddress, "countryIdentificationCountry">>;
