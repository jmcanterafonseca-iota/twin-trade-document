// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceTradeProduct } from "@twin.org/standards-unece";
import type { IProductPackage } from "../valueObjects/IProductPackage.js";

/**
 * A product
 */
export type IProduct = IUneceTradeProduct &
	Required<Pick<IUneceTradeProduct, "identifier" | "name" | "description">> & {
		/**
		 * The SKU
		 */
		itemNUmber: string;

		/**
		 * Product package.
		 */
		packaging: IProductPackage;
	};
