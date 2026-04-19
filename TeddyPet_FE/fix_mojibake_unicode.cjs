const fs = require('fs');

const file = 'src/client/pages/booking/BookingDetail.tsx';
let txt = fs.readFileSync(file, 'utf8');

// The problematic character combination is usually á» (U+00E1 U+00BB) followed by a space or NBSP, or just letters.
// Let's globally replace them using precise unicode.

// chá» n -> chọn
txt = txt.replace(/c\u00E1\u00BB\s*n/g, 'chọn');
txt = txt.replace(/C\u00E1\u00BB\s*n/g, 'Chọn');

// giá»  -> giờ
txt = txt.replace(/g\u00ED\u00E1\u00BB\s*/g, 'giờ '); // wait, "giá»" = g, i, á, » -> g i \u00E1 \u00BB 
txt = txt.replace(/gi\u00E1\u00BB\s*/gi, 'giờ '); // case insensitive

// Há»  -> Họ
txt = txt.replace(/H\u00E1\u00BB\s*t\u00EAn/g, 'Họ tên');
txt = txt.replace(/H\u00E1\u00BB\s*v\u00E0 t\u00EAn/g, 'Họ và tên');
txt = txt.replace(/H\u00E1\u00BB\s*/g, 'Họ ');

// điá» n -> điền
txt = txt.replace(/đ\u00ED\u00E1\u00BB\s*n/gi, 'điền');
txt = txt.replace(/đi\u00E1\u00BB\s*n/gi, 'điền');

// nhiá» u -> nhiều
txt = txt.replace(/nhi\u00E1\u00BB\s*u/gi, 'nhiều');

// Ä ịa -> Địa  (Ä = \u00C4)
txt = txt.replace(/\u00C4\s*ịa/g, 'Địa');
txt = txt.replace(/\u00C4\s*ơn/g, 'Đơn');
txt = txt.replace(/\u00C4\s*ang/g, 'Đang');
txt = txt.replace(/\u00C4\s*ã/g, 'Đã');

// ngưá» i -> người
txt = txt.replace(/ngư\u00E1\u00BB\s*i/g, 'người');
txt = txt.replace(/Ngư\u00E1\u00BB\s*i/g, 'Người');

// tiá» n -> tiền
txt = txt.replace(/ti\u00E1\u00BB\s*n/g, 'tiền');
txt = txt.replace(/Ti\u00E1\u00BB\s*n/g, 'Tiền');

// cá» c -> cọc
txt = txt.replace(/c\u00E1\u00BB\s*c/g, 'cọc');
txt = txt.replace(/C\u00E1\u00BB\s*c/g, 'Cọc');

// vá»  -> về
txt = txt.replace(/v\u00E1\u00BB\s*/g, 'về ');

// thá» i -> thời
txt = txt.replace(/th\u00E1\u00BB\s*i/g, 'thời');

// Lá» i -> Lời
txt = txt.replace(/L\u00E1\u00BB\s*i/g, 'Lời');
txt = txt.replace(/l\u00E1\u00BB\s*i/g, 'lời');

// má» i -> mọi
txt = txt.replace(/m\u00E1\u00BB\s*i/g, 'mọi');

// trưá» ng -> trường
txt = txt.replace(/trư\u00E1\u00BB\s*ng/g, 'trường');

fs.writeFileSync(file, txt);
console.log("Unicode regex replace complete.");
