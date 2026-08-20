// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceTradeLocation } from "@twin.org/standards-unece";

/**
 * A relevant location
 * x-json-ld-type: https://vocabulary.uncefact.org/TradeLocation
 */
export type ILocation = IUneceTradeLocation &
	Required<Pick<IUneceTradeLocation, "@context" | "type" | "locationFunctionTypeCode">> & {
		/**
		 * UN Location code
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/unLocationCode
		 */
		unLocationCode?: string;

		/**
		 * Location name
		 *
		 */
		name?: string;

		/**
		 * ISO country
		 * x-json-ld-property: https://vocabulary.uncefact.org/tradeLocationCountryId
		 */
		country?: string;

		/**
		 * Country name
		 *
		 */
		countryName?: string;
	};
