// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceConsignmentItem } from "@twin.org/standards-unece";
import type { ITransportEquipment } from "./ITransportEquipment.js";
import type { ITransportPackage } from "./ITransportPackage.js";
import type { IMeasure } from "../valueObjects/IMeasure.js";

/**
 * One goods item covered by a transport document, such as a bill of lading
 * line (UNVTD `goods` item).
 * x-json-ld-type: https://vocabulary.uncefact.org/ConsignmentItem
 */
export type IConsignmentItem = IUneceConsignmentItem &
	Required<Pick<IUneceConsignmentItem, "@context" | "type">> & {
		/**
		 * Number of items
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/itemQuantity
		 */
		itemQuantity: IMeasure;

		/**
		 * Hs code
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/commodityCode
		 */
		commodityCode: string;

		/**
		 * Transport package
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/packedIn
		 */
		packedIn: ITransportPackage;

		/**
		 * The gross weight of this item including packaging.
		 */
		grossWeightMeasure?: IMeasure;

		/**
		 * The gross volume of this item including packaging.
		 */
		grossVolumeMeasure?: IMeasure;

		/**
		 * Where the consignment item is carried in
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/carriedIn
		 */
		carriedIn?: ITransportEquipment;

		/**
		 * Description.
		 */
		description?: string;
	};
