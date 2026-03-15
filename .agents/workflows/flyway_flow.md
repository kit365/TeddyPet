---
description: Quy trình thao tác Database, Flyway và dữ liệu mẫu Dummy Data
---

# 🚀 QUY TRÌNH THEO ĐỔI DATABASE & DỮ LIỆU BẰNG FLYWAY

Kể từ nay, team TeddyPet sẽ ngưng xài tính năng `ddl-auto: update` của Hibernate để tránh việc "giẫm chân" lên Code Database của nhau. Mọi thay đổi về cấu trúc bảng (Table) đều phải thông qua **Flyway**.

Dưới đây là các lưu đồ làm việc mới dành cho BE Dev Team.

---

## 1️⃣ Kịch Bản 1: Muốn Thêm Mới, Thay Đổi hoặc Xóa một Cột trong Database
Sau khi bồ thêm một trường vào Code Entity Java, bắt buộc bạn phải viết lệnh SQL cho Flyway thực thi việc đó xuống Database.

**Bước 1: Cập nhật Entity Code Java**
```java
@Column(name = "age")
private Integer age;
```

**Bước 2: Tạo File Flyway Migrations**
1. Vào thư mục: `src/main/resources/db/migration`
2. Tạo 1 file mới với phiên bản **lớn hơn** phiên bản hiện tại. Mẫu File: `V{Version}__{Mô_tả_bằng_tiếng_Anh_viết_thường}.sql` (Ví dụ: `V3__add_age_to_pets.sql`)
3. Viết câu lệnh DDL SQL bên trong:
```sql
ALTER TABLE pets ADD COLUMN IF NOT EXISTS age INT;
```
**👉 QUY TẮC BẮT BUỘC (IDEMPOTENT):** Tuyệt đối không viết câu lệnh suông. Luôn phải có `IF NOT EXISTS` hoặc bọc trong khối `DO $$`.
*   **Thêm cột:** `ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name ...;`
*   **Tạo bảng:** `CREATE TABLE IF NOT EXISTS table_name (...);`
*   **Tạo Index:** `CREATE INDEX IF NOT EXISTS index_name ON ...;`
*   **Đổi tên cột (Nâng cao):** 
```sql
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='table_name' AND column_name='old_name') THEN
        ALTER TABLE table_name RENAME COLUMN old_name TO new_name;
    END IF;
END $$;
```
**👉 Kết quả:** Khi chạy lại Spring Boot, Flyway sẽ tự đọc file `V3...` và thêm cột vào DB, lúc nay Hibernate check lại tính hợp lệ (`validate`) sẽ báo PASS! Cả team cùng Pull file SQL này về nó cũng sẽ tự Alter DB cho mọi người.

---

## 2️⃣ Kịch Bản 2: Thêm mới 1 Khối lượng Data Mẫu từ Spring Boot (Dummy Data)
Nếu bạn thêm 1 Menu hay Chức Năng mới, bạn muốn lúc Test App cắm tự sinh 100 dòng Data mẫu để Frontend vể dễ Code. Bạn sẽ gọi qua các Class Initializer. 

**Quy tắc CỐT LÕI:** Các đoạn Code sinh "Rác Data Mẫu" luôn luôn phải bị chặn lại ở cửa Production.
```java
@Component
@Profile("!prod") // <--- CHẶN CHẠY DATA INIT VÀO DATABASE PROD
@Order(11) // Thứ tự sau các Init cũ
public class NewFeatureDataInit implements CommandLineRunner {
    ... // Chèn nội dung Database tại đây
}
```
Mã này sẽ vẫn chạy khi test App ở nhà hoặc khi lên môi trường `test/cicd`, yên tâm thả ga phá phách.

---

## 3️⃣ Kịch Bản 3: Sao lưu DB bằng Tay (Dọn dẹp làm mồi) - Advanced
Dịch vụ ở Prod (Neon/Render) đã có cơ chế lưu trữ tự động. Tuy nhiên nếu bạn muốn lấy DB Local (những cấu hình setting đặc biệt) nộp lên chia sẻ cho Tester, hãy nhờ `pg_dump`:

Lấy Terminal và chạy dòng lệnh kết xuất dữ liệu này (Docker Required):
```bash
docker exec teddypet-postgres pg_dump -U myuser -d teddypet --data-only --inserts -T flyway_schema_history > src/main/resources/db/migration/V999__dump_data.sql
``` 
Lưu ý: Không lạm dụng bước 3 liên tục, nó sẽ làm phình to cục Source code của bạn trên Github! Nên chèn bằng Java CommandLineRunner như ở (Kịch Bản 2) sẽ có logic mềm dẻo hơn.

---

## 4️⃣ Kịch Bản 4: Xử lý khi Merge Code bị lệch cấu trúc Database (RẤT QUAN TRỌNG)
Đây là trường hợp bồ vừa Pull code mới về, trong code Java có thêm Entity/Field mới nhưng DB Local của bồ là đồ cũ.

**❌ Cách Sai:** Sửa nội dung file `V1__baseline.sql` cũ. (Flyway sẽ không chạy lại file này và bồ sẽ bị lỗi "Missing Column").
**✅ Cách Đúng (Chọn 1 trong 2):**
*   **Cách A (Reset nhanh):** Nếu dữ liệu local không quan trọng, hãy Xóa Schema (Clean DB) để Flyway chạy lại từ đầu file Baseline mới nhất.
*   **Cách B (Tạo file bù):** Tạo file migration mới (ví dụ `V20__patch_missing_columns.sql`) để thêm những cột còn thiếu.

---

## ⚠️ NHỮNG ĐIỀU CẤM KỴ & QUY TẮC VÀNG
1.  **QUY TẮC VÀNG (Idempotent):** Luôn dùng `CREATE TABLE IF NOT EXISTS` và `ADD COLUMN IF NOT EXISTS` trong các file SQL. Nó giúp script của bồ chạy ở máy nào cũng không bị lỗi "Relation already exists".
2.  **KHÔNG BAO GIỜ** chỉnh sửa nội dung bên trong file Flyway cũ một khi file đó đã được Push lên nhánh Chung. Flyway dùng cơ chế Checksum, bồ sửa 1 dấu phẩy là nó báo lỗi "Migration checksum mismatch" ngay.
3.  **BASELINE LÀ DUY NHẤT:** File `V1__baseline.sql` chỉ nên được "xây lại" (Re-baseline) khi team thống nhất tổng lực (thường là sau khi merge một Feature lớn). Khi đã chốt xong, tuyệt đối đóng băng nó.
4.  **KHÔNG LÉN ĐỔI:** Giữ nguyên `ddl-auto: validate`. Nếu bồ đổi sang `update`, bồ sẽ không biết DB của mình đang lệch với team như thế nào cho đến khi lên Prod và... BÙM!
5.  **FLYWAY GUARDIAN (GÁC CỔNG):** Trước khi Push code, **BẮT BUỘC** chạy lệnh sau để check lỗi migration:
    `mvn test -Dtest=FlywayMigrationTest -Dspring.profiles.active=ci`
    Lệnh này sẽ giả lập môi trường Server để chạy thử toàn bộ database từ số 0. Nếu nó FAIL, tuyệt đối không được Push.

---

## 🛠 XỬ LÝ LỖI THƯỜNG GẶP
*   **Lỗi "Missing column [xyz]":** Do code Java có field `xyz` nhưng DB chưa có cột. -> Tạo file migration mới để `ADD COLUMN`.
*   **Lỗi "Migration checksum mismatch":** Do bồ lỡ tay sửa nội dung file SQL cũ. 
    *   **Cách xử lý:** 
        1.  **TUYỆT ĐỐI KHÔNG** sửa nội dung file cũ nếu đã Push.
        2.  Nếu đã lỡ sửa và bị lỗi, hãy Revert file về trạng thái cũ.
        3.  Nếu bắt buộc phải sửa (ví dụ sửa lỗi typo làm sập App), sau khi sửa bồ **PHẢI** chạy lệnh này để cập nhật lại checksum:
            `mvn flyway:repair`
*   **Lỗi "Relation [abc] already exists":** Do bồ chạy lệnh `CREATE TABLE` mà bảng đó đã có rồi. 
    *   **Quy tắc:** Mọi script từ nay về sau **PHẢI** dùng `IF NOT EXISTS`.
    *   Nếu gặp lỗi này ở file CŨ (V1-V73), hãy dùng lệnh `mvn flyway:repair` để Flyway bỏ qua các bước đã lỗi.
