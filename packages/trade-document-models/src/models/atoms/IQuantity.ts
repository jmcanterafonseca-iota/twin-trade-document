// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceQuantityType } from "@twin.org/standards-unece";

/**
 * A counted or measured quantity.
 */
export type IQuantity = IUneceQuantityType &
	Required<Pick<IUneceQuantityType, "QuantityTypeValue" | "QuantityTypeCode">>;
