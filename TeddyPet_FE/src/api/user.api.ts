import { apiApp } from "./index";
import { UpdateProfilePayload, UpdateProfileResponse } from "../types/auth.type";

const BASE_PATH = "/api/users";

export const updateProfile = async (data: UpdateProfilePayload): Promise<UpdateProfileResponse> => {
    const response = await apiApp.put(`${BASE_PATH}/profile`, data);
    return response.data;
};
