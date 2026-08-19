// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceMeasureType } from "@twin.org/standards-unece";

/**
 * A measured value such as a weight.
 * x-json-ld-type: https://vocabulary.uncefact.org/Measurement
 */
export type IMeasure = IUneceMeasureType &
	Required<Pick<IUneceMeasureType, "MeasureTypeValue" | "type">> & {
		/**
		 * Measure type code
		 */
		MeasureTypeCode?: string;
	};
