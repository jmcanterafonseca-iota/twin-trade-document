// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceLogisticsLocation } from "@twin.org/standards-unece";

/**
 * A relevant location
 * x-json-ld-type: https://vocabulary.uncefact.org/LogisticsLocation
 */
export type ILocation = IUneceLogisticsLocation &
	Required<Pick<IUneceLogisticsLocation, "type" | "locationFunctionTypeCode">> & {
		/**
		 * UN Location code
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/unLocationCode
		 */
		unLocationCode: string;
	};
