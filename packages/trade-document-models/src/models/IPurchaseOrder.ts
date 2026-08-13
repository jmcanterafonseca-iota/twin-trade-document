// Copyright 2026 IOTA Stiftung.
// SPDX-License-Identifier: Apache-2.0.

import { IUneceAmountType, IUnecePaymentMeans, IUnecePaymentTerms, IUneceTradeAllowanceCharge } from "@twin.org/standards-unece";
import { ITradeParty } from "./ITradeParty.js";
import { ITradeItem } from "./ITradeItem.js";
import { TradeDocumentContexts } from "./tradeDocumentContexts.js";

export interface IPurchaseOrder {
    "@context": typeof TradeDocumentContexts.ContextPurchaseOrder;
    
    buyer: ITradeParty;
    seller: ITradeParty;
    invoicee: ITradeParty;

    orderDate: string;

    purchaseOrderNumber: string;

    paymentTerms: IUnecePaymentTerms;

    paymentMethod: IUnecePaymentMeans;

    allowanceCharge: IUneceTradeAllowanceCharge;

    totalOrderAmount: IUneceAmountType;

    orderedItems: ITradeItem[];
}