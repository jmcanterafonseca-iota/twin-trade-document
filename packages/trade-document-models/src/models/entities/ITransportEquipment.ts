// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceLogisticsTransportEquipment } from "@twin.org/standards-unece";

/**
 * A relevant location
 * x-json-ld-type: https://vocabulary.uncefact.org/LogisiticsTransportEquipment
 */
export type ITransportEquipment = IUneceLogisticsTransportEquipment &
	Required<
		Pick<
			IUneceLogisticsTransportEquipment,
			"type" | "identifier" | "transportEquipmentSizeTypeCharacteristicCode"
		>
	> & {};
