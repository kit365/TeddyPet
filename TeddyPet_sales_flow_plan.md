# Kế hoạch phát triển tính năng bán hàng cho TeddyPet

Dựa trên cấu trúc source code backend hiện tại, dưới đây là phân tích về luồng bán hàng, các tính năng còn thiếu và đề xuất phát triển nhằm hoàn thiện trải nghiệm E-commerce cho TeddyPet.

## 1. Mức độ hoàn thiện hiện tại

Hệ thống hiện tại đã cover được phần lớn các tính năng cốt lõi cơ bản:
- **Sản phẩm (Product):** Quản lý Product, Category, Brand, Variant, Attribute, Image, Tag, Age Range.
- **Giỏ hàng (Cart):** Thêm, sửa, xóa, và đặc biệt là tính năng đồng bộ giỏ hàng cho Guest (Khách chưa đăng nhập).
- **Khuyến mãi (Promotions):** Có hệ thống mã giảm giá/khuyến mãi.
- **Thanh toán (Payment):** Hỗ trợ đa dạng nền tảng: CASH (COD), BANK_TRANSFER, CREDIT_CARD, E_WALLET (VnPay).  
- **Giao hàng (Shipping):** Có tính phí ship tự động và cho phép Admin cập nhật phí ship thủ công.
- **Đơn hàng (Order):** Tạo, theo dõi (cả user và guest), hủy (user/admin), hoàn trả (return), cập nhật trạng thái.
- **Sau mua hàng:** Đánh giá sản phẩm (Rating), Phản hồi (Feedback).

---

## 2. Các tính năng cốt lõi CÒN THIẾU

Để nâng tầm trải nghiệm mua sắm chuyên nghiệp (đặc biệt trong ngành hàng thú cưng với tỉ lệ tái mua cao), dự án đang cần bổ sung các nhóm tính năng sau:

### Giai đoạn Trước khi mua (Pre-purchase / Discovery)
1. **Sản phẩm Yêu thích (Wishlist):**
   - Cho phép người dùng lưu lại các sản phẩm yêu thích vào một danh sách riêng để dễ dàng mua sau.
2. **Sản phẩm đã xem gần đây (Recently Viewed):**
   - Khuyến khích mua hàng bằng cách hiển thị lại các sản phẩm user vừa xem (lưu qua LocalStorage hoặc Database).
3. **Gợi ý sản phẩm chéo (Cross-sell / Up-sell):**
   - Đề xuất các sản phẩm liên quan (Ví dụ: "Sản phẩm thường được mua cùng nhau", hoặc cùng Category/Thương hiệu).

### Giai đoạn Mua sắm & Thanh toán (Checkout & Purchase)
4. **Flash Sale / Deal Chớp Nhoáng:**
   - Tạo các đợt giảm giá giới hạn thời gian (Countdown timer banner) để kích thích nhu cầu chốt đơn nhanh.
5. **Xuất hóa đơn điện tử (PDF Invoicing):**
   - Cho phép Admin xuất file PDF hóa đơn để in dán lên kiện hàng; cho phép User tải xuống biên lai số.
6. **Nhắc nhở giỏ hàng bị bỏ quên (Abandoned Cart Tracking):**
   - Tự động gửi Email thông báo nếu khách hàng đã thêm sản phẩm vào giỏ nhưng không checkout sau X giờ.

### Giai đoạn Sau mua hàng (Post-purchase & Retention)
7. **Tích điểm thành viên (Loyalty / Reward Points):**
   - Đơn hàng hoàn thành (Delivered) sẽ tự động cộng điểm cho User. Điểm có thể được dùng để chiết khấu trực tiếp ở các đơn hàng tiếp theo.
8. **Ví hoàn tiền / Ví tài khoản nội bộ (E-Wallet / Refund Wallet):**
   - Khi khách hàng hủy đơn và yêu cầu hoàn tiền, thay vì chuyển khoản thủ công, admin có thể cộng tiền vào "Ví TeddyPet" để khách tiếp tục mua sắm (giúp giữ chân khách hàng).
9. **Tích hợp API Vận chuyển (GHTK / GHN):**
   - Gọi API của đơn vị vận chuyển để đẩy đơn tự động và theo dõi lộ trình thời gian thực (Webhook tra cứu vận đơn).

---

## 3. Lộ trình triển khai đề xuất (Roadmap)
- Gửi Email tự động cho giỏ hàng bị bỏ quên (Scheduled Tasks).
- Quản lý Ví nội bộ (Refund Wallet).
