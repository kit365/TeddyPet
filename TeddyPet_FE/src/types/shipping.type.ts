import { ApiResponse } from "./common.type";

export interface ShippingRule {
    id: number;
    isInnerCity: boolean;
    provinceId: number;
    districtId?: number;
    fixedFee: number;
    maxInternalDistanceKm?: number;
    freeShipDistanceKm?: number;
    isSelfShip?: boolean;
    feePerKm?: number;
    freeShipThreshold?: number;
    note?: string;
    minFee?: number;
    baseWeight?: number;
    overWeightFee?: number;
    createdAt?: string;
    updatedAt?: string;
}

export type ShippingRuleResponse = ApiResponse<ShippingRule[]>;
export type ShippingRuleDetailResponse = ApiResponse<ShippingRule>;

export interface CreateShippingRuleRequest {
    isInnerCity: boolean;
    provinceId: number;
    districtId?: number;
    fixedFee: number;
    maxInternalDistanceKm?: number;
    freeShipDistanceKm?: number;
    isSelfShip?: boolean;
    feePerKm?: number;
    freeShipThreshold?: number;
    note?: string;
    minFee?: number;
    baseWeight?: number;
    overWeightFee?: number;
}

export interface UpdateShippingRuleRequest extends Partial<CreateShippingRuleRequest> { }
