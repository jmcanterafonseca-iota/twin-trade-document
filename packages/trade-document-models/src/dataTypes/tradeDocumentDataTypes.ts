// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { DataTypeHelper, IJsonSchema } from "@twin.org/data-core";
import { TradeDocumentContexts } from "../models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../models/tradeDocumentTypes.js";

/**
 * Handle all the data types for auditable item graph.
 */
export class TradeDocumentDataTypes {
  /**
   * Register all the data types.
   */
  public static registerTypes(): void {
    const types = [
      {
        type: TradeDocumentTypes.TradeAgreement,
		schema: "" as unknown as IJsonSchema
      },
    ];

    DataTypeHelper.registerTypes(
      TradeDocumentContexts.Namespace,
      TradeDocumentContexts.Context,
      types.map((t) => ({ type: t.type, schema: t.schema })),
    );
  }
}
