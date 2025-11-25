import { UnitEnum } from '../../enums/UnitEnum';
import { ProductAttributeValueResponse } from '../attribute/attributeValue';


// Product Variant Request
export interface ProductVariantRequest {
  variantId?: number | null;
  productId: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  unit: UnitEnum;
  featuredImageId?: number | null;
  attributeValueIds?: number[];
}

// Product Variant Response
export interface ProductVariantResponse {
  variantId: number;
  productId: number;
  productName?: string;
  productSlug?: string;
  name?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  unit: UnitEnum;
  featuredImageId?: number;
  featuredImageUrl?: string;
  attributes?: ProductAttributeValueResponse[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}
