// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceDocument } from "@twin.org/standards-unece";

/**
 * Another document referenced by a trade document, such as a governing standard
 * contract, a code of conduct or a set of purchase conditions.
 * @json-schema embedded:defs
 */
export type IReferencedDocument = IUneceDocument &
  Required<Pick<IUneceDocument, "@context" | "type">>;
