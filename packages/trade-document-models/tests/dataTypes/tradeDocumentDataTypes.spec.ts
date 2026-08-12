// Copyright 2024 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IValidationFailure } from "@twin.org/core";
import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import { TradeDocumentDataTypes } from "../../src/dataTypes/tradeDocumentDataTypes.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";

describe("AuditableItemGraphDataTypes", () => {
  beforeAll(async () => {
    JsonLdDataTypes.registerTypes();
    TradeDocumentDataTypes.registerTypes();
  });

  test.skip("Can fail to validate an empty Trade Agreement", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.TradeAgreement}`,
      {},
      validationFailures,
    );
    expect(validationFailures.length).toEqual(3);
    expect(isValid).toEqual(false);
  });

  test("Can validate an empty Trade Agreement", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.TradeAgreement}`,
      {
        "@context": [
          TradeDocumentContexts.ContextTradeAgreement
        ],
        type: TradeDocumentTypes.TradeAgreement,
        issueDate: new Date().toISOString()
      },
      validationFailures,
    );
    expect(validationFailures.length).toEqual(0);
    expect(isValid).toEqual(true);
  });
});
