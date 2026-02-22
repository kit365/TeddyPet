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
ALTER TABLE pets ADD COLUMN age INT;
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

## ⚠️ NHỮNG ĐIỀU CẤM KỴ TỚI GIÀ
1. **KHÔNG BAO GIỜ** chỉnh sửa nội dung bên trong file Flyway cũ (ví dụ `V1__baseline.sql`) một khi file đó đã được chạy lần đầu và được Push lên nhánh Chung. Chỉnh sửa phát DB đứt bóng ngót nghẻo ngay lập tức!
2. **KHÔNG BAO GIỜ** lén đổi `ddl-auto: validate` về `update` - Việc cập nhật DB chỉ được chạy trên xe đẩy độc đạo của ông nội Flyway thôi!
