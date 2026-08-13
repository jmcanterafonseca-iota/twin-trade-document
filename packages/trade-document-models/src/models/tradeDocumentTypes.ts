// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { UneceTypes } from "@twin.org/standards-unece";

/**
 * The types of auditable item graph data.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TradeDocumentTypes = {
	/**
	 * A Trade Agreement Contract
	 */
	TradeAgreement: `${UneceTypes.HeaderTradeAgreement}`,
	TradeParty: `${UneceTypes.TradeParty}`,
	TradeItem: `${UneceTypes.LineTradeAgreement}`,

	PurchaseOrder: ``

} as const;

/**
 * The types of auditable item graph data.
 */
export type TradeDocumentTypes =
	(typeof TradeDocumentTypes)[keyof typeof TradeDocumentTypes];
