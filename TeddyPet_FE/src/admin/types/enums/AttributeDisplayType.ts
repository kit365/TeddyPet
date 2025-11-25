export enum AttributeDisplayType {
  TEXT = 'TEXT',               // Ô nhập văn bản
  SELECT = 'SELECT',           // Dropdown một lựa chọn
  CHECKBOX = 'CHECKBOX',       // Checkbox nhiều lựa chọn
  RADIO = 'RADIO',             // Radio một lựa chọn
  MULTI_SELECT = 'MULTI_SELECT', // Dropdown nhiều lựa chọn
  COLOR = 'COLOR'              // Chọn màu sắc
}

// Display labels
export const AttributeDisplayTypeLabels: Record<AttributeDisplayType, string> = {
  [AttributeDisplayType.TEXT]: 'Ô nhập văn bản',
  [AttributeDisplayType.SELECT]: 'Dropdown một lựa chọn',
  [AttributeDisplayType.CHECKBOX]: 'Checkbox nhiều lựa chọn',
  [AttributeDisplayType.RADIO]: 'Radio một lựa chọn',
  [AttributeDisplayType.MULTI_SELECT]: 'Dropdown nhiều lựa chọn',
  [AttributeDisplayType.COLOR]: 'Chọn màu sắc',
};
