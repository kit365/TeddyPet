import { LoginFormValues } from "../schemas/login.schema";
import { apiApp } from "../../api";
import { AuthResponse } from "../../types/auth.type";

export const login = async (data: LoginFormValues): Promise<AuthResponse> => {
    const response = await apiApp.post("/api/auth/login", data);
    return response.data;
};
