// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceSupplyChainTradeLineItem } from "@twin.org/standards-unece";
import type { IProduct } from "../entities/IProduct.js";
import type { IMeasure } from "./IMeasure.js";
import type { IMonetaryAmount } from "./IMonetaryAmount.js";

/**
 * A Trade item composed by a product, a price and a quantity
 */
export type ITradeItem = IUneceSupplyChainTradeLineItem & {
	/**
	 * The goods on this line, including their description.
	 */
	suppliedProduct: IProduct;

	/**
	 * Unit price
	 */
	unitPrice: IMonetaryAmount;

	/**
	 * Quantity ordered
	 */
	orderedQuantity: IMeasure;
};
