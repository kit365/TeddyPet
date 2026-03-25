import axios from 'axios';
import { apiApp } from '../../api';

// Cache for Cloudinary configuration
let cachedConfig: { cloud_name: string; api_key: string; api_secret: string } | null = null;

const fetchCloudinaryConfig = async () => {
    if (cachedConfig) return cachedConfig;
    try {
        const response = await apiApp.get('/api/v1/media/config');
        cachedConfig = response.data;
        return cachedConfig;
    } catch (error) {
        console.error("Failed to fetch Cloudinary config:", error);
        return null;
    }
};

export const uploadImagesToCloudinary = async (files: File[], folder: string = 'teddypet'): Promise<string[]> => {
    try {
        const config = await fetchCloudinaryConfig();
        const cloudName = config?.cloud_name || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        // Construct the correct upload URL based on cloud name
        const uploadUrl = cloudName
            ? `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
            : import.meta.env.VITE_CLOUDINARY_URL;

        const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET || 'teddypet';

        const uploadPromises = files.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);
            formData.append("folder", folder);

            const response = await axios.post(uploadUrl, formData);
            return response.data.secure_url;
        });

        return await Promise.all(uploadPromises);
    } catch (error: any) {
        console.error("Cloudinary upload error:", error);
        const errorMessage = error.response?.data?.error?.message || "Lỗi khi tải ảnh lên server.";
        throw new Error(errorMessage);
    }
};
