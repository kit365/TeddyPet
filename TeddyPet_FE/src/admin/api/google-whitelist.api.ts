import { apiApp } from "../../api";

export interface GoogleWhitelist {
    id?: string;
    email: string;
    role: string;
    addedBy?: string;
    createdAt?: string;
}

export const getGoogleWhitelist = async (): Promise<{ success: boolean; data: GoogleWhitelist[] }> => {
    const response = await apiApp.get('/api/auth/google/whitelist');
    return response.data;
};

export const addToGoogleWhitelist = async (data: { email: string; role: string }): Promise<{ success: boolean; data: GoogleWhitelist }> => {
    const response = await apiApp.post('/api/auth/google/whitelist', data);
    return response.data;
};

export const removeFromGoogleWhitelist = async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiApp.delete(`/api/auth/google/whitelist/${email}`);
    return response.data;
};

export const verifyInvitation = async (token: string): Promise<{ success: boolean; message: string; data: { token: string; refreshToken: string; mustChangePassword: boolean } }> => {
    const response = await apiApp.post(`/api/auth/google/whitelist/verify-invitation?token=${token}`);
    return response.data;
};

export const resendGoogleInvitation = async (email: string): Promise<{ success: boolean; message: string; data: GoogleWhitelist }> => {
    const response = await apiApp.post(`/api/auth/google/whitelist/resend-invitation?email=${email}`);
    return response.data;
};
