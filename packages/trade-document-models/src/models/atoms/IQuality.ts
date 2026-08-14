// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { UneceContextType } from "@twin.org/standards-unece";
import { TradeDocumentTypes } from "../tradeDocumentTypes.js";

/**
 * The quality of the goods, verbatim as printed on a document's `Quality` row.
 * UN/CEFACT has no quality-description property on TradeProduct, so the row's
 * own label is the honest name.
 * @json-schema embedded:defs
 */
export interface IQuality {
    /**
     * JSON-LD Context.
     */
    "@context": UneceContextType;

    /**
     * JSON-LD Type.
     */
    type: typeof TradeDocumentTypes.Quality;

    /**
     * The verbatim text of the `Quality` row.
     */
    QualityValue: string;
}
