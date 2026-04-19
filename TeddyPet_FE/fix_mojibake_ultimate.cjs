const fs = require('fs');

function fixMojibake(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Generic replacement for common Mojibake clusters
    // Handling the \u008D and other control characters
    
    // chọn
    content = content.replace(/ch\u00E1\u00BB[\u0000-\u001F\u007F-\u009F]?n/g, 'chọn');
    content = content.replace(/Ch\u00E1\u00BB[\u0000-\u001F\u007F-\u009F]?n/g, 'Chọn');
    
    // từng
    content = content.replace(/t\u00E1\u00BB[\u0000-\u001F\u007F-\u009F]?ng/g, 'từng');
    
    // yêu cầu
    content = content.replace(/y\u00E3\u00AAu c\u00E1\u00BAa/g, 'yêu cầ'); // Wait, let's just do words
    content = content.replace(/y\u00C3\u00AAu c\u00E1\u00BA\u00A7u/g, 'yêu cầu');
    
    // Đang, Đặt, Đơn, Địa
    content = content.replace(/\u00C4\u0090[\u0000-\u001F\u007F-\u009F]?ang/g, 'Đang');
    content = content.replace(/\u00C4\u0090[\u0000-\u001F\u007F-\u009F]?ặt/g, 'Đặt');
    content = content.replace(/\u00C4\u0090[\u0000-\u001F\u007F-\u009F]?ơn/g, 'Đơn');
    content = content.replace(/\u00C4\u0090[\u0000-\u001F\u007F-\u009F]?ịa/g, 'Địa');
    
    // đã, đang, được
    content = content.replace(/\u00C4\u0091\u00C3\u00A3/g, 'đã');
    content = content.replace(/\u00C4\u0091ang/g, 'đang');
    content = content.replace(/\u00C4\u0091[\u0000-\u001F\u007F-\u009F]?Æ°á»\u00A3c/g, 'được'); // simplified
    
    // Simple character fixes
    const CHAR_MAP = {
        '\u00C3\u00AA': 'ê',
        '\u00C3\u00A2': 'â',
        '\u00C3\u00A3': 'ã',
        '\u00C3\u00A1': 'á',
        '\u00C3\u00A0': 'à',
        '\u00C3\u00B3': 'ó',
        '\u00C3\u00B2': 'ò',
        '\u00C4\u0091': 'đ',
        '\u00C4\u0090': 'Đ',
        '\u00E1\u00BB\u00AB': 'ừ',
        '\u00E1\u00BB\u00AD': 'ử',
        '\u00E1\u00BB\u0097': 'ỗ',
        '\u00E1\u00BB\u009F': 'ở',
        '\u00E1\u00BB\u0099': 'ộ',
        '\u00E1\u00BB\u00A3': 'ợ',
        '\u00E1\u00BB\u00A5': 'ụ',
        '\u00E1\u00BB\u00A7': 'ủ',
        '\u00E1\u00BB\u009B': 'ớ',
    };
    
    for (const [moji, correct] of Object.entries(CHAR_MAP)) {
        content = content.replaceAll(moji, correct);
    }
    
    // Clean up residual control chars
    content = content.replace(/[\u0080-\u009F]/g, '');

    fs.writeFileSync(filePath, content, 'utf8');
}

// Running on the main files
const files = [
    'src/client/pages/booking/BookingDetail.tsx',
    'src/client/pages/booking/Booking.tsx',
    'src/admin/pages/booking/BookingDetailPage.tsx'
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        fixMojibake(f);
        console.log(`Fixed ${f}`);
    }
});
