import { UnitEnum } from '../../enums/UnitEnum';

// ==================== ATTRIBUTE VALUE ITEM REQUEST ====================
export interface ProductAttributeValueItemRequest {
  valueId?: number | null;
  value: string;
  displayOrder?: number;
  amount?: number;
  unit?: UnitEnum;
  displayCode?: string;
}

// ==================== ATTRIBUTE VALUE REORDER REQUEST ====================
export interface ProductAttributeValueOrderItem {
  valueId: number;
  displayOrder: number;
}

export interface ProductAttributeValueReorderRequest {
  items: ProductAttributeValueOrderItem[];
}

// ==================== ATTRIBUTE VALUE RESPONSE ====================
export interface ProductAttributeValueResponse {
  valueId: number;
  attributeId: number;
  attributeName: string;
  value: string;
  displayOrder?: number;
  displayCode?: string;
  isDeleted: boolean;
  isActive: boolean;
  amount?: number;
  unit?: UnitEnum;
}
