import { apiApp } from "./index";
import { ApiResponse } from "../types/common.type";

const UPLOAD_PATH = "/api/v1/media/upload";

/**
 * Upload một ảnh từ thiết bị lên server (Cloudinary).
 * @param file File ảnh chọn từ input
 * @param folder Thư mục trên Cloudinary (mặc định pet-avatars)
 * @returns URL công khai của ảnh đã upload
 */
export const uploadImage = async (
    file: File,
    folder: string = "pet-avatars"
): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await apiApp.post<ApiResponse<string>>(UPLOAD_PATH, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    const url = response.data?.data;
    if (!url) throw new Error(response.data?.message || "Upload thất bại.");
    return url;
};
