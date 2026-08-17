// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { UneceContextType } from "@twin.org/standards-unece";
import { TradeDocumentTypes } from "../tradeDocumentTypes.js";

/**
 * A date carried by a trade document.
 * `DateValue` is an unconstrained string for now, so it accepts the document's
 * own wording as well as a normalised form. No `format` is asserted until the
 * representation is settled.
 * @json-schema embedded:defs
 */
export interface IDate {
    /**
     * JSON-LD Context.
     */
    "@context": UneceContextType;

    /**
     * JSON-LD Type.
     */
    type: typeof TradeDocumentTypes.Date;

    /**
     * The date, as printed on the document or normalised.
     */
    DateValue: string;
}
