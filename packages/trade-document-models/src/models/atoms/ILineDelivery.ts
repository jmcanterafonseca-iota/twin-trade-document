// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceLineTradeDelivery } from "@twin.org/standards-unece";
import { IPackaging } from "./IPackaging.js";
import { IQuantity } from "./IQuantity.js";

/**
 * The delivery facet of a line: how much, packed how, and how much per package.
 * @json-schema embedded:defs
 */
export type ILineDelivery = IUneceLineTradeDelivery &
  Required<Pick<IUneceLineTradeDelivery, "@context" | "type">> & {
    /**
     * The quantity ordered on this line.
     */
    orderQuantity: IQuantity;

    /**
     * The net content of one package, such as the kilograms in a bag.
     */
    perPackageUnitQuantity: IQuantity;

    /**
     * How the goods on this line are packed.
     */
    includedPackaging: IPackaging[];
  };
