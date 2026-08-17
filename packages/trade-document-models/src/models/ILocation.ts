// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceLogisticsLocation } from "@twin.org/standards-unece";

/**
 * A place named by a trade document, such as a destination or a place of
 * payment presentation. Use `locationFunctionTypeCode` to say which.
 * @json-schema embedded:defs
 */
export type ILocation = IUneceLogisticsLocation &
  Required<Pick<IUneceLogisticsLocation, "locationFunctionTypeCode">> & {
    unLocode: string;
  }
