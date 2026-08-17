// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceTradeProduct } from "@twin.org/standards-unece";

/**
 * The goods on a line: `description` for the free text, `name` for the mark,
 * `designation` for the grade, `originCountry` for the origin.
 * @json-schema embedded:defs
 */
export type IProduct = IUneceTradeProduct &
  Required<Pick<IUneceTradeProduct, "@context" | "type" | "description">>;
