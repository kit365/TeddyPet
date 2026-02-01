import { apiApp } from "./index";

// API Endpoints Constants
const ENDPOINTS = {
    USER_ADDRESSES: '/api/user-addresses',
    USER_ADDRESS_BY_ID: (id: number) => `/api/user-addresses/${id}`,
    SET_DEFAULT: (id: number) => `/api/user-addresses/${id}/default`,
};

// Interfaces
export interface UserAddressRequest {
    fullName: string;
    phone: string;
    address: string;
    longitude?: number;
    latitude?: number;
    isDefault: boolean;
}

export interface UserAddressResponse {
    id: number;
    userId: string;
    fullName: string;
    phone: string;
    address: string;
    longitude?: number;
    latitude?: number;
    isDefault: boolean;
}

// API Functions
export const getAllAddresses = async () => {
    const response = await apiApp.get<{ success: boolean; data: UserAddressResponse[] }>(ENDPOINTS.USER_ADDRESSES);
    return response.data;
};

export const getAddressDetail = async (id: number) => {
    const response = await apiApp.get<{ success: boolean; data: UserAddressResponse }>(ENDPOINTS.USER_ADDRESS_BY_ID(id));
    return response.data;
};

export const createAddress = async (request: UserAddressRequest) => {
    const response = await apiApp.post<{ success: boolean; message: string }>(ENDPOINTS.USER_ADDRESSES, request);
    return response.data;
};

export const updateAddress = async (id: number, request: UserAddressRequest) => {
    const response = await apiApp.put<{ success: boolean; message: string }>(ENDPOINTS.USER_ADDRESS_BY_ID(id), request);
    return response.data;
};

export const deleteAddress = async (id: number) => {
    const response = await apiApp.delete<{ success: boolean; message: string }>(ENDPOINTS.USER_ADDRESS_BY_ID(id));
    return response.data;
};

export const setDefaultAddress = async (id: number) => {
    const response = await apiApp.patch<{ success: boolean; message: string }>(ENDPOINTS.SET_DEFAULT(id));
    return response.data;
};
