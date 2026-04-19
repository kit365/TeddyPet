const fs = require('fs');

const file = 'src/client/pages/booking/BookingDetail.tsx';
let txt = fs.readFileSync(file, 'utf8');

// The garbage character could be \u008D, \u00A0, space, or anything else inserted by bad encoding.
// \S usually matches non-whitespace, but \u008D is matched by \s? Actually no, \u008D is a control char.
// We can use a regex class that matches any non-word characters: [^a-zA-Z0-9_]

// chá»n -> chọn
txt = txt.replace(/c\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, 'chọn');
txt = txt.replace(/C\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, 'Chọn');

// giá» -> giờ
txt = txt.replace(/g\u00ED\u00E1\u00BB[^a-zA-Z0-9]*/gi, 'giờ '); 
txt = txt.replace(/g\u00EDa\u00BB[^a-zA-Z0-9]*/gi, 'giờ '); 
txt = txt.replace(/gi\u00E1\u00BB[^a-zA-Z0-9]{0,3}/gi, 'giờ ');

// Há»  -> Họ
txt = txt.replace(/H\u00E1\u00BB[^a-zA-Z0-9]{0,3}t\u00EAn/g, 'Họ tên');
txt = txt.replace(/H\u00E1\u00BB[^a-zA-Z0-9]{0,3}v\u00E0 t\u00EAn/g, 'Họ và tên');
txt = txt.replace(/H\u00E1\u00BB[^a-zA-Z0-9]{0,3}/g, 'Họ ');

// điá» n -> điền
txt = txt.replace(/đ\u00ED\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/gi, 'điền');
txt = txt.replace(/đi\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/gi, 'điền');

// nhiá» u -> nhiều
txt = txt.replace(/nhi\u00E1\u00BB[^a-zA-Z0-9]{0,3}u/gi, 'nhiều');

// Ä ịa -> Địa  (Ä = \u00C4)
txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,3}ịa/g, 'Địa');
txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,3}ơn/g, 'Đơn');
txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,3}ang/g, 'Đang');
txt = txt.replace(/\u00C4[^a-zA-Z0-9]{0,3}ã/g, 'Đã');

// ngưá» i -> người
txt = txt.replace(/ngư\u00E1\u00BB[^a-zA-Z0-9]{0,3}i/g, 'người');
txt = txt.replace(/Ngư\u00E1\u00BB[^a-zA-Z0-9]{0,3}i/g, 'Người');

// tiá» n -> tiền
txt = txt.replace(/ti\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, 'tiền');
txt = txt.replace(/Ti\u00E1\u00BB[^a-zA-Z0-9]{0,3}n/g, 'Tiền');

// cá» c -> cọc
txt = txt.replace(/c\u00E1\u00BB[^a-zA-Z0-9]{0,3}c/gi, 'cọc');

// vá»  -> về
txt = txt.replace(/v\u00E1\u00BB[^a-zA-Z0-9]{0,3}/gi, 'về ');

// thá» i -> thời
txt = txt.replace(/th\u00E1\u00BB[^a-zA-Z0-9]{0,3}i/gi, 'thời');

// Lá» i -> Lời
txt = txt.replace(/L\u00E1\u00BB[^a-zA-Z0-9]{0,3}i/g, 'Lời');
txt = txt.replace(/l\u00E1\u00BB[^a-zA-Z0-9]{0,3}i/g, 'lời');

// má» i -> mọi
txt = txt.replace(/m\u00E1\u00BB[^a-zA-Z0-9]{0,3}i/gi, 'mọi');

// trưá» ng -> trường
txt = txt.replace(/trư\u00E1\u00BB[^a-zA-Z0-9]{0,3}ng/gi, 'trường');

fs.writeFileSync(file, txt);
console.log("Ultimate Hex/Control Replace completed.");
