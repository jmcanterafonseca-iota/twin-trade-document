// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IValidationFailure } from "@twin.org/core";
import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import { UneceDataTypes } from "@twin.org/standards-unece";
import { TradeDocumentDataTypes } from "../../src/dataTypes/tradeDocumentDataTypes.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";
import { COMMERCIAL_INVOICE } from "../fixtures/commercialInvoice.js";

const COMMERCIAL_INVOICE_TYPE = `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.CommercialInvoice}`;

const doc = COMMERCIAL_INVOICE;
const bank = doc.specifiedPaymentMeans[0];

/**
 * Every data-bearing fact on the page, with the value the model carries for
 * it. Ids match the inventory in docs/model-guide.md section 9. Page furniture
 * — logo, cherry photo, green rule, row labels, punch holes, a stray pen
 * stroke, the cut-off footer edge — is deliberately absent.
 */
const FACTS: [number, string, unknown, unknown][] = [
  [2, "invoicer letterhead", doc.invoicerParty.name, "Kilimo Estates Traders Co. Ltd"],
  [3, "our ctr ref", doc.invoiceIssuerReference, "S - KET / 620"],
  [4, "invoice date", doc.issueDateTime.DateValue, "2025-11-07T00:00:00.000Z"],
  [5, "your ctr ref", doc.payerReference, "118254"],
  [6, "invoicee name", doc.invoiceeParty.name, "Alpina Kaffee AG"],
  [7, "invoicee street", doc.invoiceeParty.postalAddress?.streetName, "Bahnhofplatz 9"],
  [8, "invoicee postcode", doc.invoiceeParty.postalAddress?.postcodeCode, "CH-3007"],
  [9, "invoicee city", doc.invoiceeParty.postalAddress?.cityName, "Bern"],
  [10, "invoicee country", doc.invoiceeParty.postalAddress?.countryName, "SWITZERLAND"],
  [11, "invoice number heading", doc.invoiceNumber, "S - KET / 620"],
  [12, "goods row", doc.specifiedTradeProduct[0].description, "WASHED KENYA ARABICA COFFEE"],
  // 13 preserves the page's own casing mismatch against fact 6
  [13, "notify name, lowercase k", doc.notifyParty.name, "Alpina kaffee AG."],
  [14, "notify country", doc.notifyParty.postalAddress?.countryName, "Switzerland"],
  [15, "quality row", doc.quality.QualityValue, "WASHED KENYA ARABICA COFFEE"],
  [16, "total bags", doc.packageQuantity.QuantityTypeValue, "320"],
  [17, "destination city", doc.finalDestinationLocation.name, "ANTWERP"],
  [18, "destination country", doc.finalDestinationLocation.countryName, "BELGIUM"],
  [19, "gross weight", doc.grossWeightMeasure.MeasureTypeValue, "19488.00"],
  [20, "tare weight", doc.tareWeightMeasure.MeasureTypeValue, "288.00"],
  [21, "net weight", doc.netWeightMeasure.MeasureTypeValue, "19200.00"],
  // 22 restates 320 BAGS on the sales value row; same property carries both
  [22, "sales value bags restated", doc.packageQuantity.QuantityTypeValue, "320"],
  [23, "grade", doc.specifiedTradeProduct[0].designation, "AB FAQ"],
  [24, "price amount", doc.price.unitAmount[0].AmountTypeValue, "376.00"],
  [24, "price currency", doc.price.unitAmount[0].AmountTypeCurrency, "unece:AmountCurrency#USD"],
  [25, "price basis", doc.price.basisQuantity.QuantityTypeValue, "50"],
  [26, "stated value", doc.totalInvoiceAmount[0].AmountTypeValue, "144384.00"],
  [27, "transfer request", doc.duePayableAmount[0].AmountTypeValue, "144000.00"],
  [28, "bank name", bank.payeeSpecifiedFinancialInstitution?.name, "SAVANNAH COMMERCIAL BANK OF KENYA"],
  [29, "account name", bank.payeePartyFinancialAccount?.[0].accountName, "KILIMO ESTATES TRADERS LTD"],
  [30, "account number", bank.payeePartyFinancialAccount?.[0].proprietaryId, "03204175830012"],
  [
    31,
    "bank code",
    bank.payeeSpecifiedFinancialInstitution?.additionalClearingSystemId,
    "14000",
  ],
  [
    32,
    "branch number",
    bank.payeeSpecifiedFinancialInstitution?.subDivisionFinancialInstitution?.identifier,
    "14027",
  ],
  [
    33,
    "branch name",
    bank.payeeSpecifiedFinancialInstitution?.subDivisionFinancialInstitution?.name,
    "MASHARIKI",
  ],
  [34, "swift", bank.payeeSpecifiedFinancialInstitution?.bICId, "SVCBKENA"],
  [35, "signatory title", doc.invoicerParty.confirmedAuthentication?.[0].information, "DIRECTOR"],
  [
    36,
    "signature line",
    doc.invoicerParty.confirmedAuthentication?.[0].statement,
    "KILIMO ESTATES TRADERS LIMITED",
  ],
  [
    37,
    "name as stamped",
    doc.invoicerParty.confirmedAuthentication?.[0].signatory,
    "KILIMO ESTATES TRADERS LTD.",
  ],
  [
    38,
    "stamp date",
    doc.invoicerParty.confirmedAuthentication?.[0].actualDateTime,
    "2025-11-07T00:00:00.000Z",
  ],
  [39, "stamp po box", doc.invoicerParty.postalAddress?.postOfficeBox, "41207"],
  [39, "stamp postcode", doc.invoicerParty.postalAddress?.postcodeCode, "00240"],
  [40, "stamp city", doc.invoicerParty.postalAddress?.cityName, "NAIROBI"],
  [40, "stamp country", doc.invoicerParty.postalAddress?.countryName, "KENYA"],
  // 41 the manuscript signature is an illegible scrawl; its presence is
  // recorded by the authentication existing at all
  [41, "signature present", doc.invoicerParty.confirmedAuthentication?.length, 1],
];

/**
 * The data-bearing fact ids of the page inventory: 2-41 inclusive, with 1 and
 * the remaining 5 furniture ids (42-46) excluded.
 */
const DATA_BEARING_FACT_IDS = Array.from({ length: 40 }, (_, i) => 2 + i);

describe("Commercial invoice coverage", () => {
  beforeAll(async () => {
    JsonLdDataTypes.registerTypes();
    UneceDataTypes.registerTypes();
    TradeDocumentDataTypes.registerTypes();
  });

  test("The fully transcribed document validates", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      COMMERCIAL_INVOICE_TYPE,
      doc,
      validationFailures,
    );
    expect(validationFailures).toEqual([]);
    expect(isValid).toEqual(true);
  });

  test.each(FACTS)("Fact %i (%s) is carried", (_id, _what, actual, expected) => {
    expect(actual).toEqual(expected);
  });

  test("The page's two money figures stay contradictory, as printed", () => {
    // VALUE 144,384.00 versus PLEASE TRANSFER 144,000.00 — the document asks
    // for less than its own stated value. Both are carried; neither is fixed.
    expect(doc.totalInvoiceAmount[0].AmountTypeValue).not.toEqual(
      doc.duePayableAmount[0].AmountTypeValue,
    );
  });

  test("Nothing is derived — what the page does not state is left absent", () => {
    // The page never says what the bags are made of, names no payee line,
    // and states no payment terms or notes.
    expect(doc.includedPackaging).toBeUndefined();
    expect(doc.payeeParty).toBeUndefined();
    expect(doc.specifiedPaymentTerms).toBeUndefined();
    expect(doc.includedNote).toBeUndefined();
  });

  test("Every data-bearing fact on the page is accounted for", () => {
    const covered = [...new Set(FACTS.map(([id]) => id))].sort((a, b) => a - b);
    expect(covered).toEqual(DATA_BEARING_FACT_IDS);
    expect(covered).toHaveLength(40);
  });

  test("Can fail to validate an invoice missing its amounts", async () => {
    const { totalInvoiceAmount, duePayableAmount, ...withoutAmounts } = doc;
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      COMMERCIAL_INVOICE_TYPE,
      withoutAmounts,
      validationFailures,
    );
    expect(isValid).toEqual(false);
    expect(validationFailures.map((f) => f.properties?.params)).toEqual(
      expect.arrayContaining([
        { missingProperty: "totalInvoiceAmount" },
        { missingProperty: "duePayableAmount" },
      ]),
    );
  });
});
