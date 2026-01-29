import { GridDensity } from '@mui/x-data-grid';

// Định nghĩa kiểu dữ liệu cho một sản phẩm (Row)
export interface IProduct {
    id: number;
    product: string;
    category: string;
    image: string;
    createdAt: Date;
    stock: number;
    price: number;
    status: string; // Allow arbitrary strings like "IN_STOCK"
}

// Định nghĩa kiểu dữ liệu cho Settings của Grid
export interface IGridSettings {
    density?: GridDensity;
    showCellBorders?: boolean;
    showColumnBorders?: boolean;
}

// Định nghĩa kiểu cho các Option trong SelectMulti
export interface ISelectOption {
    value: string;
    label: string;
}