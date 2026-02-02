import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";
import { UserAddressRequest, UserAddressResponse } from "../types/address.type";

const BASE_PATH = "/api/user-addresses";

// API Functions
export const getAllAddresses = async () => {
    const response = await apiApp.get<ApiResponse<UserAddressResponse[]>>(`${BASE_PATH}`);
    return response.data;
};

export const getAddressDetail = async (id: number) => {
    const response = await apiApp.get<ApiResponse<UserAddressResponse>>(`${BASE_PATH}/${id}`);
    return response.data;
};

export const createAddress = async (request: UserAddressRequest) => {
    const response = await apiApp.post<ApiResponse<void>>(`${BASE_PATH}`, request);
    return response.data;
};

export const updateAddress = async (id: number, request: UserAddressRequest) => {
    const response = await apiApp.put<ApiResponse<void>>(`${BASE_PATH}/${id}`, request);
    return response.data;
};

export const deleteAddress = async (id: number) => {
    const response = await apiApp.delete<ApiResponse<void>>(`${BASE_PATH}/${id}`);
    return response.data;
};

export const setDefaultAddress = async (id: number) => {
    const response = await apiApp.patch<ApiResponse<void>>(`${BASE_PATH}/${id}/default`);
    return response.data;
};
