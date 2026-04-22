const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/client/pages/booking/BookingDetail.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const originalLength = content.length;
let fixCount = 0;

// Map of all Vietnamese mojibake patterns to fix - including comments
const mojibakeMap = [
  // UI visible strings
  ['LÆ°u trÃº', 'Lưu trữ'],
  ['Giá dá»± kiáº¿n', 'Giá dự kiến'],
  ['ChÆ°a có dịch vụ phÃ¹ hợp', 'Chưa có dịch vụ phù hợp'],
  ['Không có tÃ¹y chọn khả dụng', 'Không có tùy chọn khả dụng'],
  ['Buá»•i sáng (AM)', 'Buổi sáng (AM)'],
  ['Buá»•i chiá»u (PM)', 'Buổi chiều (PM)'],
  ['Khung giá»', 'Khung giá'],
  ['— Chọn khung giá» —', '— Chọn khung giá —'],
  ['Ã´ Ngày gửi chung phÃ­a trên', 'ở Ngày gửi chung phía trên'],
  
  // Comments (long patterns first)
  ['Ã" Ngày gửi + Khung giá» cho dịch vụ chÃ­nh', 'Ở Ngày gửi + Khung giá cho dịch vụ chính'],
  ['Ã" Ngày gửi + Khung giá» khi', 'Ở Ngày gửi + Khung giá khi'],
  ['Náº¿u state dateFrom bá»‹ reset vá» "", váº«n lấy từ globalDateFrom đá»ƒ hiá»ƒn thá»‹/ mở sÆ¡ đá»" chÃ­nh xác', 'Nếu state dateFrom bị reset về "", vẫn lấy từ globalDateFrom để hiển thị/ mở số đúng chính xác'],
  ['Chá»‰ cần đủ ngày gửi/ngày trả hợp lá»‡ là mở sÆ¡ đá»"', 'Chỉ cần đủ ngày gửi/ngày trả hợp lệ là mở sổ đó'],
  ['Trước đây có phụ thuộc pet.pricingModel khiáº¿n một số luá»"ng reset dateFrom làm sÆ¡ đá»" không mở', 'Trước đây có phụ thuộc pet.pricingModel khiến một số lượng reset dateFrom làm sổ đó không mở'],
  ['Tá»± chọn loại phòng đầu tiên khi picker hiá»ƒn thá»‹ mà chÆ°a có loại phòng nào được chọn', 'Tự chọn loại phòng đầu tiên khi picker hiển thị mà chưa có loại phòng nào được chọn'],
];

mojibakeMap.sort((a, b) => b[0].length - a[0].length);

mojibakeMap.forEach(([from, to]) => {
  const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const matches = content.match(regex);
  if (matches) {
    fixCount += matches.length;
    content = content.replace(regex, to);
  }
});

fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ Fixed ${fixCount} mojibake occurrences in BookingDetail.tsx`);
