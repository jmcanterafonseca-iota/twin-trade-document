// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { UneceContextType } from "@twin.org/standards-unece";
import { TradeDocumentTypes } from "../tradeDocumentTypes.js";

/**
 * Conditions the document is subject to, verbatim as printed on its
 * `Conditions` row.
 *
 * Referenced governing documents stay in `contractDocument` and
 * `purchaseConditionsDocument`.
 * @json-schema embedded:defs
 */
export interface IConditions {
    /**
     * JSON-LD Context.
     */
    "@context": UneceContextType;

    /**
     * JSON-LD Type.
     */
    type: typeof TradeDocumentTypes.Conditions;

    /**
     * The verbatim text of the `Conditions` row, for example
     * `Subject to approval of preshipment sample by buyer.`
     */
    ConditionsValue: string;
}
