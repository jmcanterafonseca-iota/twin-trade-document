// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceDeliveryTerms } from "@twin.org/standards-unece";
import type { ILocation } from "../entities/ILocation.js";

/**
 * The delivery terms of a trade document.
 * x-json-ld-type: https://vocabulary.uncefact.org/DeliveryTerms
 */
export type IDeliveryTerms = IUneceDeliveryTerms &
	Required<Pick<IUneceDeliveryTerms, "type">> & {
		/**
		 * Relevant locations
		 */
		relevantLocation: ILocation[];

		/**
		 * Incoterms Code
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/incotermsCode
		 */
		incotermsCode: string;
	};
