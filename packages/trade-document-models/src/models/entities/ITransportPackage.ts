// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUnecePackage } from "@twin.org/standards-unece";

/**
 * How the goods are packed
 * x-json-ld-type: https://test.uncefact.org/vocabulary/TransportPackage
 */
export type ITransportPackage = IUnecePackage &
	Required<Pick<IUnecePackage, "type" | "packageTypeCode">> & {
		/**
		 * Package count
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/packageCount
		 */
		packageCount: number;
	};
