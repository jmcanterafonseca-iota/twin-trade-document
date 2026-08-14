// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceTradeParty } from "@twin.org/standards-unece";

/**
 * A party taking a role in a trade document, such as the buyer or the seller.
 * Only the name is mandatory: sample documents identify counterparties by name
 * alone, so requiring an address would reject a real document. The address,
 * role codes, identifiers and contacts are all inherited and optional.
 * @json-schema embedded:defs
 */
export type ITradeParty = IUneceTradeParty &
  Required<Pick<IUneceTradeParty, "@context" | "type" | "name">>;
