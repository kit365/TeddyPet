const fs = require('fs');
const file = 'src/client/pages/booking/BookingDetail.tsx';
let txt = fs.readFileSync(file, 'utf8');

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
txt = txt.replace(/cá[^a-zA-Z0-9]{1,4}c/g, 'cọc');
txt = txt.replace(/vá[^a-zA-Z0-9]{1,4}/g, 'về ');
txt = txt.replace(/thá[^a-zA-Z0-9]{1,4}i/g, 'thời');
txt = txt.replace(/Lá[^a-zA-Z0-9]{1,4}i/g, 'Lời');
txt = txt.replace(/má[^a-zA-Z0-9]{1,4}i/g, 'mọi');
txt = txt.replace(/trưá[^a-zA-Z0-9]{1,4}ng/g, 'trường');

// Replace any remaining weird Ä occurrences
txt = txt.replace(/Ä[^a-zA-Z0-9]{1,4}ơn/g, 'Đơn');
txt = txt.replace(/Ä[^a-zA-Z0-9]{1,4}ang/g, 'Đang');
txt = txt.replace(/Ä[^a-zA-Z0-9]{1,4}ã/g, 'Đã');

// Any trailing 'á»' fragments that didn't match the above
txt = txt.replace(/á[^a-zA-Z0-9]{1,4}n(?!\w)/g, 'ọn');
// Remove any residual Ã
txt = txt.replace(/Ã[^a-zA-Z0-9]{1,4}\s/g, 'à ');

fs.writeFileSync(file, txt);
console.log("Broad regex replace completed.");
