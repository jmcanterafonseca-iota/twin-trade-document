// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@twin.org/core";
import type { ITradeDocumentEntry } from "./ITradeDocumentEntry.js";

/**
 * Factory for creating handlers for data types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TradeDocumentRegistry =
	Factory.createFactory<ITradeDocumentEntry>("trade-document-type");
