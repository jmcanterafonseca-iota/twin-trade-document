// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceDeliveryTerms } from "@twin.org/standards-unece";
import type { ILocation } from "../ILocation.js";

/**
 * The delivery terms of a trade document.
 */
export type IDeliveryTerms = IUneceDeliveryTerms & {
	/**
	 * Relevant locations
	 */
	relevantLocation: ILocation[];

	/**
	 * Incoterms Code
	 */
	incotermsCode: string;
};
