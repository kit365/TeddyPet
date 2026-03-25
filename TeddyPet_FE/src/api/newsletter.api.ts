import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";

export const subscribeNewsletter = async (email: string): Promise<ApiResponse<void>> => {
    const response = await apiApp.post("/api/newsletter/subscribe", { email });
    return response.data;
};

export const unsubscribeNewsletter = async (email: string): Promise<ApiResponse<void>> => {
    const response = await apiApp.post("/api/newsletter/unsubscribe", { email });
    return response.data;
};
