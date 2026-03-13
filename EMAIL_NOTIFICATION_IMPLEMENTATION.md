# Email Notification System cho Booking - Tóm Tắt Triển Khai

## 🎯 Tính Năng Được Triển Khai

Hệ thống gửi email thông báo tự động được phát triển hoàn chỉnh với các tính năng sau:

### 1. ✅ Khi Tạo Booking Tạm Thời (isTemporary = true)

**Sự kiện:** Sau khi khách hàng nhập thông tin ngân hàng và nhấn "Thanh toán cọc"

**Các hành động:**
- Backend tạo `BookingDeposit` với `status = "PENDING"` 
- Gửi email `sendBookingPendingDepositEmail` thông báo:
  - Đơn đặt lịch đã được xác nhận
  - Yêu cầu thanh toán cọc
  - Link để xem chi tiết và thanh toán (có nút "Xem chi tiết & Thanh toán cọc")
- Frontend tự động chuyển hướng đến trang chi tiết booking với payment view

**Màn hình sau:**
- Hiển thị chi tiết đơn đặt lịch
- Bộ hẹn giờ đếm ngược (5 phút)
- Hiển thị thông tin ngân hàng để chuyển khoản
- Nút "Thanh toán cọc ngay" để confirm thanh toán

### 2. ✅ Nhắc Nhở 2 Phút Trước Hết Hạn

**Sự kiện:** Scheduler chạy mỗi 60 giây để kiểm tra

**Logic:**
- Tìm tất cả `BookingDeposit` có:
  - `status = "PENDING"`
  - `expiresAt <= now + 2 minutes`
  - `reminderSent = false`
- Gửi email `sendBookingDepositReminderEmail` thông báo:
  - Đơn đặt lịch sắp hết hạn
  - Mau thanh toán cọc
  - Link thanh toán nhanh

**Cơ chế:** Mỗi deposit chỉ gửi nhắc nhở 1 lần (đánh dấu `reminderSent = true`)

### 3. ✅ Khi Thanh Toán Cọc Thành Công

**Sự kiện:** Admin duyệt thanh toán (simulate) hoặc API confirm

**Các hành động:**
- Cập nhật `booking.isTemporary = false`
- Cập nhật `BookingDeposit.status = "PAID"`
- Gửi email `sendBookingDepositSuccessEmail` thông báo:
  - Thanh toán cọc thành công
  - Đơn đặt lịch đã được xác nhận chính thức
  - Link xem chi tiết

### 4. ✅ Khi Booking Hết Hạn Giữ Chỗ

**Sự kiện:** Scheduler chạy mỗi 30 giây kiểm tra expired deposits

**Các hành động:**
- Tất cả giữ chỗ quá 5 phút sẽ hết hạn
- Cập nhật `booking.status = "CANCELLED"`
- Gửi email `sendBookingDepositExpiredEmail` thông báo:
  - Đơn đặt lịch đã hết thời gian giữ chỗ
  - Đơn đã được hủy tự động
  - Link để đặt lịch lại

### 5. ✅ Khi Khách Hủy Booking (Chưa Thanh Toán)

**Sự kiện:** Khách hàng nhấn "Hủy đơn đặt lịch" mà chưa thanh toán cọc

**Các hành động:**
- `booking.status = "CANCELLED"`
- Gửi email `sendBookingCancelledEmail` thông báo:
  - Đơn đặt lịch đã bị hủy
  - Có link xem chi tiết

### 6. ✅ Khi Khách Yêu Cầu Hoàn Tiền (Đã Thanh Toán)

**Sự kiện:** Khách hàng nhấn "Hủy đơn đặt lịch" với tiền hủy > 0

**Các hành động:**
- Tính toán số tiền hoàn dựa trên chính sách hoàn tiền
- `booking.cancelRequested = true`
- Gửi email `sendBookingRefundRequestedEmail` thông báo:
  - Yêu cầu hoàn tiền đã được ghi nhận
  - Số tiền hoàn dự kiến
  - Nhân viên sẽ xử lý sớm

### 7. ✅ [MỚI] Khi Admin Duyệt Hoàn Tiền

**Sự kiện:** Admin approve refund request trên dashboard

**Các hành động:**
- `booking.status = "CANCELLED"`
- Gửi email `sendBookingRefundApprovedEmail` thông báo:
  - Yêu cầu hoàn tiền đã được phê duyệt ✨ (MỚI)
  - Số tiền hoàn chính xác
  - Tiền sẽ chuyển trong 3-5 ngày làm việc

---

## 📋 Danh Sách File Đã Thay Đổi

### Backend

1. **`EmailServicePort.java`**
   - Thêm method: `sendBookingRefundApprovedEmail(String to, String bookingCode, String refundAmount)`

2. **`EmailServiceAdapter.java`**
   - Implement method `sendBookingRefundApprovedEmail()`
   - Xử lý email async với `@Async` annotation

3. **`BookingAdminApplicationService.java`**
   - Thêm logic gửi email khi admin approve refund trong `approveOrRejectCancelRequest()`

4. **`BookingDepositScheduler.java`**
   - Cải thiện: Set `reminderSentAt` timestamp khi gửi reminder email

5. **`refund-approved.html`** ✨ (File Mới)
   - Template email cho phê duyệt hoàn tiền
   - Thông báo tích cực với màu xanh (success color)
   - Bao gồm thông tin tiền hoàn, link chi tiết

---

## 🔄 Luồng Hoàn Chỉnh

```
1. Khách nhập form → Thanh toán cọc
   ↓
2. Email: "Xác nhận đặt lịch - Yêu cầu cọc" + Link xem & thanh toán
   ↓
3. (5 phút trôi qua...)
4. Email 2 phút cuối: "NHẮC NHỞ: Mau thanh toán"
   ↓
5. HOẶC Hết 5 phút:
   → Email: "Hết thời gian giữ chỗ - Chúng tôi xin lỗi"
   
   HOẶC Khách thanh toán:
   → Email: "Thanh toán cọc thành công"
   
   HOẶC Khách hủy (0% hoàn):
   → Email: "Đơn đặt lịch đã hủy"
   
   HOẶC Khách yêu cầu hoàn (>0%):
   → Email: "Yêu cầu hoàn tiền đã ghi nhận"
   → (Admin xử lý)
   → Email: "Yêu cầu hoàn tiền đã phê duyệt"
```

---

## 🎨 Email Templates Available

| Template | File | Mục Đích |
|----------|------|---------|
| Confirmation + Payment Request | `pending-deposit.html` | Khi booking tạm tạo |
| 2-Minute Reminder | `deposit-reminder.html` | Khi còn 2 phút |
| Payment Success | `deposit-success.html` | Khi cọc được thanh toán |
| Expired | `deposit-expired.html` | Khi hết hạn giữ chỗ |
| Cancelled | `booking-cancelled.html` | Khi booking bị hủy |
| Refund Requested | `refund-requested.html` | Khi yêu cầu hoàn |
| **Refund Approved** ✨ | `refund-approved.html` | **Khi admin duyệt hoàn** |

---

## ✨ Tính Năng Frontend

### Quy Trình Sau Khi Tạo Booking

1. **Automatic Navigation**: Sau khi gửi form, tự động chuyển đến `/dat-lich/chi-tiet-don/{bookingCode}`
2. **Payment View**: Hiển thị view thanh toán với:
   - ✅ Bộ hẹn giờ đếm ngược (5 phút)
   - ✅ Thông tin chuyển khoản ngân hàng
   - ✅ Lựa chọn phương thức thanh toán
   - ✅ Nút confirm thanh toán

3. **Booking Details**: Tab "Chi tiết đơn đặt lịch" hiển thị:
   - ✅ Thông tin khách hàng
   - ✅ Trạng thái thanh toán + bộ hẹn giờ
   - ✅ Chi tiết thú cưng + dịch vụ
   - ✅ Buttons: "Thanh toán cọc ngay", "Chỉnh sửa", "Hủy đơn"

---

## 🔍 Scheduler Jobs

| Job | Tần Suất | Mục Đích |
|-----|----------|---------|
| `expirePendingDepositsAndReleaseHolds` | Mỗi 30s | Hủy deposits hết hạn, nhả tài nguyên |
| `sendDepositReminders` | Mỗi 60s | Gửi nhắc nhở 2 phút cuối |

---

## 📝 Ghi Chú Quan Trọng

1. **Idempotent Design**: Reminder email chỉ gửi 1 lần per deposit (flag `reminderSent`)
2. **Async Processing**: Tất cả emails được gửi async để không block request
3. **Error Handling**: Nếu gửi email fail, log warning nhưng không crash flow
4. **Respects Configurations**: Email templates sử dụng `appName`, `hotline`, `frontendUrl` từ config
5. **Timezone Safe**: Sử dụng `LocalDateTime` cho tất cả time comparisons

---

## ✅ Test Checklist

- [ ] Tạo booking tạm → Nhận email pending deposit
- [ ] Chờ 2 phút → Nhận email reminder
- [ ] Confirm thanh toán → Nhận email success
- [ ] Hủy booking (0% hoàn) → Nhận email cancelled
- [ ] Hủy booking (>0% hoàn) → Nhận email refund requested
- [ ] Admin approve refund → Nhận email refund approved ✨
- [ ] Hết 5 phút chưa thanh toán → Nhận email expired
- [ ] Frontend navigate & show details → ✅ Working
- [ ] Countdown timer → ✅ Real-time updates

---

## 🚀 Deployment Notes

1. Đảm bảo email service đã configured đúng
2. Verify database migration đã chạy
3. Check application properties có `app.name`, `app.frontend-url`, etc.
4. Restart application để scheduler job chạy
5. Monitor logs để check email gửi successfully

