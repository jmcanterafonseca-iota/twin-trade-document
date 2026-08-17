// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceSpecifiedPeriod } from "@twin.org/standards-unece";

/**
 * Specified period
 */
export type IPeriod = IUneceSpecifiedPeriod &
  Required<Pick<IUneceSpecifiedPeriod, "startDateTime" | "completeDateTime">> & {};
