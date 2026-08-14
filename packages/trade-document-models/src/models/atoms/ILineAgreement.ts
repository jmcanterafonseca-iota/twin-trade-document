// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceLineTradeAgreement } from "@twin.org/standards-unece";
import { IPrice } from "./IPrice.js";

/**
 * The pricing facet of a line.
 * @json-schema embedded:defs
 */
export type ILineAgreement = IUneceLineTradeAgreement &
  Required<Pick<IUneceLineTradeAgreement, "@context" | "type">> & {
    /**
     * The agreed price for the goods on this line.
     */
    agreedPriceProductPrice: IPrice[];
  };
