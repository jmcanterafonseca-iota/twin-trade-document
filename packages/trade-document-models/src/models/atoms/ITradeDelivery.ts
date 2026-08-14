// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeDelivery } from "@twin.org/standards-unece";

/**
 * The shipping details of a trade document: instructions, despatch and delivery
 * events, ship-to and ship-from parties, consignments, packaging and transport
 * equipment.
 * @json-schema embedded:defs
 */
export type ITradeDelivery = IUneceHeaderTradeDelivery &
  Required<Pick<IUneceHeaderTradeDelivery, "@context" | "type">>;
