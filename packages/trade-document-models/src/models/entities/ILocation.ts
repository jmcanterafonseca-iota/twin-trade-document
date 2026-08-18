// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceLogisticsLocation } from "@twin.org/standards-unece";

/**
 * A relevant location
 */
export type ILocation = IUneceLogisticsLocation &
	Required<Pick<IUneceLogisticsLocation, "locationFunctionTypeCode">> & {
		unLocode: string;
	};
