export interface CartItem {
    productId: number;
    variantId: number;
    name: string;
    variantName: string;
    price: number;
    quantity: number;
    image: string;
    stock: number;
    // For variant switching
    allVariants?: any[];
}
