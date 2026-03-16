# Luồng xử lý PayOS Webhook và lưu trữ dữ liệu

## 1. Tổng quan

- **PayOS** là cổng thanh toán VietQR (chuyển khoản ngân hàng). Khách chọn thanh toán online → hệ thống tạo **link thanh toán PayOS** → khách chuyển khoản → PayOS gửi **webhook** (POST JSON) về server để báo kết quả.
- Dữ liệu từ webhook được **verify chữ ký** (SDK PayOS), sau đó dùng để cập nhật đơn hàng và **lưu lại** vào bảng `payments` để đối soát.

## 2. Luồng từ khi khách bấm thanh toán đến khi PayOS gửi webhook

```
[Client] Chọn "Thanh toán online" 
    → Gọi API POST /api/payment/create?orderId=...&gateway=PAYOS&returnUrl=...
[Backend] PaymentApplicationService.initiatePayment()
    → Tìm Order theo orderId, kiểm tra order có numeric_code (dùng làm orderCode PayOS)
    → PayosGatewayAdapter.buildPaymentUrl(): gọi PayOS API tạo link thanh toán (orderCode = order.numericCode, amount = order.finalAmount)
    → Tạo bản ghi Payment (status=PENDING, transactionId = numericCode) và lưu DB
    → Trả về checkoutUrl cho client
[Client] Redirect khách tới checkoutUrl (trang PayOS/VietQR)
[Khách] Chuyển khoản theo hướng dẫn trên PayOS
[PayOS] Sau khi nhận tiền (hoặc hủy), PayOS server gửi POST tới URL webhook đã cấu hình (vd: https://your-domain/api/payment/payos/webhook)
```

## 3. Xử lý Webhook PayOS (khi PayOS trả JSON về)

**Bước 1 – Nhận request**  
`PaymentController.handlePayosWebhook(@RequestBody Webhook webhook)`  
- PayOS gửi body JSON gồm: `data` (object chứa orderCode, amount, code, ...) và thường có chữ ký để verify.
- Nếu `webhook.getData() == null` → trả 400.

**Bước 2 – Verify và map sang kết quả nội bộ**  
`PaymentApplicationService.processPaymentCallback(PAYOS, webhook.getData(), request)`  
→ Gọi `PayosGatewayAdapter.handleCallback(webhook, request)`:
- **Verify chữ ký**: `payOS.webhooks().verify(webhook)` trả về `WebhookData` (dữ liệu đã được PayOS xác thực).
- **Đọc trường thường dùng**: `code` (00 = thành công), `orderCode` (= numeric_code đơn hàng), `amount`.
- **Serialize toàn bộ WebhookData** thành JSON string (để lưu vào DB).
- Trả về `GatewayCallbackResult`: success, transactionId (= orderCode), message, amount, orderCode, gatewayResponseCode (= code), **rawPayload** (= JSON string).

**Bước 3 – Cập nhật Payment và Order**  
`PaymentApplicationService.updatePaymentAndOrder(result, gateway)` (khi success) hoặc `markPaymentFailed` (khi thất bại):
- Tìm `Payment` theo `transactionId` (= orderCode từ webhook).
- **Nếu thành công**:  
  - `payment.complete(...)`,  
  - Gán `payment.setGatewayResponseCode(result.gatewayResponseCode())`,  
  - Gán `payment.setGatewayRawPayload(result.rawPayload())`,  
  - Lưu Payment, cập nhật Order status (vd: PROCESSING).
- **Nếu thất bại**:  
  - `payment.fail(...)`,  
  - Vẫn set `gatewayResponseCode` và `gatewayRawPayload` rồi lưu (để có đầy đủ dữ liệu PayOS trả về).

## 4. Bảng và cột liên quan

### 4.1. Bảng `payments`

- **gateway_response_code** (VARCHAR 20): Mã trả về từ PayOS (vd: `00` = thành công, `07` = đã hủy). Lấy từ `WebhookData.getCode()`.
- **gateway_raw_payload** (TEXT): JSON đầy đủ payload webhook đã verify (toàn bộ object `WebhookData`). Dùng để đối soát với PayOS và debug, không cần parse thêm ở tầng ứng dụng nếu chỉ cần code/orderCode/amount (đã có ở cột khác).

Các cột sẵn có dùng trong luồng:
- **transaction_id**: Lúc tạo link thanh toán gán = `order.numericCode`; webhook trả `orderCode` = cùng giá trị này để tìm Payment.
- **payment_gateway**: `PAYOS`.
- **status**: PENDING → COMPLETED hoặc FAILED sau khi xử lý webhook.

### 4.2. Bảng `bank_information`

- **CUSTOMER**: tài khoản ngân hàng của khách (vd đăng ký nhận hoàn tiền) hoặc tài khoản nhận hoàn tiền đặt lịch (gắn booking).
- **SYSTEM** (account_type): **một bản ghi duy nhất** – tài khoản ngân hàng **của hệ thống** nhận tiền khi khách thanh toán online (PayOS chuyển tiền vào đây). Cấu hình trong **Cài đặt hệ thống → Thông tin tài khoản nhận tiền**.
- **GUEST** / **CUSTOMER** theo đơn hàng: Khi PayOS webhook **thành công** (code 00), nếu payload có thông tin người chuyển (`counterAccountBankId`, `counterAccountBankName`, `counterAccountName`, `counterAccountNumber`), hệ thống lưu vào `bank_information` với:
  - **order_id**: UUID đơn hàng (cột thêm ở V77).
  - **account_type**: **GUEST** nếu đơn không có user (khách vãng lai), **CUSTOMER** nếu đơn có user đăng nhập.
  - Các trường ngân hàng lấy từ webhook: bank_code/bank_name từ counterAccountBankId/counterAccountBankName, account_holder_name từ counterAccountName, account_number từ counterAccountNumber.
  - Nếu đã có bản ghi cùng `order_id` thì cập nhật, không tạo trùng.

## 5. Tóm tắt

| Bước | Nơi xử lý | Việc làm |
|------|-----------|----------|
| PayOS gửi POST JSON | PaymentController | Nhận body → gọi processPaymentCallback(PAYOS, webhook.getData()) |
| Verify + map | PayosGatewayAdapter | verify(webhook) → WebhookData; build GatewayCallbackResult (code, orderCode, amount, **rawPayload** = JSON) |
| Cập nhật DB | PaymentApplicationService | Tìm Payment theo transactionId; complete/fail; set gateway_response_code, gateway_raw_payload; save |

Nhờ đó mỗi giao dịch PayOS đều có:
- Mã phản hồi (`gateway_response_code`) để hiển thị/điều kiện,
- Nguyên bản payload (`gateway_raw_payload`) để đối soát và mở rộng sau (vd lấy thông tin ngân hàng người chuyển nếu PayOS trả trong JSON).
