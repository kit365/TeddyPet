import { AttributeDisplayType } from '../../enums/AttributeDisplayType';
import { UnitEnum } from '../../enums/UnitEnum';
import { ProductAttributeValueItemRequest, ProductAttributeValueResponse } from './attributeValue';

// ==================== ATTRIBUTE REQUEST ====================
export interface ProductAttributeRequest {
  name: string;
  displayType: AttributeDisplayType;
  displayOrder?: number;
  values?: ProductAttributeValueItemRequest[];
}

// ==================== ATTRIBUTE RESPONSE ====================
export interface ProductAttributeResponse {
  attributeId: number;
  name: string;
  displayType: AttributeDisplayType;
  displayOrder?: number;
  values?: ProductAttributeValueResponse[];
  supportedUnits?: UnitEnum[];
  isActive: boolean;
  isDeleted: boolean;
}

// ==================== ATTRIBUTE INFO ====================
export interface ProductAttributeInfo {
  attributeId: number;
  name: string;
  valueIds?: number[];
  displayOrder?: number;
  displayType: AttributeDisplayType;
  isDeleted: boolean;
  isActive: boolean;
  supportedUnits?: UnitEnum[];
}
