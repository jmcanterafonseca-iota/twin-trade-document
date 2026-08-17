// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeSettlement } from "@twin.org/standards-unece";
import { ILocation } from "./ILocation.js";
import { IMeasure } from "./atoms/IMeasure.js";
import { IProduct } from "./IProduct.js";
import { IQuantity } from "./atoms/IQuantity.js";
import { ITradeParty } from "./ITradeParty.js";
import { IProductPackage } from "./atoms/IProductPackage.js";
import { IMonetaryAmount } from "./atoms/IMonetaryAmount.js";

/**
 * A commercial invoice: an itemized account of goods delivered together with a
 * demand for payment. Based on HeaderTradeSettlement, the UN/CEFACT settlement
 * facet, which natively carries the invoicer, the invoicee, the amounts and the
 * payment means. Aligned to the UNVTD commercial invoice
 * (https://unvtd.unece.org/docs/commercial-invoice/), which assigns the
 * document no UN/CEFACT class of its own.
 * See docs/model-guide.md §9 for the property mapping.
 */
export type ICommercialInvoice = IUneceHeaderTradeSettlement &
  Required<
    Pick<
      IUneceHeaderTradeSettlement,
      "@context" | "type" | "invoiceIssuerReference" | "payerReference"
    >
  > & {
    /**
     * The invoice number, as printed in the document's own heading.
     * UNVTD `invoiceNumber`.
     */
    invoiceNumber: string;

    /**
     * The date the invoice was issued. UNVTD `invoiceDate`.
     * @see https://vocabulary.uncefact.org/issueDateTime
     * @json-schema format:date-time
     */
    issueDateTime: string;

    /**
     * The party issuing the invoice and to be paid.
     */
    invoicerParty: ITradeParty;

    /**
     * The party the invoice is addressed to.
     */
    invoiceeParty: ITradeParty;

    /**
     * The party to be notified of the shipment. UN/CEFACT declares no
     * notify-party property on any settlement or agreement class.
     */
    notifyParty: ITradeParty;

    /**
     * The goods being invoiced: `description` carries the goods row verbatim,
     * `designation` the grade when the document states one.
     * @see https://vocabulary.uncefact.org/specifiedTradeProduct
     */
    specifiedTradeProduct: IProduct[];

    /**
     * The number of packages invoiced, such as the total number of bags.
     * @see https://vocabulary.uncefact.org/packageQuantity
     */
    packageQuantity: IQuantity;

    /**
     * How the goods are packed, when the document states it.
     * @see https://vocabulary.uncefact.org/includedPackaging
     */
    includedPackaging?: IProductPackage[];

    /**
     * The destination of the goods.
     * @see https://vocabulary.uncefact.org/finalDestinationLocation
     */
    finalDestinationLocation: ILocation;

    /**
     * The gross weight of the consignment.
     * @see https://vocabulary.uncefact.org/grossWeightMeasure
     */
    grossWeightMeasure: IMeasure;

    /**
     * The tare weight of the consignment.
     * @see https://vocabulary.uncefact.org/tareWeightMeasure
     */
    tareWeightMeasure: IMeasure;

    /**
     * The net weight of the consignment.
     * @see https://vocabulary.uncefact.org/netWeightMeasure
     */
    netWeightMeasure: IMeasure;

    /**
     * The unit price and the quantity it is quoted against.
     */
    price: IMonetaryAmount;

    /**
     * The total value of the invoice, as printed.
     */
    totalInvoiceAmount: IMonetaryAmount[];

    /**
     * The amount the invoicee is asked to pay. Kept separate from
     * `totalInvoiceAmount`: a real invoice can print two different figures.
     */
    duePayableAmount: IMonetaryAmount[];

    /**
     * The party payment is due to, when the document names one.
     */
    payeeParty?: ITradeParty[];

    /**
     * The bank details for payment: institution, account, branch and codes.
     */
    // specifiedPaymentMeans: IPaymentMeans[];

  };
