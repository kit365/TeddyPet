const fs = require('fs');
const path = require('path');

const WORD_REPLACEMENTS = [
    { from: "Dá»‹ch vá»¥", to: "Dịch vụ" },
    { from: "dá»‹ch vá»¥", to: "dịch vụ" },
    { from: "thÃº cÆ°ng", to: "thú cưng" },
    { from: "PhÃ²ng Ä‘ang", to: "Phòng đang" },
    { from: "PhÃ²ng Ä‘ang", to: "Phòng đang" },
    { from: "chá» n", to: "chọn" },
    { from: "Chá» n", to: "Chọn" },
    { from: "tá»«ng", to: "từng" },
    { from: "yÃªu cáº§u", to: "yêu cầu" },
    { from: "kháº©n cáº¥p", to: "khẩn cấp" },
    { from: "Ä‘á»‹a chá»‰", to: "địa chỉ" },
    { from: "Sá»‘ Ä‘iá»‡n thoáº¡i", to: "Số điện thoại" },
    { from: "Vui lÃ²ng", to: "Vui lòng" },
    { from: "NgÃ y gá»­i", to: "Ngày gửi" },
    { from: "NgÃ y tráº£", to: "Ngày trả" },
    { from: "Tá»•ng dá»± kiáº¿n", to: "Tổng dự kiến" },
    { from: "TÃ³m táº¯t giÃ¡", to: "Tóm tắt giá" },
    { from: "KhÃ´ng cÃ³", to: "Không có" },
];

const CHAR_REPLACEMENTS = [
    { from: "Ä‘Ãªm", to: "đêm" },
    { from: "Ä‘", to: "đ" },
    { from: "Ä", to: "Đ" },
    { from: "Ãª", to: "ê" },
    { from: "Ã¢", to: "â" },
    { from: "Ã£", to: "ã" },
    { from: "Ã¡", to: "á" },
    { from: "Ã ", to: "à" },
    { from: "Ã³", to: "ó" },
    { from: "Ã²", to: "ò" },
    { from: "á»«", to: "ừ" },
    { from: "á»­", to: "ử" },
    { from: "á»—", to: "ỗ" },
    { from: "á»Ÿ", to: "ở" },
    { from: "á»™", to: "ộ" },
    { from: "á»£", to: "ợ" },
    { from: "á»¥", to: "ụ" },
    { from: "á»§", to: "ủ" },
    { from: "á»›", to: "ớ" },
    { from: "áº£", to: "ả" },
    { from: "áº§", to: "ầ" },
    { from: "áº¥", to: "ấ" },
    { from: "áº¡", to: "ạ" },
    { from: "á║í", to: "ạ" }, // Alternate representation
    { from: "á║ú", to: "ủ" },
    { from: "â€”", to: "—" },
    { from: "â€“", to: "–" },
];

function fixFile(filePath) {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pass 1: Words
    for (const { from, to } of WORD_REPLACEMENTS) {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, to);
    }

    // Pass 2: Characters
    for (const { from, to } of CHAR_REPLACEMENTS) {
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, to);
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${filePath}`);
    } else {
        console.log(`No changes needed for ${filePath}`);
    }
}

const filesToFix = [
    'src/client/pages/booking/BookingDetail.tsx',
    'src/admin/pages/feedback/FeedbackListPage.tsx',
    'src/client/pages/booking/Booking.tsx',
    'src/admin/pages/booking/BookingDetailPage.tsx'
];

filesToFix.forEach(f => {
    const fullPath = path.resolve(process.env.WORKSPACE_ROOT || '.', f);
    if (fs.existsSync(fullPath)) {
        fixFile(fullPath);
    }
});
