// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceNote } from "@twin.org/standards-unece";

/**
 * Contractual prose with no typed UN/CEFACT slot. `subject` is mandatory: it is
 * how a consumer finds a note without parsing free text.
 * @json-schema embedded:defs
 */
export type INote = IUneceNote &
  Required<Pick<IUneceNote, "@context" | "type" | "content" | "subject">>;
