// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceSpecifiedPeriod } from "@twin.org/standards-unece";

/**
 * Specified period
 * x-json-ld-type: "https://vocabulary.uncefact.org/SpecifiedPeriod"
 */
export type IPeriod = IUneceSpecifiedPeriod &
	Required<Pick<IUneceSpecifiedPeriod, "type" | "startDateTime" | "completeDateTime">> & {};
