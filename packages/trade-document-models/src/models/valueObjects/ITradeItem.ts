// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceLineTradeAgreement } from "@twin.org/standards-unece";
import type { IMeasure } from "./IMeasure.js";
import type { IMonetaryAmount } from "./IMonetaryAmount.js";
import type { IProduct } from "../entities/IProduct.js";

/**
 * A Trade item composed by a product, a price and a quantity
 * x-json-ld-type: https://vocabulary.uncefact.org/LineTradeAgreement
 */
export type ITradeItem = Required<Pick<IUneceLineTradeAgreement, "type">> & {
	/**
	 * The goods on this line, including their description.
	 * x-json-ld-property: https://test.uncefact.org/vocabulary/suppliedProduct
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
