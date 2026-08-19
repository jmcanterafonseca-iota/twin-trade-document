// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceTradeParty } from "@twin.org/standards-unece";
import type { IAddress } from "../valueObjects/IAddress.js";

/**
 * A party playing a role
 * x-json-ld-type: https://vocabulary.uncefact.org/TradeParty
 */
export type IParty = IUneceTradeParty &
	Required<Pick<IUneceTradeParty, "@context" | "type" | "name" | "identifier">> & {
		/**
		 * Postal Address
		 */
		postalAddress: IAddress;

		/**
		 * Telephone number
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/telephone
		 */
		telephone?: string;

		/**
		 * emailAddress
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/email
		 */
		email?: string;
	};
