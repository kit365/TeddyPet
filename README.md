# 🐾 TeddyPet

> Hệ thống Quản lý Thú cưng được xây dựng với Spring Boot, React & Flutter

Nền tảng quản lý thú cưng toàn diện với Backend Spring Boot, Web Admin React và Mobile App Flutter. Dự án tuân theo **Clean Architecture** (Ports & Adapters) để đảm bảo tính mở rộng và bảo trì lâu dài.

---

## 🚀 Công nghệ Sử dụng

### 🖥️ Hệ thống Backend
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.0-brightgreen?logo=spring-boot)
![Java](https://img.shields.io/badge/Java-21-orange?logo=java)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-Cache-red?logo=redis)
![Flyway](https://img.shields.io/badge/Flyway-Migration-CC0202?logo=flyway)

### 🌐 Web Admin
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)

### 📱 Mobile Application
![Flutter](https://img.shields.io/badge/Flutter-3.24+-02569B?logo=flutter)
![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?logo=dart)
![Shorebird](https://img.shields.io/badge/Shorebird-Code%20Push-FF4B4B)

### 🔄 CI/CD & DevOps
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions)
![Docker](https://img.shields.io/badge/Docker-Containerization-2496ED?logo=docker)

---

## ✨ Chi tiết Tính năng

### 🔧 Web Admin (Quản trị viên)
- **Dashboard & Analytics**: Biểu đồ thống kê doanh thu, số lượng đơn hàng, dịch vụ phổ biến và hiệu suất nhân viên.
- **Booking Management**: Quản lý lịch đặt chỗ, check-in/check-out, xử lý thanh toán cọc và tự động giải phóng phòng.
- **Service & Product**: Quản lý danh mục dịch vụ, phòng/chuồng (Rooms/Slots), và kho hàng sản phẩm với biến thể (variants).
- **Staff & Work Shifts**: Điều phối ca làm việc của nhân sự, gán nhân viên vào dịch vụ cụ thể.
- **Configuration**: Cấu hình hệ thống toàn cục (e.g., phí no-show, thời gian hủy lịch tối đa).

### 🤳 Flutter Mobile App (Khách hàng)
- **Booking Wizard**: Quy trình đặt lịch thông minh, tự động gợi ý phòng trống và nhân viên phù hợp.
- **Pet Management**: Tạo hồ sơ thú cưng, theo dõi lịch sử dịch vụ và tình trạng sức khỏe.
- **Real-time Chat**: Giao tiếp trực tiếp với cửa hàng qua WebSocket.
- **Smart Notifications**: Nhận thông báo nhắc lịch, xác nhận thanh toán và ưu đãi mới.
- **Integrated Payment**: Thanh toán an toàn qua PayOS với QR Code tự động.
- **Review & Feedback**: Chụp và gửi ảnh đánh giá dịch vụ trực tiếp từ ứng dụng.

---

## 🏗️ Kiến trúc Hệ thống

Dự án áp dụng mô hình **Clean Architecture** (Hexagonal Architecture) với cấu trúc phân lớp nghiêm ngặt:

```
📦 src/main/java/fpt/teddypet/
├── 🎯 domain/           # Core Entities, Enums, Domain Exceptions
├── 📋 application/      # Use Cases, DTOs, Mappers, Port Interfaces
├── 🔌 infrastructure/   # Adapters: Logic Persistence (DB), External APIs (PayOS, Cloudinary)
└── 🌐 presentation/     # Interface Adapters: REST APIs, Security (JWT)
```

---

## 🛠️ Bắt đầu Phát triển

### Yêu cầu Hệ thống
- **Java**: Version 21
- **Node.js**: Version 20+
- **Flutter**: Version 3.24.x
- **Docker & Docker Compose** (để chạy DB & Redis cục bộ)

### Setup nhanh
1. **Clone Repo**: `git clone https://github.com/kit365/TeddyPet.git`
2. **Infrastructure**: Chạy `docker-compose up -d` để khởi động cơ sở dữ liệu.
3. **Backend**: `mvn spring-boot:run`
4. **Web Admin**: `cd TeddyPet_FE && npm install && npm run dev`
5. **Mobile**: `cd teddypet_mobile && flutter run`

---

## 🔄 CI/CD Pipeline

Pipeline tự động hóa được thiết lập qua **GitHub Actions** (chỉ áp dụng cho nhánh `main` và `staging`):

- **Build & Test**: Tự động build source code và chạy unit tests.
- **Security Scan**: Quét lỗ hổng bảo mật và kiểm tra code quality.
- **Dockerization**: Build Docker images và đẩy lên Registry.
- **Auto Deploy**: Triển khai trực tiếp lên VPS khi có commit hoặc merge vào nhánh release.

---

<div align="center">
Được tạo với ❤️ bởi Đội ngũ TeddyPet. Chúc bạn có trải nghiệm tuyệt vời!
</div>
