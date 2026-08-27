// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import { Factory } from "@twin.org/core";
import type { IDocumentTypeDescription } from "./IDocumentTypeDescription.js";

/**
 * Factory for creating handlers for data types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DocumentTypesFactory =
	Factory.createFactory<IDocumentTypeDescription>("document-type");
