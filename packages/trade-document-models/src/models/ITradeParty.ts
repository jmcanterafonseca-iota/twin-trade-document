// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceTradeParty } from "@twin.org/standards-unece";

/**
 * A party taking a role in a trade document, such as the buyer or the seller.
 *
 * Only the name is promoted to mandatory. The sample documents identify their
 * counterparties by name alone ("Kilimo Estates Trading Co Ltd"), or by name and
 * country ("Northgate Coffee Importers Ltd. United Kingdom"); only one of the
 * three carries a street address. Requiring `postalAddress` would make a real
 * document unrepresentable.
 *
 * Everything else UN/CEFACT offers stays optional and is inherited from
 * IUneceTradeParty, notably `postalAddress`, `partyRoleCode` (Buyer, Seller,
 * Exporter), `identifier`, `definedContact` and the communication properties.
 *
 * This is a child type, never a document in its own right, so it is hoisted
 * into the `$defs` of whichever document schema references it rather than
 * being left as an external `$ref`.
 * @json-schema embedded:defs
 */
export type ITradeParty = IUneceTradeParty &
  Required<Pick<IUneceTradeParty, "@context" | "type" | "name">>;
