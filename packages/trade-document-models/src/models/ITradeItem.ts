// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceLineTradeAgreement, IUneceSupplyChainTradeLineItem } from "@twin.org/standards-unece";

/**
 * A single contracted lot of coffee, carried as one line of a trade document.
 *
 * Re-based from IUneceLineTradeAgreement onto IUneceSupplyChainTradeLineItem.
 * The line agreement carries prices and ordering constraints only: it has no
 * property for the ordered quantity and none for the product, so it cannot
 * express "200 Bags AB Mwitu". UN/CEFACT puts those on the line item, which is
 * the only class reaching all four facets a coffee lot needs:
 *
 * - `associatedDocumentLineDocument.lineId` — the lot reference, "ctr/519" on
 *   the seller's confirmation or "81140" on the buyer's contract.
 * - `specifiedTradeProduct[]` — the mark, grade and origin, such as
 *   "Miti,Kanjuu,AA" from "Kenya".
 * - `specifiedLineTradeDelivery[].orderQuantity` — the number of bags, "180";
 *   `perPackageUnitQuantity` carries the "60 kg per bag".
 * - `specifiedLineTradeAgreement.agreedPriceProductPrice[]` — the unit price,
 *   "USD 275 per 50 kgs": `unitAmount[]` for the amount and currency,
 *   `basisQuantity` for the 50 kg basis.
 *
 * The mandatory price of the previous model is preserved one level down, by
 * narrowing `specifiedLineTradeAgreement` to require `agreedPriceProductPrice`.
 *
 * Like ITradeParty this is a child type and asks to be hoisted into the
 * referencing document's `$defs`. The tag is a no-op today: ts-to-schema only
 * visits direct property references, never array `items`, and every document
 * references this type through an array. It is kept to record the intent and
 * will start working if that traversal gap is fixed upstream.
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
    specifiedLineTradeAgreement: IUneceLineTradeAgreement &
      Required<Pick<IUneceLineTradeAgreement, "agreedPriceProductPrice">>;
  };
