// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceTradeAddress } from "@twin.org/standards-unece";

/**
 * Trade Address
 * x-json-ld-type: https://vocabulary.uncefact.org/TradeAddress
 */
export type IAddress = IUneceTradeAddress &
	Required<Pick<IUneceTradeAddress, "type" | "countryIdentificationCountry" | "cityName">>;
