// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceTradeProduct } from "@twin.org/standards-unece";
import { IProductPackage } from "./atoms/IProductPackage.js";

/**
 * The goods on a line: `description` for the free text, `name` for the mark,
 * `designation` for the grade, `originCountry` for the origin.
 * @json-schema embedded:defs
 */
export type IProduct = IUneceTradeProduct &
  Required<Pick<IUneceTradeProduct, "identifier" | "name" | "description">> & {
    /**
     * The SKU
     */
    itemNUmber: string;

    /**
     * 
     */
    packaging: IProductPackage;
  }
