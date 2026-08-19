// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { ISemanticIndexEntry } from "./ISemanticIndexEntry.js";

/**
 * A semantic index: entity property FQN (or `@root`, or a pinned type FQN)
 * to its entry.
 */
export interface ISemanticIndex {
	[fqn: string]: ISemanticIndexEntry;
}
