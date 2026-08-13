// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { DataTypeHelper } from "@twin.org/data-core";
import { TradeDocumentContexts } from "../models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../models/tradeDocumentTypes.js";

import PurchaseOrderSchema from "../schemas/PurchaseOrder.json" with { type: "json" };
import TradeAgreementSchema from "../schemas/TradeAgreement.json" with { type: "json" };
import TradeItemSchema from "../schemas/TradeItem.json" with { type: "json" };
import TradePartySchema from "../schemas/TradeParty.json" with { type: "json" };

/**
 * Handle all the data types for trade documents.
 */
export class TradeDocumentDataTypes {
  /**
   * Register all the data types.
   *
   * Consumers should also call `UneceDataTypes.registerTypes()` from
   * `@twin.org/standards-unece` before validating. Every schema generated here
   * keeps its UN/CEFACT base behind a `$ref` to
   * `https://schema.twindev.org/unece/Unece*`; without the UNECE registrations
   * those refs are fetched over HTTP on first compile, which takes over a
   * minute and degrades to an empty schema when offline.
   */
  public static registerTypes(): void {
    const types = [
      {
        type: TradeDocumentTypes.TradeAgreement,
        schema: TradeAgreementSchema,
      },
      {
        type: TradeDocumentTypes.PurchaseOrder,
        schema: PurchaseOrderSchema,
      },
      {
        type: TradeDocumentTypes.TradeItem,
        schema: TradeItemSchema,
      },
      {
        type: TradeDocumentTypes.TradeParty,
        schema: TradePartySchema,
      },
    ];

    DataTypeHelper.registerTypes(
      TradeDocumentContexts.Namespace,
      TradeDocumentContexts.Context,
      types.map((t) => ({ type: t.type, schema: t.schema })),
    );
  }
}
