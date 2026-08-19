// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceConsignmentItem } from "@twin.org/standards-unece";
import type { ITransportPackage } from "./ITransportPackage.js";
import type { IMeasure } from "../valueObjects/IMeasure.js";

/**
 * One goods item covered by a transport document, such as a bill of lading
 * line (UNVTD `goods` item).
 * x-json-ld-type: https://vocabulary.uncefact.org/ConsignmentItem
 */
export type IConsignmentItem = IUneceConsignmentItem &
	Required<Pick<IUneceConsignmentItem, "type">> & {
		/**
		 * Number of items
		 */
		itemQuantity: IMeasure;

		/**
		 * Hs code
		 */
		commodityCode: string;

		/**
		 *  Transport package
		 */
		packedIn: ITransportPackage;

		/**
		 * The gross weight of this item including packaging (UNVTD `grossWeight`).
		 */
		grossWeight?: IMeasure;
	};
