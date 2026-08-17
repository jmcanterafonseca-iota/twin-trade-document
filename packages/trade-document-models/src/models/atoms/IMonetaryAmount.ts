// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceAmountType } from "@twin.org/standards-unece";

/**
 * A monetary amount. Both the value and its currency are mandatory: an amount
 * without one of them cannot be acted on.
 * @json-schema embedded:defs
 */
export type IMonetaryAmount = IUneceAmountType &
  Required<Pick<IUneceAmountType, "AmountTypeValue" | "AmountTypeCurrency">>;
