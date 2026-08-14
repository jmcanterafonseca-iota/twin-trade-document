// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { UneceContextType } from "@twin.org/standards-unece";
import { TradeDocumentTypes } from "../tradeDocumentTypes.js";

/**
 * The trading basis of a document, verbatim as printed on its `Basis` row: the
 * delivery term, the weight basis, any franchise and the tare method.
 *
 * The coded Incoterm and its named place are carried separately in
 * `applicableDeliveryTerms`; this is the verbatim source text.
 * @json-schema embedded:defs
 */
export interface IBasis {
    /**
     * JSON-LD Context.
     */
    "@context": UneceContextType;

    /**
     * JSON-LD Type.
     */
    type: typeof TradeDocumentTypes.Basis;

    /**
     * The verbatim text of the `Basis` row, for example
     * `FOB origin, N.S.W, 0.5% franchise, Actual Tare.`
     */
    BasisValue: string;
}
