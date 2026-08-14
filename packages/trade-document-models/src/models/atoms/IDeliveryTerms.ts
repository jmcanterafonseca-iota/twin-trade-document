// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceDeliveryTerms } from "@twin.org/standards-unece";

/**
 * The delivery terms of a trade document. The Incoterm goes in
 * `deliveryTermsDeliveryTypeCode` and its named place in `relevantLocation`;
 * weight basis, tolerance and tare rules have no typed slot and go verbatim in
 * `description`.
 * @json-schema embedded:defs
 */
export type IDeliveryTerms = IUneceDeliveryTerms &
  Required<Pick<IUneceDeliveryTerms, "@context" | "type" | "description">>;
