// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceSupplyChainPackaging } from "@twin.org/standards-unece";

/**
 * How the goods are packed: the coded package type, plus its trade name in
 * `description` when the document names a brand such as a hermetic liner.
 * @json-schema embedded:defs
 */
export type IPackaging = IUneceSupplyChainPackaging &
  Required<Pick<IUneceSupplyChainPackaging, "@context" | "type" | "packageTypeCode">>;
