export enum ProductStatusEnum {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

// Display labels
export const ProductStatusLabels: Record<ProductStatusEnum, string> = {
  [ProductStatusEnum.ACTIVE]: 'Đang bán',
  [ProductStatusEnum.DRAFT]: 'Nháp',
  [ProductStatusEnum.OUT_OF_STOCK]: 'Hết hàng',
  [ProductStatusEnum.DISCONTINUED]: 'Ngừng kinh doanh',
};
