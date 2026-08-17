// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceQuantityType } from "@twin.org/standards-unece";

/**
 * A counted or measured quantity. The unit itself has no home: IUneceQuantityCode
 * declares no value property, so `QuantityTypeCode` cannot carry "KGM".
 * @json-schema embedded:defs
 */
export type IQuantity = IUneceQuantityType &
  Required<Pick<IUneceQuantityType, "@context" | "type" | "QuantityTypeValue">>;
