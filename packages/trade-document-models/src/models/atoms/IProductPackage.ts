// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceSupplyChainPackaging } from "@twin.org/standards-unece";

/**
 * How the goods are packed
 */
export type IProductPackage = IUneceSupplyChainPackaging &
	Required<Pick<IUneceSupplyChainPackaging, "packageTypeCode" | "capacityMeasure">>;
