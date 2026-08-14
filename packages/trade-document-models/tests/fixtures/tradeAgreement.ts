// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * Two seller issued sale confirmations, transcribed in full and anonymised
 * with their shape preserved — see tests/fixtures/buyerPurchaseContract.ts
 * for the anonymisation rules. The multi-lot confirmation mirrors the buyer's
 * purchase contract fixture: the same trade seen from the seller's side,
 * issued four days earlier, with its own lot numbering.
 */

import {
  UneceAmountCurrency,
  UneceCountryId,
  UneceDeliveryTermsCodeList,
  UneceLocationFunctionCodeList,
  UnecePackageTypeCodeList,
  UnecePaymentTermsTypeCodeList,
  UneceTypes,
} from "@twin.org/standards-unece";
import type { ITradeAgreement } from "../../src/models/ITradeAgreement.js";
import type { ITradeItem } from "../../src/models/atoms/ITradeItem.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";

/**
 * Build one contracted lot, populating every column of the buyer's contract table.
 * @param lineId The lot reference: `Contract No` "81140" on the buyer's paper, "ctr/519" on the seller's.
 * @param mark The coffee mark or estate, the first token of `Quality`.
 * @param grade The coffee grade, the last token of `Quality`.
 * @param bags The `Quantity` column, a number of bags.
 * @param unitPrice The `Price` column, per 50 kg, in US dollars.
 * @returns The trade item.
 */
export function buildLot(
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
    identifier: lineId,
    specifiedTradeProduct: [
      {
        "@context": TradeDocumentContexts.Context,
        type: UneceTypes.TradeProduct,
        // `Quality`
        description: `${mark},${grade}`,
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
        "@context": TradeDocumentContexts.Context,
        type: UneceTypes.LineTradeDelivery,
        // `Quantity`
        orderQuantity: {
          "@context": TradeDocumentContexts.Context,
          type: UneceTypes.QuantityType,
          QuantityTypeValue: bags,
        },
        // `Kg per Unit`. The unit itself has no home: IUneceQuantityCode
        // declares no value property, so "KGM" cannot be attached.
        perPackageUnitQuantity: {
          "@context": TradeDocumentContexts.Context,
          type: UneceTypes.QuantityType,
          QuantityTypeValue: "60",
        },
        // `Unit Type`. GrainPro is a hermetic liner brand, not a UN/CEFACT
        // package type, so the code says Bag and the brand goes in description.
        includedPackaging: [
          {
            "@context": TradeDocumentContexts.Context,
            type: UneceTypes.SupplyChainPackaging,
            packageTypeCode: UnecePackageTypeCodeList.Bag,
            description: "Grain Pro",
          },
        ],
      },
    ],
    specifiedLineTradeAgreement: {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.LineTradeAgreement,
      agreedPriceProductPrice: [
        {
          "@context": TradeDocumentContexts.Context,
          type: UneceTypes.TradePrice,
          unitAmount: [
            {
              "@context": TradeDocumentContexts.Context,
              type: UneceTypes.AmountType,
              AmountTypeValue: unitPrice,
              AmountTypeCurrency: UneceAmountCurrency.USDollar,
            },
          ],
          basisQuantity: {
            "@context": TradeDocumentContexts.Context,
            type: UneceTypes.QuantityType,
            QuantityTypeValue: "50",
          },
        },
      ],
    },
  };
}

/**
 * The seller's sale confirmation, Kilimo to Northgate, ref S - KET / 519-521.
 * `.context/Document Samples/01-Sale Confirmation(s)/Seller_s Sale Confirmation (Northgate).pdf`
 */
export const SALE_CONFIRMATION: ITradeAgreement = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeAgreement,
  issueDateTime: {
    "@context": TradeDocumentContexts.Context,
    type: TradeDocumentTypes.Date,
    DateValue: "2025-03-10T00:00:00.000Z",
  },
  // "We hereby confirm having sold on ..." — the date the sale was struck
  saleDate: {
    "@context": TradeDocumentContexts.Context,
    type: TradeDocumentTypes.Date,
    DateValue: "2025-03-10T00:00:00.000Z",
  },
  sellerReference: "S - KET / 519-521",
  buyerReference: "TBA",
  buyerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Northgate Coffee Importers Ltd.",
  },
  sellerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Kilimo Estates Traders Co. Ltd.",
  },
  includedSupplyChainTradeLineItem: [
    buildLot("ctr/519", "Mwitu", "AB", "180", "275.00"),
    buildLot("ctr/520", "Tamu", "PB", "45", "281.00"),
    buildLot("ctr/521", "Miti Kanjuu", "AA", "65", "302.00"),
  ],
  applicableDeliveryTerms: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.DeliveryTerms,
    deliveryTermsDeliveryTypeCode: UneceDeliveryTermsCodeList.FreeOnBoard,
    relevantLocation: { type: UneceTypes.TradeLocation, name: "origin" },
  },
  applicableLocation: [
    {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.LogisticsLocation,
      name: "Southampton",
      countryName: "United Kingdom",
      logisticsLocationCountryId: UneceCountryId.UNITEDKINGDOMOFGREATBRITAINANDNORTHERNIRELAND,
      locationFunctionTypeCode: [UneceLocationFunctionCodeList.PlaceOfDelivery],
    },
  ],
  applicablePaymentTerms: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.PaymentTerms,
    paymentTermsTypeCode: [UnecePaymentTermsTypeCodeList.CashAgainstDocuments],
    description: "Net Cash against Documents.",
  },
};

/**
 * The seller's sale confirmation, Kilimo to Alpina Trading, ref S - KET / 566.
 * A single lot contract. The document has no line table: it states its one
 * lot in prose, "320 bags of 60 kg net, Kenya Washed AA FAQ at USD 388/50 KGS
 * FOB". Modelled as a single line item, since every fact a line needs is
 * present.
 * `.context/Document Samples/01-Sale Confirmation(s)/Seller_s Sale Confirmation (Alpina Trading)_.webp`
 */
export const SALE_CONFIRMATION_SINGLE_LOT: ITradeAgreement = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeAgreement,
  issueDateTime: {
    "@context": TradeDocumentContexts.Context,
    type: TradeDocumentTypes.Date,
    DateValue: "2025-08-22T00:00:00.000Z",
  },
  // "We hereby confirm having sold on ..." — the date the sale was struck
  saleDate: {
    "@context": TradeDocumentContexts.Context,
    type: TradeDocumentTypes.Date,
    DateValue: "2025-08-22T00:00:00.000Z",
  },
  sellerReference: "S - KET / 566",
  buyerReference: "TBA",
  buyerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Alpina Kaffee AG.",
  },
  sellerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Kilimo Estates Traders Co. Ltd.",
  },
  includedSupplyChainTradeLineItem: [buildLot("S - KET / 566", "Kenya Washed", "AA FAQ", "320", "388.00")],
  applicableDeliveryTerms: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.DeliveryTerms,
    deliveryTermsDeliveryTypeCode: UneceDeliveryTermsCodeList.FreeOnBoard,
    relevantLocation: { type: UneceTypes.TradeLocation, name: "origin" },
  },
  applicableLocation: [
    {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.LogisticsLocation,
      name: "Antwerp",
      countryName: "Belgium",
      logisticsLocationCountryId: UneceCountryId.BELGIUM,
      locationFunctionTypeCode: [UneceLocationFunctionCodeList.PlaceOfDelivery],
    },
  ],
  applicablePaymentTerms: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.PaymentTerms,
    paymentTermsTypeCode: [UnecePaymentTermsTypeCodeList.CashAgainstDocuments],
    description: "Net Cash against Documents",
  },
};

