// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IValidationFailure } from "@twin.org/core";
import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import { UneceDataTypes } from "@twin.org/standards-unece";
import { TradeDocumentDataTypes } from "../../src/dataTypes/tradeDocumentDataTypes.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";
import { BUYER_PURCHASE_CONTRACT } from "../fixtures/buyerPurchaseContract.js";

const PURCHASE_ORDER_TYPE = `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.PurchaseOrder}`;

const doc = BUYER_PURCHASE_CONTRACT;
const [line1, line2, line3] = doc.includedSupplyChainTradeLineItem;

/**
 * Read the verbatim value a note carries for a subject.
 * @param subject The note subject.
 * @returns The note content, or undefined.
 */
function note(subject: string): string | undefined {
  return doc.includedNote?.find((n) => n.subject === subject)?.content;
}

/**
 * Every data-bearing fact on the page, with the value the model actually
 * carries for it. Ids match the inventory in docs/model-guide.md section 8.
 * Page furniture — logo, straplines, column captions, terms labels, ruling,
 * the empty EUDR box, scanner dust — is deliberately absent: it carries no
 * data and needs no home.
 */
const FACTS: [number, string, unknown, unknown][] = [
  // --- header identity ---
  [2, "buyer wordmark", doc.buyerParty.name, "Northgate Coffee Importers Ltd"],
  [4, "contract date", doc.issueDateTime, "2025-03-14T00:00:00.000Z"],
  [7, "seller name as typed", doc.sellerParty.name, "Kilimo Estates Trading Co Ltd"],
  [8, "trade direction", note("Trade direction"), "We have bought the following coffee from you :"],

  // --- line 1, contract 81140 ---
  [17, "contract no", line1.associatedDocumentLineDocument.lineId, "81140"],
  [18, "origin", line1.specifiedTradeProduct[0].originCountry?.[0].name, "Kenya"],
  [19, "mark", line1.specifiedTradeProduct[0].name, "Mwitu"],
  [20, "grade", line1.specifiedTradeProduct[0].designation, "AB"],
  [21, "quantity", line1.specifiedLineTradeDelivery[0].orderQuantity?.QuantityTypeValue, "180"],
  [
    22,
    "unit type",
    line1.specifiedLineTradeDelivery[0].includedPackaging?.[0].description,
    "Grain Pro",
  ],
  [
    23,
    "kg per unit",
    line1.specifiedLineTradeDelivery[0].perPackageUnitQuantity?.QuantityTypeValue,
    "60",
  ],
  [
    24,
    "price",
    line1.specifiedLineTradeAgreement.agreedPriceProductPrice[0].unitAmount?.[0].AmountTypeValue,
    "275.00",
  ],
  [
    25,
    "currency",
    line1.specifiedLineTradeAgreement.agreedPriceProductPrice[0].unitAmount?.[0].AmountTypeCurrency,
    "unece:AmountCurrency#USD",
  ],
  [
    26,
    "price basis",
    line1.specifiedLineTradeAgreement.agreedPriceProductPrice[0].basisQuantity?.QuantityTypeValue,
    "50",
  ],

  // --- line 2, contract 81141 ---
  [27, "contract no", line2.associatedDocumentLineDocument.lineId, "81141"],
  [28, "origin", line2.specifiedTradeProduct[0].originCountry?.[0].name, "Kenya"],
  [29, "mark", line2.specifiedTradeProduct[0].name, "Tamu"],
  [30, "grade", line2.specifiedTradeProduct[0].designation, "PB"],
  [31, "quantity", line2.specifiedLineTradeDelivery[0].orderQuantity?.QuantityTypeValue, "45"],
  [
    32,
    "unit type",
    line2.specifiedLineTradeDelivery[0].includedPackaging?.[0].description,
    "Grain Pro",
  ],
  [
    33,
    "kg per unit",
    line2.specifiedLineTradeDelivery[0].perPackageUnitQuantity?.QuantityTypeValue,
    "60",
  ],
  [
    34,
    "price",
    line2.specifiedLineTradeAgreement.agreedPriceProductPrice[0].unitAmount?.[0].AmountTypeValue,
    "281.00",
  ],
  [
    35,
    "currency",
    line2.specifiedLineTradeAgreement.agreedPriceProductPrice[0].unitAmount?.[0].AmountTypeCurrency,
    "unece:AmountCurrency#USD",
  ],
  [
    36,
    "price basis",
    line2.specifiedLineTradeAgreement.agreedPriceProductPrice[0].basisQuantity?.QuantityTypeValue,
    "50",
  ],

  // --- line 3, contract 81142 ---
  [37, "contract no", line3.associatedDocumentLineDocument.lineId, "81142"],
  [38, "origin", line3.specifiedTradeProduct[0].originCountry?.[0].name, "Kenya"],
  [39, "mark", line3.specifiedTradeProduct[0].name, "Miti"],
  [40, "washing station", line3.specifiedTradeProduct[0].tradeName, "Kanjuu"],
  [41, "grade", line3.specifiedTradeProduct[0].designation, "AA"],
  [42, "quantity", line3.specifiedLineTradeDelivery[0].orderQuantity?.QuantityTypeValue, "65"],
  [
    43,
    "unit type",
    line3.specifiedLineTradeDelivery[0].includedPackaging?.[0].description,
    "Grain Pro",
  ],
  [
    44,
    "kg per unit",
    line3.specifiedLineTradeDelivery[0].perPackageUnitQuantity?.QuantityTypeValue,
    "60",
  ],
  [
    45,
    "price",
    line3.specifiedLineTradeAgreement.agreedPriceProductPrice[0].unitAmount?.[0].AmountTypeValue,
    "302.00",
  ],
  [
    46,
    "currency",
    line3.specifiedLineTradeAgreement.agreedPriceProductPrice[0].unitAmount?.[0].AmountTypeCurrency,
    "unece:AmountCurrency#USD",
  ],
  [
    47,
    "price basis",
    line3.specifiedLineTradeAgreement.agreedPriceProductPrice[0].basisQuantity?.QuantityTypeValue,
    "50",
  ],

  // --- Basis ---
  [
    55,
    "incoterm",
    doc.applicableDeliveryTerms?.deliveryTermsDeliveryTypeCode,
    "unece:DeliveryTermsCodeList#FOB",
  ],
  [55, "incoterm named place", doc.applicableDeliveryTerms?.relevantLocation?.name, "origin"],
  [55, "basis row verbatim", doc.basis?.BasisValue, "FOB origin, N.S.W, 0.5% franchise, Actual Tare."],
  [
    56,
    "N.S.W weight basis",
    line1.specifiedLineTradeDelivery[0].quantityCalculationMethodCode,
    "Nett Shipped Weights",
  ],
  [
    57,
    "0.5% franchise",
    line1.specifiedTradeProduct[0].applicableProductCharacteristic?.[0].valueTolerance?.[0]
      .minusValuePercent,
    "0.5",
  ],
  [
    58,
    "Actual Tare",
    line1.specifiedTradeProduct[0].applicableProductCharacteristic?.[1].valueMethod?.[0].name,
    "Actual Tare",
  ],

  // --- remaining terms rows ---
  [59, "shipment month", doc.shippingPeriod?.name, "June 2025"],
  [60, "destination warehouse", doc.deliveryLocation.description, "NDW"],
  [61, "destination town", doc.deliveryLocation.name, "Felixstowe"],
  [62, "destination country", doc.deliveryLocation.countryName, "United Kingdom"],
  [63, "vessel nomination", note("Vessel nomination"), "Buyer to nominate vessel."],
  [
    64,
    "shipping instructions",
    doc.applicableHeaderTradeDelivery?.[0].specifiedDeliveryInstructions?.[0].description,
    "Shipping instructions to follow.",
  ],
  [
    65,
    "payment method",
    doc.paymentTerms?.paymentTermsTypeCode?.[0],
    "unece:PaymentTermsTypeCodeList#72",
  ],
  [
    66,
    "payment trigger",
    doc.paymentTerms?.paymentTermsEventTimeReferenceFromEventCode,
    "unece:TimeReferenceCodeList#71",
  ],
  [67, "place of presentation", doc.applicableLocation?.[0].name, "Bristol"],
  [68, "insurance allocation", doc.insurance?.InsuranceValue, "For buyer's account."],
  [
    69,
    "condition precedent",
    doc.conditions?.ConditionsValue,
    "Subject to approval of preshipment sample by buyer.",
  ],
  [70, "EUDR", doc.applicableRegulatoryProcedure?.[0].certificationBasis, "EUDR Compliant"],

  // --- footer clause ---
  [71, "governing terms", doc.contractDocument?.[0].name, "European Standard Contract for Coffee"],
  [72, "edition", doc.contractDocument?.[0].versionId, "latest edition"],
  [
    73,
    "code of conduct",
    doc.purchaseConditionsDocument?.[0].name,
    "Northgate suppliers code of conduct",
  ],
  [
    74,
    "precedence rule",
    note("Precedence"),
    "and on the above particular conditions, which override all others",
  ],
  [75, "arbitration forum", note("Dispute resolution"), "London Arbitration."],

  // --- buyer address block ---
  [80, "buyer legal name", doc.buyerParty.name, "Northgate Coffee Importers Ltd"],
  [81, "buyer building", doc.buyerParty.postalAddress?.buildingName, "Harbour House"],
  [82, "buyer city", doc.buyerParty.postalAddress?.cityName, "Bristol"],
  [83, "buyer postcode", doc.buyerParty.postalAddress?.postcodeCode, "BS1 4RN"],
  [84, "buyer country", doc.buyerParty.postalAddress?.countryName, "United Kingdom"],

  // --- stamp and signature ---
  [
    86,
    "seller name as stamped",
    doc.sellerParty.confirmedAuthentication?.[0].signatory,
    "KILIMO ESTATES TRADERS LTD.",
  ],
  [
    87,
    "stamp date",
    doc.sellerParty.confirmedAuthentication?.[0].actualDateTime,
    "2025-03-14T00:00:00.000Z",
  ],
  [88, "seller PO box", doc.sellerParty.postalAddress?.postOfficeBox, "41207"],
  [89, "seller postcode", doc.sellerParty.postalAddress?.postcodeCode, "00240"],
  [90, "seller city", doc.sellerParty.postalAddress?.cityName, "NAIROBI"],
  [91, "seller country", doc.sellerParty.postalAddress?.countryName, "KENYA"],
  // The scrawl itself is illegible and has no transcribable value; what the
  // model records is that an authentication exists.
  [93, "manuscript signature present", doc.sellerParty.confirmedAuthentication?.length, 1],
  [94, "countersignature instruction", note("Countersignature instruction"), "Please sign and return."],
  [95, "seller role exporter", doc.sellerParty.partyRoleCode?.[1], "unece:PartyRoleCodeList#EX"],
  [96, "seller role seller", doc.sellerParty.partyRoleCode?.[0], "unece:PartyRoleCodeList#SE"],
];

/**
 * The ids of every data-bearing fact in the page inventory: 40 header level
 * and 31 line level. The other 35 of the page's 106 atomic facts are page
 * furniture and need no home.
 */
const DATA_BEARING_FACT_IDS = [
  2, 4, 7, 8,
  ...Array.from({ length: 31 }, (_, i) => 17 + i), // 17-47, the three table rows
  ...Array.from({ length: 21 }, (_, i) => 55 + i), // 55-75, the terms rows and footer clause
  80, 81, 82, 83, 84,
  86, 87, 88, 89, 90, 91,
  93, 94, 95, 96,
];

describe("Buyer purchase contract coverage", () => {
  beforeAll(async () => {
    JsonLdDataTypes.registerTypes();
    UneceDataTypes.registerTypes();
    TradeDocumentDataTypes.registerTypes();
  });

  test("The fully transcribed document validates", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      PURCHASE_ORDER_TYPE,
      doc,
      validationFailures,
    );
    expect(validationFailures).toEqual([]);
    expect(isValid).toEqual(true);
  });

  test.each(FACTS)("Fact %i (%s) is carried", (_id, _what, actual, expected) => {
    expect(actual).toEqual(expected);
  });

  test("Nothing is derived — what the page does not state is left absent", () => {
    // The contract numbers each line and carries no document level order
    // number. UNVTD requires one; we leave it absent rather than synthesise a
    // range that appears nowhere on the paper.
    expect(doc.identifier).toBeUndefined();
    expect(doc.buyerReference).toBeUndefined();

    // The page has no "Buyer" label. The seller's roles ARE printed
    // (`Exporter/Shipper` over `Seller`), so only the seller carries a role.
    expect(doc.buyerParty.partyRoleCode).toBeUndefined();
    expect(doc.sellerParty.partyRoleCode).toHaveLength(2);

    // The document states no total, no invoicee, no payment means and no
    // allowance or charge. None is fabricated.
    expect(doc.paymentTerms?.instructedAmount).toBeUndefined();
    expect(doc.totalOrderAmount).toBeUndefined();
    expect(doc.paymentMethod).toBeUndefined();
    expect(doc.allowanceCharge).toBeUndefined();
    expect(doc.invoiceeParty).toBeUndefined();
  });

  test("Every data-bearing fact on the page is accounted for", () => {
    const covered = [...new Set(FACTS.map(([id]) => id))].sort((a, b) => a - b);
    expect(covered).toEqual(DATA_BEARING_FACT_IDS);
    expect(covered).toHaveLength(71);
    expect(covered.filter((id) => id >= 17 && id <= 47)).toHaveLength(31);
  });
});
