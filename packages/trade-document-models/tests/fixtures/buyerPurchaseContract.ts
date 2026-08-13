// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * The D.R. Wakefield buyer's purchase contract, transcribed in full.
 *
 * Source: `.context/Document Samples/02-Buyer Purchase Contract(s)/Buyer_s Purchase Contract.pdf`
 *
 * The page carries 106 atomic facts. 35 are page furniture — the logo, the
 * `EST.1970` strapline, the eight column captions, the seven terms labels, the
 * ruling, the empty EUDR box, scanner dust — and need no home in a schema.
 * The remaining 71 are data bearing, and every one of them is transcribed
 * below with its fact id in a comment, so the file doubles as the coverage
 * proof: if it compiles and validates, the fact is expressible.
 *
 * Facts that could not be given a typed UN/CEFACT slot are carried verbatim in
 * `includedNote`, each with a discriminating `subject`. They are called out
 * individually.
 */

import {
  UneceAmountCurrency,
  UneceCountryId,
  UneceDeliveryTermsCodeList,
  UneceDocumentCodeList,
  UneceLocationFunctionCodeList,
  UnecePackageTypeCodeList,
  UnecePartyRoleCodeList,
  UnecePaymentTermsTypeCodeList,
  UneceTypes,
} from "@twin.org/standards-unece";
import type { IPurchaseOrder } from "../../src/models/IPurchaseOrder.js";
import type { ITradeItem } from "../../src/models/ITradeItem.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";

/**
 * Build one row of the contract table. Facts 17-47, ten or eleven per row.
 * @param contractNo Fact 17/27/37 — the `Contract No` column.
 * @param mark Fact 19/29/39 — the first token of `Quality`.
 * @param grade Fact 20/30/41 — the grade token of `Quality`.
 * @param bags Fact 21/31/42 — the `Quantity` column.
 * @param price Fact 24/34/45 — the `Price` column.
 * @param factory Fact 40 — the washing station, present on row 3 only.
 * @returns The transcribed line.
 */
export function buildContractLine(
  contractNo: string,
  mark: string,
  grade: string,
  bags: string,
  price: string,
  factory?: string,
): ITradeItem {
  return {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.SupplyChainTradeLineItem,

    // 17/27/37 `Contract No`
    associatedDocumentLineDocument: {
      type: UneceTypes.DocumentLineDocument,
      lineId: contractNo,
    },

    specifiedTradeProduct: [
      {
        type: UneceTypes.TradeProduct,
        // 19/29/39 mark, 20/30/41 grade
        name: mark,
        designation: grade,
        // 40 `Thunguri`, the washing station, only on row 3
        ...(factory === undefined ? {} : { tradeName: factory }),
        // 18/28/38 `Origin`
        originCountry: [
          {
            type: UneceTypes.Country,
            countryId: UneceCountryId.KENYA,
            name: "Kenya",
          },
        ],
        applicableProductCharacteristic: [
          // 57 `0.5% franchise` — the claims tolerance on contracted weight
          {
            type: UneceTypes.ProductCharacteristic,
            description: "franchise",
            valueTolerance: [
              {
                type: UneceTypes.Tolerance,
                minusValuePercent: "0.5",
                surplusValuePercent: "0.5",
              },
            ],
          },
          // 58 `Actual Tare.` — tare deducted as actual, not standard
          {
            type: UneceTypes.ProductCharacteristic,
            description: "Tare",
            valueMethod: [
              {
                type: UneceTypes.SpecifiedMethod,
                name: "Actual Tare",
              },
            ],
          },
        ],
      },
    ],

    specifiedLineTradeDelivery: [
      {
        type: UneceTypes.LineTradeDelivery,
        // 21/31/42 `Quantity`
        orderQuantity: {
          type: UneceTypes.QuantityType,
          QuantityTypeValue: bags,
        },
        // 23/33/44 `Kg per Unit`. IUneceQuantityCode declares no value
        // property, so the "kg" itself cannot be attached — see model-guide 4.2.
        perPackageUnitQuantity: {
          type: UneceTypes.QuantityType,
          QuantityTypeValue: "60",
        },
        // 22/32/43 `Unit Type`. GrainPro is a hermetic liner brand, not a
        // UN/CEFACT package type, so the code says Bag and the brand is text.
        includedPackaging: [
          {
            type: UneceTypes.SupplyChainPackaging,
            packageTypeCode: UnecePackageTypeCodeList.Bag,
            description: "Grain Pro",
          },
        ],
        // 56 `N.S.W` — nett shipped weights govern settlement
        quantityCalculationMethodCode: "Nett Shipped Weights",
      },
    ],

    specifiedLineTradeAgreement: {
      type: UneceTypes.LineTradeAgreement,
      // 55 `FOB origin` repeated at line level, so each lot carries its term
      applicableDeliveryTerms: {
        type: UneceTypes.DeliveryTerms,
        deliveryTermsDeliveryTypeCode: UneceDeliveryTermsCodeList.FreeOnBoard,
        relevantLocation: {
          type: UneceTypes.TradeLocation,
          name: "origin",
        },
      },
      agreedPriceProductPrice: [
        {
          type: UneceTypes.TradePrice,
          // 24/34/45 `Price`, 25/35/46 `$`
          unitAmount: [
            {
              type: UneceTypes.AmountType,
              AmountTypeValue: price,
              AmountTypeCurrency: UneceAmountCurrency.USDollar,
            },
          ],
          // 26/36/47 `50kg` — the price basis, which is NOT the 60 kg packing unit
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
 * The complete document. Fact ids refer to the inventory in
 * docs/model-guide.md section 8.
 */
export const BUYER_PURCHASE_CONTRACT: IPurchaseOrder = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeAgreement,

  // 4 `10 September 2024`, top right. Fact 87, the stamp date, reads the same
  // and is carried separately on the seller's authentication.
  issueDateTime: "2024-09-10T00:00:00.000Z",

  // `identifier` is ABSENT on purpose. UNVTD requires a header level order
  // number, but this contract numbers each line (facts 17/27/37) and carries
  // none at document level. A range such as "46690-46692" appears nowhere on
  // the paper, so it is not written. Nothing is derived.

  // 2 `DRWakefield` (letterhead), 80-84 the faint footer address block.
  // partyRoleCode is ABSENT: the page carries no "Buyer" label, and the role
  // would have to be inferred from the letterhead position.
  buyerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "DR Wakefield Company Limited",
    postalAddress: {
      type: UneceTypes.TradeAddress,
      buildingName: "Thompson House", // 81
      cityName: "London", // 82
      postcodeCode: "SE1 0UQ", // 83 — low confidence in the source scan
      countryName: "United Kingdom", // 84
      tradeAddressCountryId: UneceCountryId.UNITEDKINGDOMOFGREATBRITAINANDNORTHERNIRELAND,
    },
  },

  // 7 typed `Jowam Coffee Trading Co Ltd`, 86 stamped `JOWAM COFFEE TRADERS LTD.`,
  // 88-91 the stamp address, 93 the signature, 95/96 the Exporter/Shipper caption
  sellerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Jowam Coffee Trading Co Ltd", // 7, as typed by the buyer
    // 95 `Exporter/Shipper` and 96 `Seller` are two captions on one block
    partyRoleCode: [UnecePartyRoleCodeList.Seller, UnecePartyRoleCodeList.Exporter],
    postalAddress: {
      type: UneceTypes.TradeAddress,
      postOfficeBox: "58513", // 88
      postcodeCode: "00200", // 89
      cityName: "NAIROBI", // 90
      countryName: "KENYA", // 91
      tradeAddressCountryId: UneceCountryId.KENYA,
    },
    // 86, 87, 93 — the rubber stamp and the manuscript signature that accept
    // the contract. Fact 93 is an illegible blue ballpoint scrawl: it has no
    // transcribable value, so its presence is recorded by this object existing
    // at all, not by prose about it. `signatoryImageBinaryObject` is where the
    // cropped signature would go if the pipeline extracted it.
    confirmedAuthentication: [
      {
        type: UneceTypes.Authentication,
        actualDateTime: "2024-09-10T00:00:00.000Z", // 87 `1 0 SEP 2024`
        signatory: "JOWAM COFFEE TRADERS LTD.", // 86, the name as stamped
      },
    ],
  },

  // 55 `FOB origin`, plus the parts of the Basis line that D23B has no slot for
  applicableDeliveryTerms: {
    type: UneceTypes.DeliveryTerms,
    deliveryTermsDeliveryTypeCode: UneceDeliveryTermsCodeList.FreeOnBoard,
    relevantLocation: {
      type: UneceTypes.TradeLocation,
      name: "origin",
    },
    description: "FOB origin, N.S.W, 0.5% franchise, Actual Tare.",
  },

  // 59 `November 2024`
  shippingPeriod: {
    type: UneceTypes.SpecifiedPeriod,
    name: "November 2024",
    startDateTime: "2024-11-01T00:00:00.000Z",
    endDateTime: "2024-11-30T23:59:59.999Z",
  },

  // 65 `Nett Cash Against Documentation`, 66 `on first presentation`
  applicablePaymentTerms: {
    type: UneceTypes.PaymentTerms,
    paymentTermsTypeCode: [UnecePaymentTermsTypeCodeList.CashAgainstDocuments], // 65
    paymentTermsEventTimeReferenceFromEventCode: "unece:TimeReferenceCodeList#71", // 66
    description: "Nett Cash Against Documentation on first presentation in London.",
  },

  applicableLocation: [
    // 60 `CWT`, 61 `Tilbury`, 62 `United Kingdom`
    {
      type: UneceTypes.LogisticsLocation,
      name: "Tilbury",
      description: "CWT",
      countryName: "United Kingdom",
      logisticsLocationCountryId: UneceCountryId.UNITEDKINGDOMOFGREATBRITAINANDNORTHERNIRELAND,
      locationFunctionTypeCode: [UneceLocationFunctionCodeList.PlaceOfDelivery],
    },
    // 67 `in London` — the place of presentation, discriminated by its function
    {
      type: UneceTypes.LogisticsLocation,
      name: "London",
      locationFunctionTypeCode: [UneceLocationFunctionCodeList.PlaceOfPayment],
    },
  ],

  // 71 `European Standard Contract for Coffee`, 72 `latest edition`
  contractDocument: [
    {
      type: UneceTypes.Document,
      name: "European Standard Contract for Coffee",
      versionId: "latest edition",
      documentTypeCode: UneceDocumentCodeList.Contract,
    },
  ],

  // 69 the sample condition, 73 the supplier code of conduct
  purchaseConditionsDocument: [
    {
      type: UneceTypes.Document,
      processCondition: "Subject to approval of preshipment sample by buyer.", // 69
    },
    {
      type: UneceTypes.Document,
      name: "D.R Wakefield suppliers code of conduct", // 73
    },
  ],

  // 70 `EUDR Compliant`
  applicableRegulatoryProcedure: [
    {
      type: UneceTypes.RegulatoryProcedure,
      categoryCode: "EUDR",
      certificationBasis: "EUDR Compliant",
    },
  ],

  // 64 `Shipping instructions to follow.`
  supplyInstructionDocument: [
    {
      type: UneceTypes.Document,
      remarks: "Shipping instructions to follow.",
    },
  ],

  // The prose D23B gives no typed slot for. Each note is discriminated by its
  // subject so a consumer can find it without parsing free text.
  includedNote: [
    {
      type: UneceTypes.Note,
      subject: "Trade direction",
      content: "We have bought the following coffee from you :", // 8
    },
    {
      type: UneceTypes.Note,
      subject: "Vessel nomination",
      content: "Buyer to nominate vessel.", // 63
    },
    {
      type: UneceTypes.Note,
      subject: "Insurance",
      content: "For buyer's account.", // 68
    },
    {
      type: UneceTypes.Note,
      subject: "Precedence",
      content:
        "and on the above particular conditions, which override all others", // 74
    },
    {
      type: UneceTypes.Note,
      subject: "Dispute resolution",
      content: "London Arbitration.", // 75
    },
    {
      type: UneceTypes.Note,
      subject: "Countersignature instruction",
      content: "Please sign and return.", // 94
    },
  ],

  // 17-47, three rows of ten or eleven facts
  includedSupplyChainTradeLineItem: [
    buildContractLine("46690", "Asali", "AB", "200", "290.00"),
    buildContractLine("46691", "Zawadi", "PB", "50", "296.00"),
    buildContractLine("46692", "Acacias", "AA", "70", "318.00", "Thunguri"),
  ],
};
