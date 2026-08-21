// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUneceSeal } from "@twin.org/standards-unece";

/**
 * A Seal
 */
export type ISeal = IUneceSeal &
	Required<Pick<IUneceSeal, "type">> & {
		/**
		 * x-json-ld-property: https://test.uncefact.org/vocabulary/sealNumber
		 */
		sealNumber: string;
	};
