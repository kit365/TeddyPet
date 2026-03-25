import { apiApp } from "../../api/index";
import { ApiResponse } from "../../types/common.type";

const BASE_PATH = "/api/admin/transactions";

export interface TransactionResponse {
    id: string;
    referenceCode: string;
    amount: number;
    paymentMethod: string;
    status: string;
    type: string;
    createdAt: string;
    description: string;
    customerName: string;
    accountNumbers?: string;
}

export const getTransactions = async (params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    method?: string;
}) => {
    const response = await apiApp.get<ApiResponse<TransactionResponse[]>>(BASE_PATH, {
        params
    });
    return response.data;
};
