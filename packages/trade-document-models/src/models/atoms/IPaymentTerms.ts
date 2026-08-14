// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUnecePaymentTerms } from "@twin.org/standards-unece";

/**
 * The terms of payment agreed for a trade document. Carry the verbatim text in
 * `description` and the code list value in `paymentTermsTypeCode`.
 * @json-schema embedded:defs
 */
export type IPaymentTerms = IUnecePaymentTerms &
  Required<Pick<IUnecePaymentTerms, "@context" | "type" | "description">>;
