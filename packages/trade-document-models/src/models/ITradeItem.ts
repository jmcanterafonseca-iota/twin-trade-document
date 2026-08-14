// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceLineTradeAgreement, IUneceSupplyChainTradeLineItem } from "@twin.org/standards-unece";

/**
 * A single contracted lot, carried as one line of a trade document.
 * Based on SupplyChainTradeLineItem rather than LineTradeAgreement, which has
 * neither a quantity nor a product. The lot reference is in
 * `associatedDocumentLineDocument.lineId`, the mark, grade and origin in
 * `specifiedTradeProduct`, the quantity and packaging in
 * `specifiedLineTradeDelivery`, the price in `specifiedLineTradeAgreement`.
 * See docs/model-guide.md §2.2.
 * @json-schema embedded:defs
 */
export type ITradeItem = IUneceSupplyChainTradeLineItem &
  Required<
    Pick<
      IUneceSupplyChainTradeLineItem,
      | "@context"
      | "type"
      | "associatedDocumentLineDocument"
      | "specifiedTradeProduct"
      | "specifiedLineTradeDelivery"
    >
  > & {
    /**
     * The pricing facet of this line, narrowed to require an agreed price.
     */
    specifiedLineTradeAgreement: IUneceLineTradeAgreement &
      Required<Pick<IUneceLineTradeAgreement, "agreedPriceProductPrice">>;
  };
