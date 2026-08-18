// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceTradeProduct } from "@twin.org/standards-unece";
import type { IProductPackage } from "../valueObjects/IProductPackage.js";

/**
 * A product
 * x-json-ld-type: https://vocabulary.uncefact.org/TradeProduct
 */
export type IProduct = IUneceTradeProduct &
	Required<Pick<IUneceTradeProduct, "type" | "identifier" | "classificationCode">> & {
		/**
		 * Product name
		 */
		name?: string;

		/**
		 * Origin country
		 */
		originCountry?: string;

		/**
		 * Quality level code
		 */
		qualityLevelCode?: string;

		/**
		 * Description
		 */
		description?: string;

		/**
		 * Product package.
		 */
		applicableSupplyChainPackage: IProductPackage;
	};
