const fs = require('fs');
const path = require('path');

function processFile(file) {
    let original = fs.readFileSync(file, 'utf8');
    let txt = original;

    // Use very broad wildcards for the corrupted pieces
    txt = txt.replace(/chá[^a-zA-Z0-9]{1,4}n/gi, 'chọn');
    txt = txt.replace(/Chá[^a-zA-Z0-9]{1,4}n/g, 'Chọn');
    txt = txt.replace(/giá[^a-zA-Z0-9]{1,4}\s/gi, 'giờ ');
    txt = txt.replace(/Há[^a-zA-Z0-9]{1,4}\s/g, 'Họ ');
    txt = txt.replace(/ngưá[^a-zA-Z0-9]{1,4}i/g, 'người');
    txt = txt.replace(/Ngưá[^a-zA-Z0-9]{1,4}i/g, 'Người');
    txt = txt.replace(/điá[^a-zA-Z0-9]{1,4}n/g, 'điền');
    txt = txt.replace(/Ä[^a-zA-Z0-9]{1,4}ịa/g, 'Địa');
    txt = txt.replace(/nhiá[^a-zA-Z0-9]{1,4}u/g, 'nhiều');
    txt = txt.replace(/tiá[^a-zA-Z0-9]{1,4}n/g, 'tiền');
    txt = txt.replace(/Tiá[^a-zA-Z0-9]{1,4}n/g, 'Tiền');
    txt = txt.replace(/cá[^a-zA-Z0-9]{1,4}c/g, 'cọc');
    txt = txt.replace(/vá[^a-zA-Z0-9]{1,4}/g, 'về ');
    txt = txt.replace(/thá[^a-zA-Z0-9]{1,4}i/g, 'thời');
    txt = txt.replace(/Lá[^a-zA-Z0-9]{1,4}i/g, 'Lời');
    txt = txt.replace(/má[^a-zA-Z0-9]{1,4}i/g, 'mọi');
    txt = txt.replace(/trưá[^a-zA-Z0-9]{1,4}ng/gi, 'trường');
    txt = txt.replace(/Khung giá[^a-zA-Z0-9]{1,4}/gi, 'Khung giờ ');
    txt = txt.replace(/Buổi chiá[^a-zA-Z0-9]{1,4}u/gi, 'Buổi chiều');
    txt = txt.replace(/nhá[^a-zA-Z0-9]{1,4} hơn/gi, 'nhỏ hơn');

    // Replace any remaining weird Ä occurrences
    txt = txt.replace(/Ä[^a-zA-Z0-9]{1,4}ơn/g, 'Đơn');
    txt = txt.replace(/Ä[^a-zA-Z0-9]{1,4}ang/g, 'Đang');
    txt = txt.replace(/Ä[^a-zA-Z0-9]{1,4}ã/g, 'Đã');

    // Any trailing 'á»' fragments that didn't match the above
    txt = txt.replace(/á[^a-zA-Z0-9]{1,4}n(?!\w)/g, 'ọn');
    
    // Remove any residual Ã
    txt = txt.replace(/Ã[^a-zA-Z0-9]{1,4}\s/g, 'à ');

    // Known cases like "hÃ ng", "vÃ ", "NgÃ y"
    txt = txt.replace(/hÃ[^a-zA-Z0-9]{1,4}ng/g, 'hàng');
    txt = txt.replace(/vÃ[^a-zA-Z0-9]{1,4}/g, 'và ');
    txt = txt.replace(/NgÃ[^a-zA-Z0-9]{1,4}y/gi, 'Ngày');
    txt = txt.replace(/nÃ[^a-zA-Z0-9]{1,4}o/g, 'nào');
    txt = txt.replace(/nÃ[^a-zA-Z0-9]{1,4}y/g, 'này');
    txt = txt.replace(/lÃ[^a-zA-Z0-9]{1,4}m/g, 'làm');
    txt = txt.replace(/lÃ[^a-zA-Z0-9]{1,4}\s/g, 'là ');
    
    // tuỳ chá» n
    txt = txt.replace(/uỳ chá[^a-zA-Z0-9]{1,4}n/gi, 'uỳ chọn');
    
    // TÃ i khoản
    txt = txt.replace(/TÃ[^a-zA-Z0-9]{1,4}i/g, 'Tài');
    txt = txt.replace(/tÃ[^a-zA-Z0-9]{1,4}i/g, 'tài');
    
    // thÃº cÆ°ng
    txt = txt.replace(/thÃ[^a-zA-Z0-9]{1,4}cÆ[^a-zA-Z0-9]{1,4}ng/gi, 'thú cưng');
    
    // vÃ  dá»¥
    txt = txt.replace(/VÃ[^a-zA-Z0-9]{1,4}dá[^a-zA-Z0-9]{1,4}/gi, 'Ví dụ');

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
console.log("All files checked.");
