import { apiApp } from "../../api";
import { ApiResponse } from "../../types/common.type";

export const getShippingEstimation = async (provinceId: number, districtId?: number) => {
    const response = await apiApp.get<ApiResponse<number>>(`/api/shipping/estimate`, {
        params: {
            provinceId,
            districtId
        }
    });
    return response.data;
};

