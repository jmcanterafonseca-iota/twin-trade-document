// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IValidationFailure } from "@twin.org/core";
import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import {
  UneceAmountCurrency,
  UneceCountryId,
  UneceDataTypes,
  UneceLocationFunctionCodeList,
  UnecePackageTypeCodeList,
  UneceTypes,
} from "@twin.org/standards-unece";
import { TradeDocumentDataTypes } from "../../src/dataTypes/tradeDocumentDataTypes.js";
import type { IPurchaseOrder } from "../../src/models/IPurchaseOrder.js";
import type { ITradeAgreement } from "../../src/models/ITradeAgreement.js";
import type { ITradeItem } from "../../src/models/ITradeItem.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";

const TRADE_AGREEMENT_TYPE = `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.TradeAgreement}`;
const PURCHASE_ORDER_TYPE = `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.PurchaseOrder}`;

/**
 * Build one contracted lot, populating every column of the buyer's contract table.
 * @param lineId The lot reference: `Contract No` "46690" on the buyer's paper, "ctr/742" on the seller's.
 * @param mark The coffee mark or estate, the first token of `Quality`.
 * @param grade The coffee grade, the last token of `Quality`.
 * @param bags The `Quantity` column, a number of bags.
 * @param unitPrice The `Price` column, per 50 kg, in US dollars.
 * @returns The trade item.
 */
function buildLot(
  lineId: string,
  mark: string,
  grade: string,
  bags: string,
  unitPrice: string,
): ITradeItem {
  return {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.SupplyChainTradeLineItem,
    // `Contract No`
    associatedDocumentLineDocument: {
      type: UneceTypes.DocumentLineDocument,
      lineId,
    },
    specifiedTradeProduct: [
      {
        type: UneceTypes.TradeProduct,
        // `Quality`, split into its two tokens
        name: mark,
        designation: grade,
        // `Origin`
        originCountry: [
          {
            type: UneceTypes.Country,
            countryId: UneceCountryId.KENYA,
            name: "Kenya",
          },
        ],
      },
    ],
    specifiedLineTradeDelivery: [
      {
        type: UneceTypes.LineTradeDelivery,
        // `Quantity`
        orderQuantity: {
          type: UneceTypes.QuantityType,
          QuantityTypeValue: bags,
        },
        // `Kg per Unit`. The unit itself has no home: IUneceQuantityCode
        // declares no value property, so "KGM" cannot be attached.
        perPackageUnitQuantity: {
          type: UneceTypes.QuantityType,
          QuantityTypeValue: "60",
        },
        // `Unit Type`. GrainPro is a hermetic liner brand, not a UN/CEFACT
        // package type, so the code says Bag and the brand goes in description.
        includedPackaging: [
          {
            type: UneceTypes.SupplyChainPackaging,
            packageTypeCode: UnecePackageTypeCodeList.Bag,
            description: "Grain Pro",
          },
        ],
      },
    ],
    specifiedLineTradeAgreement: {
      type: UneceTypes.LineTradeAgreement,
      agreedPriceProductPrice: [
        {
          type: UneceTypes.TradePrice,
          unitAmount: [
            {
              type: UneceTypes.AmountType,
              AmountTypeValue: unitPrice,
              AmountTypeCurrency: UneceAmountCurrency.USDollar,
            },
          ],
          basisQuantity: {
            type: UneceTypes.QuantityType,
            QuantityTypeValue: "50",
          },
        },
      ],
    },
  };
}

/**
 * The seller's sale confirmation, Jowam to D.R. Wakefield, ref S - JCT / 742-744.
 * `.context/Document Samples/01-Sale Confirmation(s)/Seller_s Sale Confirmation (D.R. Wakefield).pdf`
 */
const SALE_CONFIRMATION: ITradeAgreement = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeAgreement,
  issueDateTime: "2024-09-06T00:00:00.000Z",
  sellerReference: "S - JCT / 742-744",
  buyerReference: "TBA",
  buyerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "D.R. Wakefield & Company Ltd.",
  },
  sellerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Jowam Coffee Traders Co. Ltd.",
  },
  includedSupplyChainTradeLineItem: [
    buildLot("ctr/742", "Asali", "AB", "200", "290.00"),
    buildLot("ctr/743", "Zawadi", "PB", "50", "296.00"),
    buildLot("ctr/744", "Acacias Thunguri", "AA", "70", "318.00"),
  ],
};

/**
 * The seller's sale confirmation, Jowam to Blaser Trading, ref S - JCT / 807.
 * A single lot contract: quantity, quality and price are stated at header
 * level and the document has no line breakdown at all.
 * `.context/Document Samples/01-Sale Confirmation(s)/Seller_s Sale Confirmation (Blaser Trading)_.webp`
 */
const SALE_CONFIRMATION_NO_LINES: ITradeAgreement = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeAgreement,
  issueDateTime: "2025-05-16T00:00:00.000Z",
  sellerReference: "S - JCT / 807",
  buyerReference: "TBA",
  buyerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Blaser Trading AG.",
  },
  sellerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Jowam Coffee Traders Co. Ltd.",
  },
};

/**
 * The buyer's purchase contract, D.R. Wakefield to Jowam, contracts 46690-46692.
 * The mirror of SALE_CONFIRMATION, issued four days later; it cites no seller
 * reference anywhere.
 * `.context/Document Samples/02-Buyer Purchase Contract(s)/Buyer_s Purchase Contract.pdf`
 */
const PURCHASE_CONTRACT: IPurchaseOrder = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeAgreement,
  issueDateTime: "2024-09-10T00:00:00.000Z",
  // `identifier` is absent on purpose: the document numbers each line and has
  // no header level order number. Nothing is derived to fill it.
  // `Destination`: CWT, Tilbury, United Kingdom
  applicableLocation: [
    {
      type: UneceTypes.LogisticsLocation,
      name: "Tilbury",
      description: "CWT",
      countryName: "United Kingdom",
      logisticsLocationCountryId: UneceCountryId.UNITEDKINGDOMOFGREATBRITAINANDNORTHERNIRELAND,
      locationFunctionTypeCode: [UneceLocationFunctionCodeList.PlaceOfDelivery],
    },
  ],
  buyerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "DR Wakefield Company Limited",
  },
  sellerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Jowam Coffee Trading Co Ltd",
  },
  includedSupplyChainTradeLineItem: [
    buildLot("46690", "Asali", "AB", "200", "290.00"),
    buildLot("46691", "Zawadi", "PB", "50", "296.00"),
    buildLot("46692", "Acacias,Thunguri", "AA", "70", "318.00"),
  ],
};

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
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      TRADE_AGREEMENT_TYPE,
      {},
      validationFailures,
    );
    expect(isValid).toEqual(false);
    expect(validationFailures.map((f) => f.properties?.params)).toEqual(
      expect.arrayContaining([
        { missingProperty: "@context" },
        { missingProperty: "type" },
        { missingProperty: "sellerReference" },
        { missingProperty: "issueDateTime" },
        { missingProperty: "buyerParty" },
        { missingProperty: "sellerParty" },
      ]),
    );
  });

  test("Can validate the D.R. Wakefield sale confirmation", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      TRADE_AGREEMENT_TYPE,
      SALE_CONFIRMATION,
      validationFailures,
    );
    expect(validationFailures).toEqual([]);
    expect(isValid).toEqual(true);
  });

  test("Can validate a sale confirmation that has no line items", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      TRADE_AGREEMENT_TYPE,
      SALE_CONFIRMATION_NO_LINES,
      validationFailures,
    );
    expect(validationFailures).toEqual([]);
    expect(isValid).toEqual(true);
  });

  test("Can fail to validate a sale confirmation with no seller reference", async () => {
    const validationFailures: IValidationFailure[] = [];
    const { sellerReference, ...withoutSellerReference } = SALE_CONFIRMATION;
    const isValid = await DataTypeHelper.validate(
      "",
      TRADE_AGREEMENT_TYPE,
      withoutSellerReference,
      validationFailures,
    );
    expect(isValid).toEqual(false);
    expect(validationFailures.map((f) => f.properties?.params)).toEqual([
      { missingProperty: "sellerReference" },
    ]);
  });

  test("Can validate the D.R. Wakefield purchase contract", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      PURCHASE_ORDER_TYPE,
      PURCHASE_CONTRACT,
      validationFailures,
    );
    expect(validationFailures).toEqual([]);
    expect(isValid).toEqual(true);
  });

  test("Requires everything the UNVTD purchase order requires, bar the order number", async () => {
    // The required set of https://unvtd.unece.org/purchase-order-schema.yaml,
    // translated into the D23B terms its own context expands the wire names into.
    // `purchaseOrderNumber` -> `identifier` is deliberately NOT mandatory: the
    // sample contract numbers each line and has none at document level, and
    // representing the real documents without inventing data comes first.
    const unvtdRequired: [string, keyof IPurchaseOrder][] = [
      ["orderDate", "issueDateTime"],
      ["buyer", "buyerParty"],
      ["seller", "sellerParty"],
      ["deliveryLocation", "applicableLocation"],
      ["orderedItems", "includedSupplyChainTradeLineItem"],
    ];

    for (const [unvtdName, property] of unvtdRequired) {
      const validationFailures: IValidationFailure[] = [];
      const { [property]: removed, ...withoutProperty } = PURCHASE_CONTRACT;
      const isValid = await DataTypeHelper.validate(
        "",
        PURCHASE_ORDER_TYPE,
        withoutProperty,
        validationFailures,
      );
      expect(isValid, `UNVTD ${unvtdName} -> ${property} should be mandatory`).toEqual(false);
      expect(validationFailures.map((f) => f.properties?.params)).toEqual([
        { missingProperty: property },
      ]);
    }
  });

  test("Carries every column of the buyer's contract table", async () => {
    const [firstLot] = PURCHASE_CONTRACT.includedSupplyChainTradeLineItem;
    const [product] = firstLot.specifiedTradeProduct;
    const [delivery] = firstLot.specifiedLineTradeDelivery;
    const [price] = firstLot.specifiedLineTradeAgreement.agreedPriceProductPrice;

    // Contract No | Origin | Quality | Quantity | Unit Type | Kg per Unit | Price | Units
    expect(firstLot.associatedDocumentLineDocument.lineId).toEqual("46690");
    expect(product.originCountry?.[0].countryId).toEqual(UneceCountryId.KENYA);
    expect(product.name).toEqual("Asali");
    expect(product.designation).toEqual("AB");
    expect(delivery.orderQuantity?.QuantityTypeValue).toEqual("200");
    expect(delivery.includedPackaging?.[0].packageTypeCode).toEqual(UnecePackageTypeCodeList.Bag);
    expect(delivery.includedPackaging?.[0].description).toEqual("Grain Pro");
    expect(delivery.perPackageUnitQuantity?.QuantityTypeValue).toEqual("60");
    expect(price.unitAmount?.[0].AmountTypeValue).toEqual("290.00");
    expect(price.unitAmount?.[0].AmountTypeCurrency).toEqual(UneceAmountCurrency.USDollar);
    expect(price.basisQuantity?.QuantityTypeValue).toEqual("50");

    // The contract total is only computable because the 50 kg price basis and
    // the 60 kg per bag are both expressible. UNVTD's unitPrice has neither, so
    // the same three lines there read as 95,060 USD instead of 114,072.
    const total = PURCHASE_CONTRACT.includedSupplyChainTradeLineItem.reduce((sum, lot) => {
      const [lotDelivery] = lot.specifiedLineTradeDelivery;
      const [lotPrice] = lot.specifiedLineTradeAgreement.agreedPriceProductPrice;
      const bags = Number(lotDelivery.orderQuantity?.QuantityTypeValue);
      const kgPerBag = Number(lotDelivery.perPackageUnitQuantity?.QuantityTypeValue);
      const basisKg = Number(lotPrice.basisQuantity?.QuantityTypeValue);
      const perBasis = Number(lotPrice.unitAmount?.[0].AmountTypeValue);
      return sum + ((bags * kgPerBag) / basisKg) * perBasis;
    }, 0);
    expect(total).toEqual(114072);
  });

  test("Can fail to validate a lot that has no agreed price", async () => {
    const validationFailures: IValidationFailure[] = [];
    const lot = buildLot("ctr/742", "Asali", "AB", "200", "290.00");
    const { agreedPriceProductPrice, ...agreementWithoutPrice } =
      lot.specifiedLineTradeAgreement;

    const isValid = await DataTypeHelper.validate(
      "",
      TRADE_AGREEMENT_TYPE,
      {
        ...SALE_CONFIRMATION,
        includedSupplyChainTradeLineItem: [
          { ...lot, specifiedLineTradeAgreement: agreementWithoutPrice },
        ],
      },
      validationFailures,
    );
    expect(isValid).toEqual(false);
    expect(validationFailures.map((f) => f.properties?.params)).toEqual(
      expect.arrayContaining([{ missingProperty: "agreedPriceProductPrice" }]),
    );
  });
});
