// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { DataTypeHelper } from "@twin.org/data-core";
import { DocumentTypesFactory } from "./documentTypesFactory.js";
import { TradeDocumentContexts } from "../models/tradeDocumentContexts.js";
import { TradeDocumentTypes } from "../models/tradeDocumentTypes.js";

import AddressSchema from "../schemas/Address.json" with { type: "json" };
import AllowanceChargeSchema from "../schemas/AllowanceCharge.json" with { type: "json" };
import BillOfLadingSchema from "../schemas/BillOfLading.json" with { type: "json" };
import CommercialInvoiceSchema from "../schemas/CommercialInvoice.json" with { type: "json" };
import ConsignmentItemSchema from "../schemas/ConsignmentItem.json" with { type: "json" };
import DeliveryTermsSchema from "../schemas/DeliveryTerms.json" with { type: "json" };
import LocationSchema from "../schemas/Location.json" with { type: "json" };
import MeasureSchema from "../schemas/Measure.json" with { type: "json" };
import MonetaryAmountSchema from "../schemas/MonetaryAmount.json" with { type: "json" };
import PartySchema from "../schemas/Party.json" with { type: "json" };
import PaymentMeansSchema from "../schemas/PaymentMeans.json" with { type: "json" };
import PaymentTermsSchema from "../schemas/PaymentTerms.json" with { type: "json" };
import PeriodSchema from "../schemas/Period.json" with { type: "json" };
import ProductSchema from "../schemas/Product.json" with { type: "json" };
import ProductPackageSchema from "../schemas/ProductPackage.json" with { type: "json" };
import PurchaseOrderSchema from "../schemas/PurchaseOrder.json" with { type: "json" };
import SealSchema from "../schemas/Seal.json" with { type: "json" };
import TradeAgreementSchema from "../schemas/TradeAgreement.json" with { type: "json" };
import TradeItemSchema from "../schemas/TradeItem.json" with { type: "json" };
import TradePriceSchema from "../schemas/TradePrice.json" with { type: "json" };
import TransportEquipmentSchema from "../schemas/TransportEquipment.json" with { type: "json" };
import TransportPackageSchema from "../schemas/TransportPackage.json" with { type: "json" };

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
			{ type: TradeDocumentTypes.CommercialInvoice, schema: CommercialInvoiceSchema },
			{ type: TradeDocumentTypes.BillOfLading, schema: BillOfLadingSchema },
			{ type: TradeDocumentTypes.ConsignmentItem, schema: ConsignmentItemSchema },
			{ type: TradeDocumentTypes.TransportPackage, schema: TransportPackageSchema },
			{ type: TradeDocumentTypes.TransportEquipment, schema: TransportEquipmentSchema },
			{ type: TradeDocumentTypes.Party, schema: PartySchema },
			{ type: TradeDocumentTypes.TradeItem, schema: TradeItemSchema },
			{ type: TradeDocumentTypes.TradePrice, schema: TradePriceSchema },
			{ type: TradeDocumentTypes.Location, schema: LocationSchema },
			{ type: TradeDocumentTypes.Address, schema: AddressSchema },
			{ type: TradeDocumentTypes.MonetaryAmount, schema: MonetaryAmountSchema },
			{ type: TradeDocumentTypes.PaymentTerms, schema: PaymentTermsSchema },
			{ type: TradeDocumentTypes.PaymentMeans, schema: PaymentMeansSchema },
			{ type: TradeDocumentTypes.AllowanceCharge, schema: AllowanceChargeSchema },
			{ type: TradeDocumentTypes.DeliveryTerms, schema: DeliveryTermsSchema },
			{ type: TradeDocumentTypes.Measure, schema: MeasureSchema },
			{ type: TradeDocumentTypes.Period, schema: PeriodSchema },
			{ type: TradeDocumentTypes.ProductPackage, schema: ProductPackageSchema },
			{ type: TradeDocumentTypes.Product, schema: ProductSchema },
			{ type: TradeDocumentTypes.Seal, schema: SealSchema }
		];

		DataTypeHelper.registerTypes(
			TradeDocumentContexts.Namespace,
			TradeDocumentContexts.Context,
			types
		);

		// Register the document types so we can know which documents can be translated
		DocumentTypesFactory.register(TradeDocumentTypes.TradeAgreement, () => ({
			documentType: TradeDocumentTypes.TradeAgreement,
			jsonSchema: TradeAgreementSchema
		}));

		DocumentTypesFactory.register(TradeDocumentTypes.CommercialInvoice, () => ({
			documentType: TradeDocumentTypes.CommercialInvoice,
			jsonSchema: CommercialInvoiceSchema
		}));

		DocumentTypesFactory.register(TradeDocumentTypes.BillOfLading, () => ({
			documentType: TradeDocumentTypes.BillOfLading,
			jsonSchema: BillOfLadingSchema
		}));

		DocumentTypesFactory.register(TradeDocumentTypes.PurchaseOrder, () => ({
			documentType: TradeDocumentTypes.PurchaseOrder,
			jsonSchema: PurchaseOrderSchema
		}));
	}
}
