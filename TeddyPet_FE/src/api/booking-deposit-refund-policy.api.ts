import { apiApp } from "./index";
import type { ApiResponse } from "../types/common.type";

export interface BookingDepositRefundPolicyResponse {
    id: number;
    policyName: string;
    description: string;
    depositPercentage: number;
    fullRefundHours: number;
    fullRefundPercentage: number;
    partialRefundHours: number;
    partialRefundPercentage: number;
    noRefundHours: number;
    noRefundPercentage: number;
    noShowRefundPercentage: number;
    noShowPenalty: number;
    allowForceMajeure: boolean;
    forceMajeureRefundPercentage: number;
    forceMajeureRequiresEvidence: boolean;
    isDefault: boolean;
    displayOrder: number;
    highlightText: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type GetActiveBookingDepositRefundPoliciesResponse = ApiResponse<BookingDepositRefundPolicyResponse[]>;

export const getActiveBookingDepositRefundPolicies = async (): Promise<GetActiveBookingDepositRefundPoliciesResponse> => {
    const response = await apiApp.get<GetActiveBookingDepositRefundPoliciesResponse>("/api/booking-deposit-refund-policies");
    return response.data;
};
