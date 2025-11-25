// Product Image Item Request
export interface ProductImageItemRequest {
  imageId?: number | null; // null nếu là tạo mới
  imageUrl: string;
  altText?: string;
  displayOrder?: number;
}

// Product Image Item Response
export interface ProductImageItemResponse {
  imageId: number;
  imageUrl: string;
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
