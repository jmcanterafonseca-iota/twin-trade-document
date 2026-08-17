// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceSupplyChainTradeLineItem } from "@twin.org/standards-unece";
import { ILineAgreement } from "./ILineAgreement.js";
import { ILineDelivery } from "./ILineDelivery.js";
import { IProduct } from "./IProduct.js";

/**
 * A single contracted lot, carried as one line of a trade document.
 * Based on SupplyChainTradeLineItem rather than LineTradeAgreement, which has
 * neither a quantity nor a product. The lot reference is in `identifier` or
 * `associatedDocumentLineDocument.lineId`.
 * See docs/model-guide.md §2.2.
 * @json-schema embedded:defs
 */
export type ITradeItem = IUneceSupplyChainTradeLineItem &
  Required<Pick<IUneceSupplyChainTradeLineItem, "@context" | "type" | "identifier">> & {
    /**
     * The goods on this line, including their description.
     */
    specifiedTradeProduct: IProduct[];

    /**
     * The quantity, the packaging and the content per package.
     */
    specifiedLineTradeDelivery: ILineDelivery[];

    /**
     * The price and the quantity it is quoted against.
     */
    specifiedLineTradeAgreement: ILineAgreement;
  };
