import { LoginFormValues } from "../schemas/login.schema";
import { apiApp } from "../../api";
import { AuthResponse } from "../../types/auth.type";

export const login = async (data: LoginFormValues): Promise<AuthResponse> => {
    const response = await apiApp.post("/api/auth/login", data);
    return response.data;
};

export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
    const response = await apiApp.post("/api/auth/google", { idToken });
    return response.data;
};

export const setupInitialPassword = async (data: { newPassword: String; confirmPassword: String }): Promise<any> => {
    const response = await apiApp.post("/api/auth/setup-password", data);
    return response.data;
};
