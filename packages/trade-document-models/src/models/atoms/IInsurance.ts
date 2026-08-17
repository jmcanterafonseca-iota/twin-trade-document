// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { UneceContextType } from "@twin.org/standards-unece";
import { TradeDocumentTypes } from "../tradeDocumentTypes.js";

/**
 * How insurance is allocated between the parties, verbatim as printed on the
 * `Insurance` row.
 *
 * UN/CEFACT has no insurance property on any header class —
 * `IUneceCargoInsurance` hangs off a physical consignment — so there is no
 * structured alternative to grow into yet.
 * @json-schema embedded:defs
 */
export interface IInsurance {
    /**
     * JSON-LD Context.
     */
    "@context": UneceContextType;

    /**
     * JSON-LD Type.
     */
    type: typeof TradeDocumentTypes.Insurance;

    /**
     * The verbatim text of the `Insurance` row, for example
     * `For buyer's account.`
     */
    InsuranceValue: string;
}
