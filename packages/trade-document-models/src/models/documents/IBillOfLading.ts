// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import type { IConsignmentItem } from "../entities/IConsignmentItem.js";
import type { ILocation } from "../entities/ILocation.js";
import type { IParty } from "../entities/IParty.js";
import type { TradeDocumentContexts } from "../tradeDocumentContexts.js";
import type { TradeDocumentTypes } from "../tradeDocumentTypes.js";
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
	 * Reference number to identify a document evidencing a transport contract.
	 * x-json-ld-property: https://vocabulary.uncefact.org/identifier
	 */
	billOfLadingNumber: string;

	/**
	 * Reference number identifying a specific document.
	 */
	documentIdentifier?: string;

	/**
	 * Reference number assigned by a carrier to identify a specific
	 * consignment.
	 */
	bookingReferenceNumber?: string;

	/**
	 * Date that a document was issued.
	 * @json-schema format:date-time
	 */
	issueDate: string;

	/**
	 * Date when a consignment is loaded onto a means of transport.
	 * @json-schema format:date-time
	 */
	consignmentLoadingDate?: string;

	/**
	 * Date and time when a transport means is scheduled to depart.
	 * @json-schema format:date-time
	 */
	estimatedTimeOfDeparture?: string;

	/**
	 * Date and time of the estimated arrival of means of transport.
	 * @json-schema format:date-time
	 */
	estimatedTimeOfArrival?: string;

	/**
	 * Party consigning goods as stipulated in the transport contract.
	 * x-json-ld-property: https://vocabulary.uncefact.org/consignorParty
	 */
	consignor: IParty;

	/**
	 * Party to which goods are consigned.
	 * x-json-ld-property: https://vocabulary.uncefact.org/consigneeParty
	 */
	consignee: IParty;

	/**
	 * Party providing the transport of goods between named points.
	 * x-json-ld-property: https://vocabulary.uncefact.org/carrierParty
	 */
	carrier: IParty;

	/**
	 * Party to be notified.
	 * x-json-ld-property: https://vocabulary.uncefact.org/notifyParty
	 */
	notifyParty?: IParty;

	/**
	 * Party responsible for the payment of freight charges.
	 */
	freightPayer?: IParty;

	/**
	 * Location where the goods were first loaded onto the means of transport.
	 */
	originalLoadingLocation: ILocation;

	/**
	 * The place or port at which the cargo is discharged.
	 */
	baseportUnloadingLocation: ILocation;

	/**
	 * Location to which a consignment is to be delivered to the final
	 * consignee.
	 */
	deliveryLocation?: ILocation;

	/**
	 * Port from which a means of transport is scheduled to depart.
	 */
	placeOfDeparture?: ILocation;

	/**
	 * Port at which a means of transport is scheduled to arrive.
	 */
	arrivalLocation?: ILocation;

	/**
	 * Place where the payment has been or should be made.
	 */
	paymentLocation?: ILocation;

	/**
	 * Location where a document was issued.
	 */
	placeOfIssue?: ILocation;

	/**
	 * Identifier of a journey of a means of transport, for example voyage
	 * number.
	 */
	conveyanceReferenceNumber?: string;

	/**
	 * Name of a specific means of transport such as the vessel name.
	 */
	transportMeansIdentifier?: string;

	/**
	 * Identifier of a specific means of transport.
	 */
	transportMeansRegistration?: string;

	/**
	 * Code specifying the characteristics, i.e. size and type of a piece of
	 * transport equipment.
	 */
	containerSizeAndType?: string;

	/**
	 * Code specifying how full a piece of transport equipment is (5=Full).
	 */
	fullOrEmptyContainer?: string;

	/**
	 * Identifier of a piece of transport equipment e.g. container.
	 */
	transportEquipmentIdentifier?: string;

	/**
	 * The identification number of a seal affixed to a piece of transport
	 * equipment.
	 */
	sealIdentifier?: string;

	/**
	 * Total gross weight including packaging.
	 */
	grossWeight?: IMeasure;

	/**
	 * Total volume measurement.
	 */
	volume?: IMeasure;

	/**
	 * Number of packages.
	 */
	numberOfPackages?: number;

	/**
	 * Plain language description of the nature of a goods item.
	 */
	descriptionOfGoods?: string;

	/**
	 * Plain language description of a consignment in summary terms.
	 */
	consignmentSummaryDescription?: string;

	/**
	 * Free form description of the marks and numbers on a transport unit or
	 * package.
	 */
	shippingMarks?: string;

	/**
	 * Reference to carrier's conditions of carriage.
	 */
	transportContractConditions?: string;

	/**
	 * Monetary amount of charges which have been paid in advance.
	 */
	prepaidAmount?: IMonetaryAmount;

	/**
	 * Monetary amount of charges to be collected from the consignee.
	 */
	collectCharges?: IMonetaryAmount;

	/**
	 * Identifier of a contract concluded between parties.
	 */
	contractNumber?: string;

	/**
	 * Unique Consignment Reference identifying a particular consignment.
	 */
	ucr?: string;

	/**
	 * Goods covered by the bill of lading
	 */
	goods?: IConsignmentItem[];
}
