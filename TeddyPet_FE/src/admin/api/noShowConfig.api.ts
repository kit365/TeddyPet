import { apiApp } from "../../api";
import type { ApiResponse } from "../config/type";
import type { NoShowConfig } from "../../types/noShowConfig.type";

const NO_SHOW_CONFIG_URL = "/api/admin/no-show-config";

export const getAdminNoShowConfig = async (): Promise<ApiResponse<NoShowConfig | null>> => {
  const response = await apiApp.get<ApiResponse<NoShowConfig | null>>(NO_SHOW_CONFIG_URL);
  return response.data;
};

export type UpsertNoShowConfigPayload = Omit<NoShowConfig, "id" | "createdAt" | "updatedAt">;

export const upsertAdminNoShowConfig = async (
  payload: UpsertNoShowConfigPayload
): Promise<ApiResponse<NoShowConfig>> => {
  const response = await apiApp.put<ApiResponse<NoShowConfig>>(NO_SHOW_CONFIG_URL, payload);
  return response.data;
};

