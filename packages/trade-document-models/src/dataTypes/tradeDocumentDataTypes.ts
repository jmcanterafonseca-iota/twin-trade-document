// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { DataTypeHelper } from "@twin.org/data-core";
import { TradeDocumentContexts } from "../models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../models/tradeDocumentTypes.js";

import BasisSchema from "../schemas/Basis.json" with { type: "json" };
import ConditionsSchema from "../schemas/Conditions.json" with { type: "json" };
import InsuranceSchema from "../schemas/Insurance.json" with { type: "json" };
import AllowanceChargeSchema from "../schemas/AllowanceCharge.json" with { type: "json" };
import AmountSchema from "../schemas/Amount.json" with { type: "json" };
import DeliveryTermsSchema from "../schemas/DeliveryTerms.json" with { type: "json" };
import LocationSchema from "../schemas/Location.json" with { type: "json" };
import NoteSchema from "../schemas/Note.json" with { type: "json" };
import PaymentMeansSchema from "../schemas/PaymentMeans.json" with { type: "json" };
import PaymentTermsSchema from "../schemas/PaymentTerms.json" with { type: "json" };
import PurchaseOrderSchema from "../schemas/PurchaseOrder.json" with { type: "json" };
import ReferencedDocumentSchema from "../schemas/ReferencedDocument.json" with { type: "json" };
import TradeAgreementSchema from "../schemas/TradeAgreement.json" with { type: "json" };
import TradeDeliverySchema from "../schemas/TradeDelivery.json" with { type: "json" };
import TradeItemSchema from "../schemas/TradeItem.json" with { type: "json" };
import TradePartySchema from "../schemas/TradeParty.json" with { type: "json" };

/**
 * Handle all the data types for trade documents.
 */
export class TradeDocumentDataTypes {
  /**
   * Register all the data types.
   * Call `UneceDataTypes.registerTypes()` first, otherwise every UN/CEFACT
   * `$ref` is fetched over HTTP on first validation.
   */
  public static registerTypes(): void {
    const types = [
      { type: TradeDocumentTypes.TradeAgreement, schema: TradeAgreementSchema },
      { type: TradeDocumentTypes.PurchaseOrder, schema: PurchaseOrderSchema },
      { type: TradeDocumentTypes.TradeParty, schema: TradePartySchema },
      { type: TradeDocumentTypes.TradeItem, schema: TradeItemSchema },
      { type: TradeDocumentTypes.Location, schema: LocationSchema },
      { type: TradeDocumentTypes.Amount, schema: AmountSchema },
      { type: TradeDocumentTypes.PaymentTerms, schema: PaymentTermsSchema },
      { type: TradeDocumentTypes.PaymentMeans, schema: PaymentMeansSchema },
      { type: TradeDocumentTypes.AllowanceCharge, schema: AllowanceChargeSchema },
      { type: TradeDocumentTypes.Note, schema: NoteSchema },
      { type: TradeDocumentTypes.TradeDelivery, schema: TradeDeliverySchema },
      { type: TradeDocumentTypes.DeliveryTerms, schema: DeliveryTermsSchema },
      { type: TradeDocumentTypes.ReferencedDocument, schema: ReferencedDocumentSchema },
      { type: TradeDocumentTypes.Basis, schema: BasisSchema },
      { type: TradeDocumentTypes.Insurance, schema: InsuranceSchema },
      { type: TradeDocumentTypes.Conditions, schema: ConditionsSchema },
    ];

    DataTypeHelper.registerTypes(
      TradeDocumentContexts.Namespace,
      TradeDocumentContexts.Context,
      types,
    );
  }
}
