import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";
import { PetProfileRequest, PetProfileResponse } from "../types/petProfile.type";

const BASE_PATH = "/api/pet-profiles";

export const getMyPetProfiles = async () => {
    const response = await apiApp.get<ApiResponse<PetProfileResponse[]>>(BASE_PATH);
    return response.data;
};

export const getPetProfileById = async (id: number) => {
    const response = await apiApp.get<ApiResponse<PetProfileResponse>>(`${BASE_PATH}/${id}`);
    return response.data;
};

export const createPetProfile = async (request: PetProfileRequest) => {
    const response = await apiApp.post<ApiResponse<PetProfileResponse>>(BASE_PATH, request);
    return response.data;
};

export const updatePetProfile = async (id: number, request: PetProfileRequest) => {
    const response = await apiApp.put<ApiResponse<PetProfileResponse>>(`${BASE_PATH}/${id}`, request);
    return response.data;
};

export const deletePetProfile = async (id: number) => {
    await apiApp.delete(`${BASE_PATH}/${id}`);
};
