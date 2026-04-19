const fs = require('fs');
const path = require('path');

const safeReplacements = {
  // Complex strings seen in BookingDetail
  "Thông tin khách hÃ ng": "Thông tin khách hàng",
  "Há»  vÃ  tÃªn": "Họ và tên",
  "Há»  tên": "Họ tên",
  "Ä á»‹a chỉ": "Địa chỉ",
  "Chá» n loại": "Chọn loại",
  "VÃ  dá»¥:": "Ví dụ:",
  "ThÃº cÆ°ng": "Thú cưng",
  "dá»‹ch vá»¥": "dịch vụ",
  "TÃªn thÃº cÆ°ng": "Tên thú cưng",
  "Lá» i nhắn": "Lời nhắn",
  "Cân nặng": "Cân nặng",
  "Chá» n khung giá» ": "Chọn khung giờ",
  "Khung giá» ": "Khung giờ",
  "NgÃ y": "Ngày",
  "NgÃ y gửi": "Ngày gửi",
  "NgÃ y trả": "Ngày trả",
  "nhiá» u": "nhiều",
  "đầy đủ": "đầy đủ",
  "điá» n": "điền",
  "truyá» n": "truyền",
  "Chá» n": "Chọn",
  "chá» n": "chọn",
  "tiá» n": "tiền",
  "Tiá» n": "Tiền",
  "ngân hÃ ng": "ngân hàng",
  "Ä Ã³ng": "Đóng",
  "TÃ i": "Tài",
  "TÃ i khoản": "Tài khoản",
  "tÃ i khoản": "tài khoản",
  "tiến hÃ nh": "tiến hành",
  "Ä Ã£": "Đã",
  "tÃªn": "tên",
  "SÄ T": "SĐT",
  "trÆ°á» ng": "trường",
  "Ä Æ¡n": "Đơn",
  "cá» c": "cọc",
  "Cá» c": "Cọc",
  "Ä áº·t": "Đặt",
  "thá» i": "thời",
  "Giá» ": "Giờ",
  "giá» ": "giờ",
  "ngưá» i": "người",
  "Ngưá» i": "Người",
  "Lá» i": "Lời",
  "má» i": "mọi",
  "â€”": "—",
  "â€“": "–",
  "Ã—": "×",
  "â†’": "→",
  "â€¢": "•",
  "â† ": "←",
  "SÆ¡ Ä‘á»“ chá» n phÃ²ng": "Sơ đồ chọn phòng",
  "ChÆ°a cÃ³ dá»¯ liá»‡u phÃ²ng": "Chưa có dữ liệu phòng",
  "Tá»± chá» n": "Tự chọn",
  "loáº¡i phÃ²ng": "loại phòng",
  "Ä‘áº§u tiÃªn": "đầu tiên",
  "Chá» n phÃ²ng": "Chọn phòng",
  "Chá» n loáº¡i phÃ²ng": "Chọn loại phòng",
  "Buá»•i sÃ¡ng": "Buổi sáng",
  "Buá»•i chiá» u": "Buổi chiều",
  "chiá» u": "chiều",
  "khách hÃ ng": "khách hàng",
  
  // Variants with space instead of NBSP
  "Thông tin khách hÃ ng": "Thông tin khách hàng",
  "Há»  vÃ  tÃªn": "Họ và tên",
  "VÃ  dá»¥:": "Ví dụ:",
  "Chá» n khung giá» ": "Chọn khung giờ",
  "NgÃ y": "Ngày",
  "ngÃ y": "ngày",
  "vÃ ": "và",
  "trả vá» ": "trả về",
  "tiá» n cá» c": "tiền cọc",
  
  // Character level replacements that don't collide with non-mojibake text
  "Ã¡": "á",
  "Ã¢": "â",
  "Ã£": "ã",
  "Ãº": "ú",
  "Ã¹": "ù",
  "Ãª": "ê",
  "Ã¨": "è",
  "Ã©": "é",
  "Ã³": "ó",
  "Ã´": "ô",
  "Ã²": "ò",
  "Ã¬": "ì",
  "Ã\u00AD": "í", // í
  "Ãý": "ý", // wait, ý is Ã½
  "Ã½": "ý",
  "Ä‘": "đ",
  "Ä ": "Đ",
  "Æ°": "ư",
  "Æ¡": "ơ",
  "Äƒ": "ă",
  "Å©": "ũ",
  "áº¡": "ạ",
  "áº¯": "ắ",
  "áº·": "ặ",
  "áº§": "ầ",
  "áº¥": "ấ",
  "áº©": "ẩ",
  "áº\u00AD": "ậ", // ậ
  "áº£": "ả",
  "áº½": "ẽ",
  "áº»": "ẻ",
  "áº¹": "ẹ",
  "áº¿": "ế",
  "á»\u2026": "ễ", // ễ
  "á»\u0192": "ể", // ể
  "á»\u2021": "ệ", // ệ
  "á»\u2030": "ỉ", // ỉ
  "á»\u2039": "ị", // ị
  "á»\u2018": "ồ", // ồ
  "á»\u2019": "ố", // ố
  "á»\u201C": "ổ", // ổ
  "á»\u201D": "ỗ", // ỗ
  "á»\u2122": "ộ", // ộ
  "á»\u203A": "ớ", // ớ
  "á»\u0178": "ở", // ở
  "á»\u00A1": "ỡ", // ỡ
  "á»\u00A3": "ợ", // ợ
  "á»\u00A5": "ụ", // ụ
  "á»\u00A7": "ủ", // ủ
  "á»\u00AF": "ữ", // ữ
  "á»\u00B1": "ự", // ự
  "á»\u00AB": "ừ", // ừ
  "á»\u00A9": "ứ", // ứ
  "á»\u00AD": "ử", // ử
  "á»\u00B3": "ỳ", // ỳ
};

// Also apply the specific \x8D or NBSP control char replacements
function applyRegexReplacements(txt) {
    let out = txt;
    
    // chá»n -> chọn
    out = out.replace(/c\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, "chọn");
    out = out.replace(/C\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, "Chọn");
    
    // giá»  -> giờ
    out = out.replace(/g\u00ED\u00E1\u00BB[^a-zA-Z0-9]{0,3}/g, "giờ ");
    out = out.replace(/Gi\u00E1\u00BB[^a-zA-Z0-9]{0,3}/g, "Giờ ");
    
    // Há»  -> Họ
    out = out.replace(/H\u00E1\u00BB[^a-zA-Z0-9_]{0,3}t\u00EAn/g, "Họ tên");
    out = out.replace(/H\u00E1\u00BB[^a-zA-Z0-9_]{0,3}v\u00E0 t\u00EAn/g, "Họ và tên");
    out = out.replace(/H\u00E1\u00BB[^a-zA-Z0-9_]{1,3}/g, "Họ ");
    
    // điá» n -> điền
    out = out.replace(/đ\u00ED\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/gi, "điền");
    out = out.replace(/đi\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/gi, "điền");
    
    // NgÃ y
    out = out.replace(/Ng\u00C3[^a-zA-Z0-9_]{1,3}y/g, "Ngày");
    out = out.replace(/ng\u00C3[^a-zA-Z0-9_]{1,3}y/g, "ngày");
    
    // nhiá» u -> nhiều
    out = out.replace(/nhi\u00E1\u00BB[^a-zA-Z0-9_]{0,3}u/gi, "nhiều");
    
    // Ä ịa -> Địa
    out = out.replace(/\u00C4[^a-zA-Z0-9_]{0,3}ịa/g, "Địa");
    out = out.replace(/\u00C4[^a-zA-Z0-9_]{0,3}ơn/g, "Đơn");
    out = out.replace(/\u00C4[^a-zA-Z0-9_]{0,3}ang/g, "Đang");
    out = out.replace(/\u00C4[^a-zA-Z0-9_]{0,3}óng/g, "Đóng");
    out = out.replace(/\u00C4[^a-zA-Z0-9_]{0,3}ã/g, "Đã");
    out = out.replace(/\u00C4[^a-zA-Z0-9_]{0,3}ặt/g, "Đặt");
    
    // người
    out = out.replace(/ngư\u00E1\u00BB[^a-zA-Z0-9_]{0,3}i/g, "người");
    out = out.replace(/Ngư\u00E1\u00BB[^a-zA-Z0-9_]{0,3}i/g, "Người");
    
    // tiền
    out = out.replace(/ti\u00E1\u00BB[^a-zA-Z0-9_]{0,3}n/g, "tiền");
    out = out.replace(/Ti\u00E1\u00BB[^a-zA-Z0-9_]{0,3}n/g, "Tiền");
    
    // cọc
    out = out.replace(/c\u00E1\u00BB[^a-zA-Z0-9_]{0,3}c/g, "cọc");
    
    // lời
    out = out.replace(/L\u00E1\u00BB[^a-zA-Z0-9_]{0,3}i/g, "Lời");
    out = out.replace(/l\u00E1\u00BB[^a-zA-Z0-9_]{0,3}i/g, "lời");
    
    // mọi
    out = out.replace(/m\u00E1\u00BB[^a-zA-Z0-9_]{0,3}i/g, "mọi");
    
    // trường
    out = out.replace(/trư\u00E1\u00BB[^a-zA-Z0-9_]{0,3}ng/g, "trường");
    
    // thời
    out = out.replace(/th\u00E1\u00BB[^a-zA-Z0-9_]{0,3}i/g, "thời");
    
    // chiều
    out = out.replace(/chi\u00E1\u00BB[^a-zA-Z0-9_]{0,3}u/gi, "chiều");
    
    // nhỏ
    out = out.replace(/nh\u00E1\u00BB[^a-zA-Z0-9_]*/gi, "nhỏ ");
    
    // và
    out = out.replace(/ v\u00C3[^a-zA-Z0-9_]{1,3}/g, " và ");
    out = out.replace(/\[\s*v\u00C3\s*\]/g, "và"); // edge case

    return out;
}

function processFile(file) {
    let original = fs.readFileSync(file, 'utf8');
    let txt = original;

    txt = applyRegexReplacements(txt);

    for (const [k, v] of Object.entries(safeReplacements)) {
        // String split join for literal matches
        txt = txt.split(k).join(v);
    }
    
    // And lastly, some stubborn ones
    txt = txt.replace(/Khách hÃ ng/g, "Khách hàng");
    txt = txt.replace(/khách hÃ ng/g, "khách hàng");

    if (txt !== original) {
        fs.writeFileSync(file, txt);
        console.log("Fixed safely:", file);
    }
}

function search(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            search(full);
        } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
            processFile(full);
        }
    }
}

search('src');
console.log("Done carefully safe.");
