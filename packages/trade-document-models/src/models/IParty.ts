// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceTradeParty } from "@twin.org/standards-unece";
import type { IAddress } from "./atoms/IAddress.js";

/**
 * A party playing a role
 *
 */
export type IParty = IUneceTradeParty &
	Required<Pick<IUneceTradeParty, "name" | "identifier">> & {
		/**
		 * Postal Address
		 * @json-schema embedded:inline
		 */
		postalAddress: IAddress;
	};
