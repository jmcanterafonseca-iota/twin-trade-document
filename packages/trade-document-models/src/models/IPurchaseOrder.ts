// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceHeaderTradeAgreement, IUneceNote } from "@twin.org/standards-unece";
import { ITradeItem } from "./ITradeItem.js";
import { ITradeParty } from "./ITradeParty.js";

/**
 * A buyer issued purchase contract, also called a purchase order.
 *
 * Structurally this is the same UN/CEFACT class as {@link ITradeAgreement}:
 * the buyer's purchase contract and the seller's sale confirmation are mirror
 * images of one trade, issued days apart, each stamped and signed by both
 * parties. Only the issuing side differs.
 *
 * The mandatory set is the required set of the UN/CEFACT Verifiable Trade
 * Documents purchase order (https://unvtd.unece.org/purchase-order-schema.yaml),
 * translated into the D23B terms its own context expands those wire names into:
 *
 * | UNVTD `credentialSubject` (required) | here | mandatory |
 * | --- | --- | --- |
 * | `purchaseOrderNumber` → `unece:identifier` | `identifier` | **no** — see below |
 * | `orderDate` → `unece:issueDateTime` | `issueDateTime` | yes |
 * | `buyer` → `unece:buyerParty` | `buyerParty` | yes |
 * | `seller` → `unece:sellerParty` | `sellerParty` | yes |
 * | `deliveryLocation` | `applicableLocation` | yes |
 * | `orderedItems` → `unece:includedSupplyChainTradeLineItem` | `includedSupplyChainTradeLineItem` | yes |
 *
 * `identifier` is the one departure, and it is deliberate. UNVTD requires a
 * single header-level order number, but a real buyer's contract may number each
 * line and carry none at document level — the Northgate sample does
 * exactly that. Making it mandatory would force a value that appears nowhere on
 * the paper. Representing the real documents without inventing data outranks
 * matching the published required set, so `identifier` stays optional and is
 * left absent when the document has none.
 *
 * UNVTD maps `deliveryLocation` onto `unece:shipToParty`, which is a Party class
 * on the delivery facet and is not reachable from a header trade agreement. A
 * delivery address is a place, not a party, so `applicableLocation` is used
 * instead, with `locationFunctionTypeCode` set to
 * `UneceLocationFunctionCodeList.PlaceOfDelivery`.
 *
 * Everything the sample purchase contract states beyond the required set is
 * inherited from the base and needs no local declaration: the `Basis` line goes
 * in `applicableDeliveryTerms` (Incoterm in `deliveryTermsDeliveryTypeCode`,
 * the rest in `description`), `Shipment Month` in `shippingPeriod`, `Payment` in
 * `applicablePaymentTerms`, `Conditions` in `purchaseConditionsDocument`, the
 * European Standard Contract for Coffee in `contractDocument`, and
 * `EUDR Compliant` in `applicableRegulatoryProcedure`.
 *
 * See docs/model-guide.md §6 for the measured UNVTD coverage of the sample
 * document, and for the four UNVTD required properties a paper contract cannot
 * honestly supply.
 */
export type IPurchaseOrder = IUneceHeaderTradeAgreement &
  Required<Pick<IUneceHeaderTradeAgreement, "@context" | "type" | "applicableLocation">> & {
    /**
     * The date, time or date time the order was issued.
     * UN/CEFACT declares issueDateTime on SupplyChainTradeTransaction and on
     * Document, not on HeaderTradeAgreement, which carries no date of its own;
     * the UNVTD purchase order context makes the same choice for `orderDate`.
     * @see https://vocabulary.uncefact.org/issueDateTime
     * @json-schema format:date-time
     */
    issueDateTime: string;

    /**
     * The buyer party placing this order.
     */
    buyerParty: ITradeParty;

    /**
     * The seller party the order is placed with.
     */
    sellerParty: ITradeParty;

    /**
     * An ordered lot within this purchase order.
     *
     * Mandatory, and at least one: UNVTD requires `orderedItems` with
     * `minItems: 1`, and a purchase contract with no lines states nothing.
     * Each column of the sample contract's table maps as follows, all of it on
     * {@link ITradeItem}:
     *
     * | column | path |
     * | --- | --- |
     * | `Contract No` | `associatedDocumentLineDocument.lineId` |
     * | `Origin` | `specifiedTradeProduct[].originCountry[].countryId` |
     * | `Quality` | `specifiedTradeProduct[].name` and `.designation` |
     * | `Quantity` | `specifiedLineTradeDelivery[].orderQuantity` |
     * | `Unit Type` | `specifiedLineTradeDelivery[].includedPackaging[].packageTypeCode` and `.description` |
     * | `Kg per Unit` | `specifiedLineTradeDelivery[].perPackageUnitQuantity` |
     * | `Price` | `specifiedLineTradeAgreement.agreedPriceProductPrice[].unitAmount[].AmountTypeValue` |
     * | `Units` | `.unitAmount[].AmountTypeCurrency` and `.basisQuantity` for the per 50 kg basis |
     *
     * @see https://vocabulary.uncefact.org/includedSupplyChainTradeLineItem
     */
    includedSupplyChainTradeLineItem: ITradeItem[];

    /**
     * A note on this order, discriminated by its `subject` or `noteSubjectCode`.
     *
     * HeaderTradeAgreement is a pure association hub: of its 69 properties only
     * three carry free text, so contractual prose has nowhere to go. UN/CEFACT
     * declares `includedNote` on Document and the same shape appears as
     * `additionalInformationNote` on SupplyChainTradeLineItem,
     * `informationNote` on LineTradeDelivery and `statementNote` on
     * RegulatoryProcedure, so the term is lifted here rather than invented.
     *
     * It is the home of the sample contract's prose that D23B has no typed slot
     * for: the insurance allocation, the vessel nomination undertaking, the
     * precedence rule between term sets, the arbitration forum and the
     * countersignature instruction.
     * @see https://vocabulary.uncefact.org/includedNote
     */
    includedNote?: IUneceNote[];
  };
