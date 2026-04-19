const fs = require('fs');
const path = require('path');

function processFile(file) {
    let original = fs.readFileSync(file, 'utf8');
    let txt = original;

    // Use precisely targetted regexes specifying the EXACT mojibake prefix:
    // \u00C3 = Ã
    // \u00E1\u00BB = á»
    // \u00C4 = Ä
    // \u00E1\u00BA = áº
    
    // We allow ANY 0 to 2 non-alphanumeric characters (like space, \xA0, \x8D) right after the mojibake.
    
    // 'chá» n'
    txt = txt.replace(/c\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, "chọn");
    txt = txt.replace(/C\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, "Chọn");
    
    // 'giá» '
    txt = txt.replace(/gi\u00E1\u00BB[^a-zA-Z0-9]*/gi, "giờ ");
    
    // 'Há» '
    txt = txt.replace(/H\u00E1\u00BB[^a-zA-Z0-9]*/g, "Họ ");
    txt = txt.replace(/h\u00E1\u00BB[^a-zA-Z0-9]*/g, "họ ");
    
    // 'điá» n'
    txt = txt.replace(/đ\u00ED\u00E1\u00BB[^a-zA-Z0-9]{0,2}n/gi, "điền");
    txt = txt.replace(/đi\u00E1\u00BB[^a-zA-Z0-9]{0,2}n/gi, "điền");
    
    // 'NgÃ y', 'ngÃ y'
    txt = txt.replace(/Ng\u00C3[^a-zA-Z0-9]{0,2}y/g, "Ngày");
    txt = txt.replace(/ng\u00C3[^a-zA-Z0-9]{0,2}y/g, "ngày");
    
    // 'vÃ '
    txt = txt.replace(/v\u00C3[^a-zA-Z0-9]*/gi, "và ");
    
    // 'TÃ i'
    txt = txt.replace(/T\u00C3[^a-zA-Z0-9]?i/g, "Tài");
    txt = txt.replace(/t\u00C3[^a-zA-Z0-9]?i/g, "tài");
    
    // 'Ä ịa'
    txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,2}ịa/g, "Địa");
    
    // 'Ä ang', 'Ä ơn', 'Ä ã'
    txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,2}ang/g, "Đang");
    txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,2}ơn/g, "Đơn");
    txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,2}ã/g, "Đã");
    txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,2}óng/g, "Đóng");
    txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,2}ặt/g, "Đặt");
    
    // 'tiá» n'
    txt = txt.replace(/ti\u00E1\u00BB[^a-zA-Z0-9]{0,2}n/g, "tiền");
    txt = txt.replace(/Ti\u00E1\u00BB[^a-zA-Z0-9]{0,2}n/g, "Tiền");
    
    // 'ngưá» i'
    txt = txt.replace(/ngư\u00E1\u00BB[^a-zA-Z0-9]{0,2}i/g, "người");
    txt = txt.replace(/Ngư\u00E1\u00BB[^a-zA-Z0-9]{0,2}i/g, "Người");
    
    // 'nhiá» u'
    txt = txt.replace(/nhi\u00E1\u00BB[^a-zA-Z0-9]{0,2}u/gi, "nhiều");
    
    // 'cá» c'
    txt = txt.replace(/c\u00E1\u00BB[^a-zA-Z0-9]{0,2}c/g, "cọc");
    
    // 'trưá» ng'
    txt = txt.replace(/trư\u00E1\u00BB[^a-zA-Z0-9]{0,2}ng/gi, "trường");
    
    // 'thá» i'
    txt = txt.replace(/th\u00E1\u00BB[^a-zA-Z0-9]{0,2}i/gi, "thời");
    
    // 'Lá» i', 'má» i'
    txt = txt.replace(/L\u00E1\u00BB[^a-zA-Z0-9]{0,2}i/g, "Lời");
    txt = txt.replace(/l\u00E1\u00BB[^a-zA-Z0-9]{0,2}i/g, "lời");
    txt = txt.replace(/m\u00E1\u00BB[^a-zA-Z0-9]{0,2}i/gi, "mọi");
    
    // 'vá» '
    txt = txt.replace(/v\u00E1\u00BB[^a-zA-Z0-9]*/gi, "về ");
    
    // 'NÃ y', 'nÃ y', 'nÃ o'
    txt = txt.replace(/N\u00C3[^a-zA-Z0-9]y/g, "Này");
    txt = txt.replace(/n\u00C3[^a-zA-Z0-9]y/g, "này");
    txt = txt.replace(/N\u00C3[^a-zA-Z0-9]o/g, "Nào");
    txt = txt.replace(/n\u00C3[^a-zA-Z0-9]o/g, "nào");
    
    // 'chiá» u'
    txt = txt.replace(/chi\u00E1\u00BB[^a-zA-Z0-9]{0,2}u/gi, "chiều");
    
    // 'nhá» '
    txt = txt.replace(/nh\u00E1\u00BB[^a-zA-Z0-9]*/gi, "nhỏ ");
    
    // 'tÃªn' -> 'tên'
    txt = txt.replace(/t\u00C3\u00AA[^a-zA-Z0-9]?n/gi, "tên");
    
    // 'thÃº' -> 'thú'
    txt = txt.replace(/th\u00C3\u00BA/gi, "thú");
    
    // 'cÆ°ng' -> 'cưng'
    txt = txt.replace(/c\u00C6\u00B0ng/gi, "cưng");
    
    // 'dá»‹ch vá»¥'
    txt = txt.replace(/d\u00E1\u00BB\u2039/g, "dị");
    txt = txt.replace(/v\u00E1\u00BB\u00A5/g, "vụ");
    
    // Hardcoded string replacements just in case
    txt = txt.replace(/Khách h\u00C3[^a-zA-Z0-9]?ng/g, "Khách hàng");
    txt = txt.replace(/khách h\u00C3[^a-zA-Z0-9]?ng/g, "khách hàng");

    if (txt !== original) {
        fs.writeFileSync(file, txt);
        console.log("Fixed:", file);
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
console.log("All target files safely replaced.");
