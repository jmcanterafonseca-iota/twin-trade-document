// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.
import type { IValidationFailure } from "@twin.org/core";
import { DataTypeHelper } from "@twin.org/data-core";
import { JsonLdDataTypes } from "@twin.org/data-json-ld";
import {
  UneceAmountCurrency,
  UneceCountryId,
  UneceDeliveryTermsCodeList,
  UnecePaymentTermsTypeCodeList,
  UneceDataTypes,
  UneceLocationFunctionCodeList,
  UnecePackageTypeCodeList,
  UneceTypes,
} from "@twin.org/standards-unece";
import { TradeDocumentDataTypes } from "../../src/dataTypes/tradeDocumentDataTypes.js";
import {
  buildLot,
  SALE_CONFIRMATION,
  SALE_CONFIRMATION_SINGLE_LOT,
} from "../fixtures/tradeAgreement.js";
import type { IPurchaseOrder } from "../../src/models/IPurchaseOrder.js";
import type { ITradeAgreement } from "../../src/models/ITradeAgreement.js";
import type { ITradeItem } from "../../src/models/atoms/ITradeItem.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";

const TRADE_AGREEMENT_TYPE = `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.TradeAgreement}`;
const PURCHASE_ORDER_TYPE = `${TradeDocumentContexts.Namespace}${TradeDocumentTypes.PurchaseOrder}`;

/**
 * The buyer's purchase contract, Northgate to Kilimo, contracts 81140-81142.
 * The mirror of SALE_CONFIRMATION, issued four days later; it cites no seller
 * reference anywhere.
 * `.context/Document Samples/02-Buyer Purchase Contract(s)/Buyer_s Purchase Contract.pdf`
 */
const PURCHASE_CONTRACT: IPurchaseOrder = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeAgreement,
  issueDateTime: {
    "@context": TradeDocumentContexts.Context,
    type: TradeDocumentTypes.Date,
    DateValue: "2025-03-14T00:00:00.000Z",
  },
  // `identifier` is absent on purpose: the document numbers each line and has
  // no header level order number. Nothing is derived to fill it.
  // `Destination`: NDW, Felixstowe, United Kingdom
  deliveryLocation: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.LogisticsLocation,
    name: "Felixstowe",
    description: "NDW",
    countryName: "United Kingdom",
    logisticsLocationCountryId: UneceCountryId.UNITEDKINGDOMOFGREATBRITAINANDNORTHERNIRELAND,
    locationFunctionTypeCode: [UneceLocationFunctionCodeList.PlaceOfDelivery],
  },
  buyerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Northgate Coffee Importers Ltd",
  },
  sellerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Kilimo Estates Trading Co Ltd",
  },
  includedSupplyChainTradeLineItem: [
    buildLot("81140", "Mwitu", "AB", "180", "275.00"),
    buildLot("81141", "Tamu", "PB", "45", "281.00"),
    buildLot("81142", "Miti,Kanjuu", "AA", "65", "302.00"),
  ],
  basis: { "@context": TradeDocumentContexts.Context, type: TradeDocumentTypes.Basis, BasisValue: "FOB origin, N.S.W, 0.5% franchise, Actual Tare." },
  insurance: { "@context": TradeDocumentContexts.Context, type: TradeDocumentTypes.Insurance, InsuranceValue: "For buyer's account." },
  conditions: { "@context": TradeDocumentContexts.Context, type: TradeDocumentTypes.Conditions, ConditionsValue: "Subject to approval of preshipment sample by buyer." },
  applicableDeliveryTerms: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.DeliveryTerms,
    deliveryTermsDeliveryTypeCode: UneceDeliveryTermsCodeList.FreeOnBoard,
    relevantLocation: { type: UneceTypes.TradeLocation, name: "origin" },
  },
  paymentTerms: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.PaymentTerms,
    paymentTermsTypeCode: [UnecePaymentTermsTypeCodeList.CashAgainstDocuments],
    description: "Nett Cash Against Documentation on first presentation in Bristol.",
  },
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

  test("Can validate the Northgate sale confirmation", async () => {
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

  test("Can validate a single lot sale confirmation", async () => {
    const validationFailures: IValidationFailure[] = [];
    const isValid = await DataTypeHelper.validate(
      "",
      TRADE_AGREEMENT_TYPE,
      SALE_CONFIRMATION_SINGLE_LOT,
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

  test("Can validate the Northgate purchase contract", async () => {
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
      ["deliveryLocation", "deliveryLocation"],
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
    expect(firstLot.identifier).toEqual("81140");
    expect(product.originCountry?.[0].countryId).toEqual(UneceCountryId.KENYA);
    expect(product.name).toEqual("Mwitu");
    expect(product.designation).toEqual("AB");
    expect(delivery.orderQuantity?.QuantityTypeValue).toEqual("180");
    expect(delivery.includedPackaging?.[0].packageTypeCode).toEqual(UnecePackageTypeCodeList.Bag);
    expect(delivery.includedPackaging?.[0].description).toEqual("Grain Pro");
    expect(delivery.perPackageUnitQuantity?.QuantityTypeValue).toEqual("60");
    expect(price.unitAmount?.[0].AmountTypeValue).toEqual("275.00");
    expect(price.unitAmount?.[0].AmountTypeCurrency).toEqual(UneceAmountCurrency.USDollar);
    expect(price.basisQuantity?.QuantityTypeValue).toEqual("50");

    // The contract total is only computable because the 50 kg price basis and
    // the 60 kg per bag are both expressible. UNVTD's unitPrice has neither, so
    // the same three lines there read as 81,775 USD instead of 98,130.
    const total = PURCHASE_CONTRACT.includedSupplyChainTradeLineItem.reduce((sum, lot) => {
      const [lotDelivery] = lot.specifiedLineTradeDelivery;
      const [lotPrice] = lot.specifiedLineTradeAgreement.agreedPriceProductPrice;
      const bags = Number(lotDelivery.orderQuantity?.QuantityTypeValue);
      const kgPerBag = Number(lotDelivery.perPackageUnitQuantity?.QuantityTypeValue);
      const basisKg = Number(lotPrice.basisQuantity?.QuantityTypeValue);
      const perBasis = Number(lotPrice.unitAmount?.[0].AmountTypeValue);
      return sum + ((bags * kgPerBag) / basisKg) * perBasis;
    }, 0);
    expect(total).toEqual(98130);
  });

  test("Can fail to validate a lot that has no agreed price", async () => {
    const validationFailures: IValidationFailure[] = [];
    const lot = buildLot("ctr/519", "Mwitu", "AB", "180", "275.00");
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
