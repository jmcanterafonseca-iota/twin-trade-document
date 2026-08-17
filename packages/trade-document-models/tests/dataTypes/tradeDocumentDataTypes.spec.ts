// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IValidationFailure } from "@twin.org/core";
import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import { TradeDocumentDataTypes } from "../../src/dataTypes/tradeDocumentDataTypes.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";
import { UneceDataTypes } from "@twin.org/standards-unece";

const TRADE_AGREEMENT_TYPE = `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.TradeAgreement}`;

describe("TradeDocumentDataTypes", () => {
  beforeAll(async () => {
    JsonLdDataTypes.registerTypes();
    // Registers every UN/CEFACT schema under https://schema.twindev.org/unece/Unece*,
    // which is what the allOf $ref of each generated schema points at. Without
    // it AJV resolves those refs over the network.
    UneceDataTypes.registerTypes();
    TradeDocumentDataTypes.registerTypes();
  });

  test("Can fail to validate an empty Trade Agreement", async () => {
    let validationFailures: IValidationFailure[] = [];

    const isValid = await DataTypeHelper.validate(
      "",
      `${TRADE_AGREEMENT_TYPE}`,
      {},
      validationFailures,
    );

    expect(isValid).toEqual(false);
  });
});
