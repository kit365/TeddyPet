import { apiApp } from "../../api";
import type { ApiResponse } from "../config/type";
import type { NoShowConfig } from "../../types/noShowConfig.type";
import Cookies from "js-cookie";

const NO_SHOW_CONFIG_URL = "/api/admin/no-show-config";

/** Chỉ gắn header khi có token — tránh `Bearer undefined` ghi đè token từ interceptor và gây 401. */
const withAuth = () => {
  const token = Cookies.get("tokenAdmin");
  if (!token) return {};
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export type UpsertNoShowConfigPayload = Omit<NoShowConfig, "id" | "createdAt" | "updatedAt" | "services"> & {
  /** null = giữ nguyên (chỉ khi cập nhật); mảng rỗng = xóa hết dịch vụ */
  serviceIds?: number[] | null;
};

export const listAdminNoShowConfigs = async (): Promise<ApiResponse<NoShowConfig[]>> => {
  const response = await apiApp.get<ApiResponse<NoShowConfig[]>>(NO_SHOW_CONFIG_URL, withAuth());
  return response.data;
};

export const getAdminNoShowConfigById = async (id: number): Promise<ApiResponse<NoShowConfig>> => {
  const response = await apiApp.get<ApiResponse<NoShowConfig>>(`${NO_SHOW_CONFIG_URL}/${id}`, withAuth());
  return response.data;
};

export const createAdminNoShowConfig = async (
  payload: UpsertNoShowConfigPayload
): Promise<ApiResponse<NoShowConfig>> => {
  const response = await apiApp.post<ApiResponse<NoShowConfig>>(NO_SHOW_CONFIG_URL, payload, withAuth());
  return response.data;
};

export const updateAdminNoShowConfig = async (
  id: number,
  payload: UpsertNoShowConfigPayload
): Promise<ApiResponse<NoShowConfig>> => {
  const response = await apiApp.put<ApiResponse<NoShowConfig>>(`${NO_SHOW_CONFIG_URL}/${id}`, payload, withAuth());
  return response.data;
};

export const deleteAdminNoShowConfig = async (id: number): Promise<ApiResponse<unknown>> => {
  const response = await apiApp.delete<ApiResponse<unknown>>(`${NO_SHOW_CONFIG_URL}/${id}`, withAuth());
  return response.data;
};

export const replaceNoShowConfigServices = async (
  id: number,
  serviceIds: number[]
): Promise<ApiResponse<NoShowConfig>> => {
  const response = await apiApp.put<ApiResponse<NoShowConfig>>(
    `${NO_SHOW_CONFIG_URL}/${id}/services`,
    { serviceIds },
    withAuth()
  );
  return response.data;
};
