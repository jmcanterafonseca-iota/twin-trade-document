// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceTradePrice } from "@twin.org/standards-unece";
import type { IMeasure } from "./IMeasure.js";
import type { IMonetaryAmount } from "./IMonetaryAmount.js";

/**
 * A Trade item composed by a product, a price and a quantity
 * x-json-ld-type: https://vocabulary.uncefact.org/TradePrice
 */
export type ITradePrice = Required<Pick<IUneceTradePrice, "type">> & {
	/**
	 * Basis quantity
	 */
	basisQuantity?: IMeasure;

	/**
	 * Monetary amount
	 */
	chargeAmount: IMonetaryAmount;
};
