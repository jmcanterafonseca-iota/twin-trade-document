// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

/**
 * A commercial invoice, transcribed in full.
 *
 * Source: `.context/Document Samples/04-Commercial Invoice(s)/Commercial Invoice.pdf`,
 * which is gitignored and stays out of the repository.
 *
 * **The values here are anonymised.** Parties, addresses, references, bank
 * details, prices and dates are fictional; industry boilerplate is not. The
 * shape of every value reproduces the original exactly, including:
 * - the seller's name printed THREE ways on one page — letterhead
 *   `... Co. Ltd`, signature line `... LIMITED`, stamp and account `... LTD`;
 * - the notify row's casing mismatch against the address block;
 * - a 14-digit account number with a leading zero;
 * - **two different money figures on one invoice**: the stated value and a
 *   lower round-thousands transfer request. A real contradiction on the page,
 *   carried in `totalInvoiceAmount` and `duePayableAmount`, never reconciled;
 * - weights in kgs whose unit cannot be attached (IUneceMeasureCode declares
 *   no value property).
 *
 * The page carries 46 atomic facts: 7 page furniture (logo, cherry photo,
 * green rule, row labels, punch holes, a stray pen stroke, the cut-off footer
 * edge) and 39 data bearing, every one transcribed below with its fact id.
 */

import {
  UneceAmountCurrency,
  UneceCountryId,
  UneceLocationFunctionCodeList,
  UneceTypes,
} from "@twin.org/standards-unece";
import type { ICommercialInvoice } from "../../src/models/ICommercialInvoice.js";
import { TradeDocumentContexts } from "../../src/models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../../src/models/tradeDocumentTypes.js";

/**
 * The complete document. Fact ids refer to the inventory in
 * docs/model-guide.md section 9.
 */
export const COMMERCIAL_INVOICE: ICommercialInvoice = {
  "@context": TradeDocumentContexts.Context,
  type: UneceTypes.HeaderTradeSettlement,

  // 3 `Our Ctr Ref: S - KET / 620`
  invoiceIssuerReference: "S - KET / 620",

  // 5 `Your Ctr Ref: 118254` — the payer's own contract reference
  payerReference: "118254",

  // 11 the document's own heading, `INVOICE FOR SALE REF: S - KET / 620`.
  // Same value as fact 3: the page prints the reference twice.
  invoiceNumber: "S - KET / 620",

  // 4 `November 7th , 2025`
  issueDateTime: {
    "@context": TradeDocumentContexts.Context,
    type: TradeDocumentTypes.Date,
    DateValue: "2025-11-07T00:00:00.000Z",
  },

  // 2 letterhead `Kilimo Estates Traders Co. Ltd`; 35-41 the signature block,
  // stamp and manuscript signature. The stamp address is 39/40.
  invoicerParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Kilimo Estates Traders Co. Ltd", // 2, as printed on the letterhead
    postalAddress: {
      type: UneceTypes.TradeAddress,
      postOfficeBox: "41207", // 39
      postcodeCode: "00240", // 39
      cityName: "NAIROBI", // 40
      countryName: "KENYA", // 40
      tradeAddressCountryId: UneceCountryId.KENYA,
    },
    // 35 `DIRECTOR`, 36 signature line `KILIMO ESTATES TRADERS LIMITED`,
    // 37 stamped `KILIMO ESTATES TRADERS LTD.`, 38 the stamp date (day of
    // month illegible in the scan — low confidence), 41 the manuscript
    // signature, recorded by this object existing.
    confirmedAuthentication: [
      {
        type: UneceTypes.Authentication,
        signatory: "KILIMO ESTATES TRADERS LTD.", // 37, the name as stamped
        actualDateTime: "2025-11-07T00:00:00.000Z", // 38
        information: "DIRECTOR", // 35
        statement: "KILIMO ESTATES TRADERS LIMITED", // 36, the signature line
      },
    ],
  },

  // 6-10 the addressee block
  invoiceeParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Alpina Kaffee AG", // 6
    postalAddress: {
      type: UneceTypes.TradeAddress,
      streetName: "Bahnhofplatz 9", // 7
      postcodeCode: "CH-3007", // 8
      cityName: "Bern", // 9
      countryName: "SWITZERLAND", // 10
      tradeAddressCountryId: UneceCountryId.SWITZERLAND,
    },
  },

  // 13/14 `NOTIFY PARTY: Alpina kaffee AG. Switzerland` — note the lowercase
  // `kaffee`, a real casing mismatch against the address block, preserved.
  notifyParty: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradeParty,
    name: "Alpina kaffee AG.", // 13
    postalAddress: {
      type: UneceTypes.TradeAddress,
      countryName: "Switzerland", // 14
      tradeAddressCountryId: UneceCountryId.SWITZERLAND,
    },
  },

  // 12 the goods row, 23 the grade from the sales value row
  specifiedTradeProduct: [
    {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.TradeProduct,
      description: "WASHED KENYA ARABICA COFFEE", // 12
      designation: "AB FAQ", // 23
    },
  ],

  // 15 the quality row — on this sample the same string as the goods row
  quality: {
    "@context": TradeDocumentContexts.Context,
    type: TradeDocumentTypes.Quality,
    QualityValue: "WASHED KENYA ARABICA COFFEE",
  },

  // 16 `320 BAGS (THREE HUNDRED AND TWENTY ONLY)` — the parenthetical spells
  // out the same number and is carried by this same fact. The unit "BAGS"
  // cannot be attached: IUneceQuantityCode declares no value property.
  packageQuantity: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.QuantityType,
    QuantityTypeValue: "320",
  },

  // includedPackaging is ABSENT on purpose: this sample never states what the
  // bags are made of. Nothing is derived.

  // 17/18 `DESTINATION: ANTWERP – BELGIUM.`
  finalDestinationLocation: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.LogisticsLocation,
    name: "ANTWERP", // 17
    countryName: "BELGIUM", // 18
    logisticsLocationCountryId: UneceCountryId.BELGIUM,
    locationFunctionTypeCode: [UneceLocationFunctionCodeList.PlaceOfDelivery],
  },

  // 19/20/21 the three weights, in kgs. The unit has no home (IUneceMeasureCode
  // is an empty shell), so only the values are carried.
  grossWeightMeasure: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.MeasureType,
    MeasureTypeValue: "19488.00", // 19
    MeasureTypeCode: { type: UneceTypes.MeasureCode },
  },
  tareWeightMeasure: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.MeasureType,
    MeasureTypeValue: "288.00", // 20
    MeasureTypeCode: { type: UneceTypes.MeasureCode },
  },
  netWeightMeasure: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.MeasureType,
    MeasureTypeValue: "19200.00", // 21
    MeasureTypeCode: { type: UneceTypes.MeasureCode },
  },

  // 22 restates `320 BAGS` on the sales value row — same value, second
  // occurrence, carried by packageQuantity above.
  // 24/25 `PRICE USD $376.00/50 kilos.`
  price: {
    "@context": TradeDocumentContexts.Context,
    type: UneceTypes.TradePrice,
    unitAmount: [
      {
        "@context": TradeDocumentContexts.Context,
        type: UneceTypes.AmountType,
        AmountTypeValue: "376.00", // 24
        AmountTypeCurrency: UneceAmountCurrency.USDollar,
      },
    ],
    basisQuantity: {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.QuantityType,
      QuantityTypeValue: "50", // 25
    },
  },

  // 26 `VALUE USD 144,384.00`
  totalInvoiceAmount: [
    {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.AmountType,
      AmountTypeValue: "144384.00",
      AmountTypeCurrency: UneceAmountCurrency.USDollar,
    },
  ],

  // 27 `PLEASE TRANSFER USD $ 144,000.00 TO:` — the page asks for a DIFFERENT,
  // lower, round-thousands amount than the stated value. A real contradiction,
  // carried as printed and not reconciled.
  duePayableAmount: [
    {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.AmountType,
      AmountTypeValue: "144000.00",
      AmountTypeCurrency: UneceAmountCurrency.USDollar,
    },
  ],

  // payeeParty is ABSENT on purpose: unlike the second sample, this page names
  // no payee line — payment goes to the bank account below.

  // 28-34 the bank block
  specifiedPaymentMeans: [
    {
      "@context": TradeDocumentContexts.Context,
      type: UneceTypes.PaymentMeans,
      payeePartyFinancialAccount: [
        {
          type: UneceTypes.CreditorFinancialAccount,
          accountName: "KILIMO ESTATES TRADERS LTD", // 29
          proprietaryId: "03204175830012", // 30 — 14 digits, leading zero
        },
      ],
      payeeSpecifiedFinancialInstitution: {
        type: UneceTypes.CreditorFinancialInstitution,
        name: "SAVANNAH COMMERCIAL BANK OF KENYA", // 28
        bICId: "SVCBKENA", // 34
        additionalClearingSystemId: "14000", // 31 `Bank Code`
        subDivisionFinancialInstitution: {
          type: UneceTypes.BranchFinancialInstitution,
          identifier: "14027", // 32 `Branch Number`
          name: "MASHARIKI", // 33 `Branch Name`
        },
      },
    },
  ],
};
