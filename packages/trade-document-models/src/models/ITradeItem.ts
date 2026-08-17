// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceSupplyChainTradeLineItem } from "@twin.org/standards-unece";
import { IProduct } from "./IProduct.js";
import { IMeasure } from "./atoms/IMeasure.js";
import { IMonetaryAmount } from "./atoms/IMonetaryAmount.js";

/**
 * A single contracted lot, carried as one line of a trade document.
 * Based on SupplyChainTradeLineItem rather than LineTradeAgreement, which has
 * neither a quantity nor a product. The lot reference is in `identifier` or
 * `associatedDocumentLineDocument.lineId`.
 * See docs/model-guide.md §2.2.
 * @json-schema embedded:defs
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
