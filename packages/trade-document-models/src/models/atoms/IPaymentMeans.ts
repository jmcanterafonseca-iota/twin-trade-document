// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUnecePaymentMeans } from "@twin.org/standards-unece";

/**
 * The means by which a payment is to be made, such as a transfer, a cheque or
 * a documentary credit.
 */
export type IPaymentMeans = IUnecePaymentMeans &
  Required<Pick<IUnecePaymentMeans, "paymentMeansTypeCode">>;
