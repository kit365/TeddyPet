/**
 * Hỗ trợ chuyển đổi HTML sang văn bản thuần túy (loại bỏ các thẻ HTML).
 * Dùng để tự động tạo Meta Description từ nội dung Tiptap.
 */
export const stripHtml = (html: string): string => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

/**
 * Tạo SKU tự động dựa trên tên sản phẩm và các thuộc tính biến thể.
 * Định dạng: PREFIX-SLUG_TEN_SP-SLUG_BIEN_THE
 */
export const generateSKU = (productName: string, attributes: { name: string, value: string }[] = []): string => {
    const toSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .replace(/([^0-9a-z-\s])/g, "")
            .replace(/(\s+)/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toUpperCase();
    };

    const namePart = toSlug(productName).split("-").slice(0, 3).join("-");
    const attrPart = attributes
        .map(a => toSlug(a.value))
        .join("-");

    let sku = namePart;
    if (attrPart) {
        sku += "-" + attrPart;
    }

    // Add a short random suffix to ensure uniqueness if needed, 
    // but the user seems to want it "smart" so let's stick to name+variants first.
    return sku;
};

/**
 * Tạo Mã vạch (Barcode) ngẫu nhiên cho các sản phẩm tự làm (Handmade).
 * Định dạng: 885 (Mã VN giả định) + 9 chữ số ngẫu nhiên.
 */
export const generateBarcode = (): string => {
    const prefix = "885"; // Mã giả định cho Việt Nam hoặc mã shop
    const randomPart = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return prefix + randomPart;
};

/**
 * Tự động tạo dữ liệu SEO nếu người dùng không nhập.
 */
export const autoGenerateSEO = (name: string, descriptionHtml: string) => {
    const plainDescription = stripHtml(descriptionHtml);
    return {
        title: name.trim(),
        description: plainDescription.trim().substring(0, 155) + (plainDescription.length > 155 ? "..." : "")
    };
};
