# Flyway migrations — TeddyPet BE

## Tránh trùng version khi nhiều người / nhiều nhánh

Flyway chỉ cho **một file** cho mỗi số `version` trong tên. Hai file cùng `V10__...` sẽ làm ứng dụng không khởi động được.

### Quy ước cho migration **mới** (sau các file `V{number}__...` đã có trong thư mục này)

1. **Version trong tên file = timestamp** (ít khi trùng giữa các dev):
   - Format: `V{yyyyMMddHHmmss}__mo_ta_ngan_bang_snake_case.sql`
   - Ví dụ: `V20260321143000__add_loyalty_points_to_users.sql`
   - Tạo file: lấy thời điểm thực tế (hoặc `date +%Y%m%d%H%M%S` trên Unix), không copy version từ nhánh khác.

2. **Dòng đầu trong file SQL** (tùy chọn nhưng nên có): ghi ngày tạo script để review dễ, ví dụ:
   ```sql
   -- Created: 2026-03-21 (Asia/Ho_Chi_Minh) | ticket: EXE-123
   ```

3. **Trong Flyway history (DB)**  
   - Cột `description` lấy từ phần sau `V{version}__` → nếu cần “thấy ngày” ngay trên UI/tooling DB, có thể đặt mô tả dạng:  
     `V20260321143000__20260321_add_loyalty_points_to_users.sql`  
     (trùng thông tin ngày một chút nhưng rất rõ trong `flyway_schema_history.description`).
   - Cột `installed_on` đã có sẵn: thời điểm migration **được chạy** trên môi trường đó (không thay được bằng “ngày viết script” nếu không dùng custom callback).

### Không làm

- **Đổi tên / đổi version** của file migration **đã từng chạy** trên DB thật (sẽ lệch checksum / history).
- Thêm migration mới bằng số thứ tự `V14`, `V15`… nếu team hay merge song song — dễ lại bị hai `V14`. Ưu tiên **timestamp** cho file mới.

### Tham khảo

- [Flyway — Naming](https://documentation.red-gate.com/flyway/flyway-concepts/migrations#naming)

---

## Lỗi: `Validate failed` / `Migration checksum mismatch` (V1, V10, …)

Flyway lưu checksum của từng file lúc **lần đầu** migration chạy trên DB. Nếu sau đó bạn **sửa** file đó trong repo (ví dụ chỉnh `V1__baseline.sql`, hoặc đổi hẳn nội dung `V10__...`), DB vẫn giữ checksum cũ → validate fail, `entityManagerFactory` không lên.

**Cách xử lý trên Postgres local (chọn một):**

1. **JDBC trỏ `localhost` / `127.0.0.1`** — [`FlywayConfig`](../../../java/fpt/teddypet/config/FlywayConfig.java) tự gọi `repair()` trước `migrate()` (kể cả khi `SPRING_PROFILES_ACTIVE=prod`). Không cần đổi profile nếu URL datasource là local.

2. **Profile `dev`** — `repair-on-migrate: true` trong [`application-dev.yml`](../../application-dev.yml) (tương đương mục 1 nếu URL vẫn là local).

3. **Profile `prod` + `local`** — `SPRING_PROFILES_ACTIVE=prod,local` và [`application-local.yml`](../../application-local.yml) nếu muốn bật `repair-on-migrate` rõ ràng.

4. **Host DB không phải máy bạn** (RDS, `postgres` trong Docker, …): đặt `SPRING_FLYWAY_REPAIR_ON_MIGRATE=true` **một lần** nếu cần đồng bộ checksum, rồi tắt; hoặc chỉ dùng trên DB dev.

5. **DB rỗng / chỉ dữ liệu thử** — có thể `DROP` schema hoặc database rồi để Flyway migrate lại từ đầu (sạch nhất, mất data).

**Lưu ý:** `repair` chỉ sửa **metadata** (checksum, trạng thái failed), **không** chạy lại SQL của migration đã apply. Nếu từng có hai file cùng `V10` và DB thực tế đã chạy script A nhưng trong repo giờ `V10` là script B, sau repair Flyway vẫn “tin” V10 đã xong — khi đó cần **tự kiểm tra schema** (thiếu cột/sequence/constraint thì bổ sung tay hoặc thêm migration mới), hoặc reset DB dev.

Kiểm tra nhanh lịch sử:

```sql
SELECT installed_rank, version, description, type, checksum, success
FROM flyway_schema_history
ORDER BY installed_rank;
```
