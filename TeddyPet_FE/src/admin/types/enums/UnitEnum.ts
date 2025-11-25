// Unit Category
export enum UnitCategory {
  SALES = 'SALES',           // Đơn vị bán
  MEASUREMENT = 'MEASUREMENT' // Đơn vị đo lường
}

// Unit Enum
export enum UnitEnum {
  // --- NHÓM BÁN HÀNG (SALES) ---
  PIECE = 'PIECE',     // Cái
  BOX = 'BOX',         // Hộp
  PACK = 'PACK',       // Gói
  BAG = 'BAG',         // Túi
  BOTTLE = 'BOTTLE',   // Chai
  CAN = 'CAN',         // Lon
  SET = 'SET',         // Bộ
  COMBO = 'COMBO',     // Combo

  // --- NHÓM ĐO LƯỜNG (MEASUREMENT) ---
  KG = 'KG',           // Kilogram
  GRAM = 'GRAM',       // Gram
  LITER = 'LITER',     // Lít
  ML = 'ML',           // Mililit
  MM = 'MM',           // Milimet
  CM = 'CM',           // Centimet
  M = 'M'              // Mét
}

// Unit metadata for display
export const UnitMetadata: Record<UnitEnum, { label: string; symbol: string; category: UnitCategory }> = {
  // SALES
  [UnitEnum.PIECE]: { label: 'Cái', symbol: 'cái', category: UnitCategory.SALES },
  [UnitEnum.BOX]: { label: 'Hộp', symbol: 'hộp', category: UnitCategory.SALES },
  [UnitEnum.PACK]: { label: 'Gói', symbol: 'gói', category: UnitCategory.SALES },
  [UnitEnum.BAG]: { label: 'Túi', symbol: 'túi', category: UnitCategory.SALES },
  [UnitEnum.BOTTLE]: { label: 'Chai', symbol: 'chai', category: UnitCategory.SALES },
  [UnitEnum.CAN]: { label: 'Lon', symbol: 'lon', category: UnitCategory.SALES },
  [UnitEnum.SET]: { label: 'Bộ', symbol: 'bộ', category: UnitCategory.SALES },
  [UnitEnum.COMBO]: { label: 'Combo', symbol: 'combo', category: UnitCategory.SALES },
  
  // MEASUREMENT
  [UnitEnum.KG]: { label: 'Kilogram', symbol: 'kg', category: UnitCategory.MEASUREMENT },
  [UnitEnum.GRAM]: { label: 'Gram', symbol: 'g', category: UnitCategory.MEASUREMENT },
  [UnitEnum.LITER]: { label: 'Lít', symbol: 'l', category: UnitCategory.MEASUREMENT },
  [UnitEnum.ML]: { label: 'Mililit', symbol: 'ml', category: UnitCategory.MEASUREMENT },
  [UnitEnum.MM]: { label: 'Milimet', symbol: 'mm', category: UnitCategory.MEASUREMENT },
  [UnitEnum.CM]: { label: 'Centimet', symbol: 'cm', category: UnitCategory.MEASUREMENT },
  [UnitEnum.M]: { label: 'Mét', symbol: 'm', category: UnitCategory.MEASUREMENT },
};
