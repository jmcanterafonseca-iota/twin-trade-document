// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IValueHookContext } from "./IValueHookContext.js";

/**
 * Hook functions invoked while filling target leaves, allowing a source
 * value to be transformed before it is injected in the output. The most
 * specific hook wins and runs alone: by property FQN first, by format
 * second, the built-in coercion as fallback. A hook returning undefined
 * drops the property.
 */
export interface ITransformerHooks {
	/**
	 * Hooks keyed by the target property's `format` (e.g. `date-time`).
	 */
	byFormat?: {
		[format: string]: (value: unknown, context: IValueHookContext) => unknown | Promise<unknown>;
	};

	/**
	 * Hooks keyed by the resolved JSON-LD property FQN.
	 */
	byProperty?: {
		[fqn: string]: (value: unknown, context: IValueHookContext) => unknown | Promise<unknown>;
	};
}
