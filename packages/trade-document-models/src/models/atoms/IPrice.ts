// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceTradePrice } from "@twin.org/standards-unece";
import { IAmount } from "./IAmount.js";
import { IQuantity } from "./IQuantity.js";

/**
 * A unit price: the amount, and the quantity that amount is quoted against.
 * The basis is not the packing unit — a contract can price per 50 kg on 60 kg
 * bags, and dropping the basis makes any total wrong.
 * @json-schema embedded:defs
 */
export type IPrice = IUneceTradePrice &
  Required<Pick<IUneceTradePrice, "@context" | "type">> & {
    /**
     * The price amount and its currency.
     */
    unitAmount: IAmount[];

    /**
     * The quantity the amount is quoted against.
     */
    basisQuantity: IQuantity;
  };
