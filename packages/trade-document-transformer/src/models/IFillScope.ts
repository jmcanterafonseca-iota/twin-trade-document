// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { ISemanticIndexEntry } from "./ISemanticIndexEntry.js";

/**
 * A lookup scope while filling: an index entry and the concrete context path
 * its property paths resolve against.
 */
export interface IFillScope {
	/**
	 * The index entry.
	 */
	entry: ISemanticIndexEntry;

	/**
	 * The concrete context path (numbers are array indices).
	 */
	context: (string | number)[];
}
