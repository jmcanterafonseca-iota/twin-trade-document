// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceMeasureType } from "@twin.org/standards-unece";

/**
 * A measured value such as a weight. The unit itself has no home:
 * IUneceMeasureCode declares no value property, so `MeasureTypeCode` cannot
 * carry "kgs".
 */
export type IMeasure = IUneceMeasureType &
  Required<Pick<IUneceMeasureType, "MeasureTypeValue" | "MeasureTypeCode">>;
