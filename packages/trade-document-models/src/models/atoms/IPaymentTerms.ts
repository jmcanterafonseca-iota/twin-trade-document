// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IUnecePaymentTerms } from "@twin.org/standards-unece";

/**
 * The terms of payment agreed for a trade document.
 */
export type IPaymentTerms = IUnecePaymentTerms &
	Required<Pick<IUnecePaymentTerms, "paymentTermsTypeCode">>;
