// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { ILocation } from "../entities/ILocation.js";
import type { IParty } from "../entities/IParty.js";
import type { TradeDocumentContexts } from "../tradeDocumentContexts.js";
import type { TradeDocumentTypes } from "../tradeDocumentTypes.js";
import type { IConsignmentItem } from "../entities/IConsignmentItem.js";
import type { IMeasure } from "../valueObjects/IMeasure.js";
import type { IMonetaryAmount } from "../valueObjects/IMonetaryAmount.js";

/**
 * A bill of lading: a document issued by a carrier evidencing a transport
 * contract and the receipt of goods for shipment. First version, aligned to
 * the UNVTD bill of lading credential subject
 * (https://unvtd.unece.org/bill-of-lading-schema.yaml)
 */
export interface IBillOfLading {
	/**
	 * Context
	 */
	"@context": typeof TradeDocumentContexts.BillOfLadingContext;

	/**
	 * Type
	 */
	type: typeof TradeDocumentTypes.BillOfLading;

	/**
	 * The bill of lading number, identifying the transport contract
	 * x-json-ld-property: https://vocabulary.uncefact.org/identifier
	 */
	billOfLadingNumber: string;

	/**
	 * A further reference identifying this specific document, when it
	 * differs from the bill of lading number (UNVTD `documentIdentifier`).
	 */
	documentIdentifier?: string;

	/**
	 * The booking reference assigned by the carrier to the consignment
	 */
	bookingReferenceNumber?: string;

	/**
	 * The date the bill of lading was issued (UNVTD `issueDate`).
	 * @json-schema format:date-time
	 */
	issueDate: string;

	/**
	 * The date the consignment was loaded onto the means of transport
	 * @json-schema format:date-time
	 */
	consignmentLoadingDate?: string;

	/**
	 * The scheduled departure of the means of transport
	 * @json-schema format:date-time
	 */
	estimatedTimeOfDeparture?: string;

	/**
	 * The estimated arrival of the means of transport
	 * @json-schema format:date-time
	 */
	estimatedTimeOfArrival?: string;

	/**
	 * The party consigning the goods as stipulated in the transport
	 */
	consignor: IParty;

	/**
	 * The party to which the goods are consigned (UNVTD `consignee`).
	 */
	consignee: IParty;

	/**
	 * The party providing the transport of the goods between named points
	 */
	carrier: IParty;

	/**
	 * The party to be notified of the shipment (UNVTD `notifyParty`).
	 */
	notifyParty?: IParty;

	/**
	 * The party responsible for paying the freight charges
	 */
	freightPayer?: IParty;

	/**
	 * The location where the goods were loaded onto the means of
	 */
	loadingLocation: ILocation;

	/**
	 * The place or port at which the cargo is discharged
	 */
	unloadingLocation: ILocation;

	/**
	 * The location to which the consignment is delivered to the final
	 */
	finalDestinationLocation?: ILocation;

	/**
	 * The port from which the means of transport departs
	 */
	departureLocation?: ILocation;

	/**
	 * The port at which the means of transport arrives
	 */
	arrivalLocation?: ILocation;

	/**
	 * The place where the freight payment has been or is to be made
	 */
	paymentLocation?: ILocation;

	/**
	 * The location where the document was issued.
	 */
	issueLocation?: ILocation;

	/**
	 * The journey identifier of the means of transport, such as the
	 * voyage number
	 */
	conveyanceReferenceNumber?: string;

	/**
	 * The name of the means of transport, such as the vessel name.
	 */
	transportMeansIdentifier?: string;

	/**
	 * The registration of the means of transport, such as the IMO number
	 *
	 */
	transportMeansRegistration?: string;

	/**
	 * The code for the size and type of the transport equipment
	 *
	 */
	containerSizeAndType?: string;

	/**
	 * The code specifying how full the transport equipment is, e.g. `5`
	 * for full.
	 */
	fullOrEmptyContainer?: string;

	/**
	 * The identifier of the transport equipment, such as the container
	 * number .
	 */
	transportEquipmentIdentifier?: string;

	/**
	 * The identification number of the seal affixed to the transport
	 * equipment.
	 */
	sealIdentifier?: string;

	/**
	 * The total gross weight of the consignment including packaging
	 * (UNVTD `grossWeight`).
	 */
	grossWeightMeasure?: IMeasure;

	/**
	 * The total volume of the consignment (UNVTD `volume`).
	 */
	grossVolumeMeasure?: IMeasure;

	/**
	 * The total number of packages (UNVTD `numberOfPackages`).
	 */
	packageQuantity?: number;

	/**
	 * The plain language description of the goods
	 * (UNVTD `descriptionOfGoods`).
	 */
	description?: string;

	/**
	 * The summary description of the consignment
	 */
	summaryDescription?: string;

	/**
	 * The marks and numbers on the transport units or packages
	 */
	physicalShippingMarks?: string;

	/**
	 * The reference to the carrier's conditions of carriage
	 */
	termsAndConditionsDescription?: string;

	/**
	 * The charges paid in advance (UNVTD `prepaidAmount`).
	 */
	prepaidAmount?: IMonetaryAmount;

	/**
	 * The charges to be collected from the consignee
	 */
	collectChargeAmount?: IMonetaryAmount;

	/**
	 * The identifier of the underlying trade contract
	 */
	contractNumber?: string;

	/**
	 * The unique consignment reference (UNVTD `ucr`).
	 */
	ucr?: string;

	/**
	 * The goods covered by the bill of lading (UNVTD `goods`).
	 */
	goods?: IConsignmentItem[];
}
