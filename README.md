# 🐾 TeddyPet

> Hệ thống Quản lý Thú cưng được xây dựng với Spring Boot & React

Nền tảng quản lý thú cưng toàn diện với Backend Spring Boot và Frontend React, được xây dựng bằng các công nghệ hiện đại, tuân theo **Clean Architecture** với nguyên tắc tách biệt nghiệp vụ khỏi framework và hạ tầng.

---

## 🚀 Công nghệ Sử dụng

### Backend Framework
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.7-brightgreen?logo=spring-boot)
![Java](https://img.shields.io/badge/Java-21-orange?logo=java)
![Maven](https://img.shields.io/badge/Maven-3.x-red?logo=apache-maven)

### Frontend Framework
![React](https://img.shields.io/badge/React-Latest-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Latest-green?logo=node.js)

### Bảo mật & Xác thực
![Spring Security](https://img.shields.io/badge/Spring%20Security-Latest-brightgreen?logo=spring)
![JWT](https://img.shields.io/badge/JWT-Authentication-red?logo=json-web-tokens)
![OAuth2](https://img.shields.io/badge/OAuth2-Client-blue)

### Cơ sở Dữ liệu
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Cache-red?logo=redis)

### Messaging & Giao tiếp
![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-Event%20Streaming-orange?logo=apache-kafka)
![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-blue?logo=socket.io)

### Công cụ Phát triển
![MapStruct](https://img.shields.io/badge/MapStruct-1.6.3-blue?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMTIgMkwxLjcgMjEuNUg3LjNsMy41LTQuNkwxNy4yIDIxLjVIMjIuM0wxMiAyek0xMS43IDE3TDIgNEg2TDEyIDE3SDExLjd6Ii8+PC9zdmc+)
![Lombok](https://img.shields.io/badge/Lombok-1.18.30-pink?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTUuMTdsNy41OS03LjU5TDE5IDZsLTkgOXoiLz48L3N2Zz4=)

### Tài liệu & Kiểm thử
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?logo=swagger)
![Spring Boot Test](https://img.shields.io/badge/Testing-JUnit%20%7C%20AssertJ-blue)

### DevOps & Công cụ
![Docker](https://img.shields.io/badge/Docker-Containerization-blue?logo=docker)
![CI/CD](https://img.shields.io/badge/CI%2FCD-Coming%20Soon-orange?logo=github-actions)
![Thymeleaf](https://img.shields.io/badge/Thymeleaf-Template%20Engine-green)
![Spring Mail](https://img.shields.io/badge/Spring%20Mail-Email-orange)
![AOP](https://img.shields.io/badge/AOP-Aspect--Oriented-blue)

---

## 🏗️ Kiến trúc

Dự án này tuân theo mô hình **Clean Architecture**, được xây dựng dựa trên nguyên tắc **Ports & Adapters** từ Hexagonal Architecture. Kiến trúc này đảm bảo tách biệt nghiệp vụ khỏi framework và hạ tầng với 4 tầng rõ ràng.

### Kiến trúc 4 Tầng

```
📦 teddypet
├── 🎯 domain/           # Entities Layer - Thực thể nghiệp vụ cốt lõi
├── 📋 application/      # Use Cases Layer - Logic nghiệp vụ, ports
├── 🔌 infrastructure/   # Frameworks & Drivers - Adapters thực thi
│   ├── persistence/     # PostgreSQL, MongoDB, Redis
│   ├── messaging/       # Kafka producers/consumers
│   └── external/        # External API adapters
└── 🌐 presentation/     # Interface Adapters - REST APIs, security
```

### Trách nhiệm từng Tầng

#### 🎯 Domain Layer (Entities)
- **Mục đích**: Thực thể nghiệp vụ cốt lõi, value objects, domain logic
- **Không phụ thuộc**: Không phụ thuộc vào bất kỳ layer nào khác
- **Chứa**: Entities, Enums, Value Objects, Domain Exceptions

#### 📋 Application Layer (Use Cases)
- **Mục đích**: Use cases, business orchestration, ports (interfaces)
- **Phụ thuộc**: Chỉ phụ thuộc Domain Layer
- **Chứa**: 
  - Use Cases / Services
  - DTOs (Request/Response)
  - Ports (Input/Output interfaces) - định nghĩa contracts
  - Mappers

#### 🔌 Infrastructure Layer (Adapters)
- **Mục đích**: Implement các ports từ Application Layer (Ports & Adapters pattern)
- **Phụ thuộc**: Application & Domain Layers
- **Chứa**: 
  - Database Repositories (PostgreSQL, MongoDB, Redis) - Adapters cho persistence
  - Kafka Producers/Consumers - Adapters cho messaging
  - External API Clients - Adapters cho external services

#### 🌐 Presentation Layer (Interface Adapters)
- **Mục đích**: Giao tiếp với thế giới bên ngoài (HTTP, WebSocket)
- **Phụ thuộc**: Application & Domain Layers
- **Chứa**: 
  - REST Controllers
  - Security Configuration (JWT)
  - Exception Handlers
  - HTTP Filters

### Nguyên tắc Dependency Rule

```
Outer layers → Inner layers
Presentation → Application → Domain
Infrastructure → Application → Domain
```

**Luồng phụ thuộc chỉ hướng vào trong**, đảm bảo business logic độc lập với framework và hạ tầng.

---

## ✨ Tính năng

- 🔐 **Xác thực & Phân quyền**
  - Xác thực dựa trên JWT
  - Tích hợp OAuth2
  - Kiểm soát truy cập dựa trên vai trò (RBAC)

- 🗄️ **Hỗ trợ Đa Cơ sở Dữ liệu**
  - PostgreSQL cho dữ liệu quan hệ
  - MongoDB cho lưu trữ document
  - Redis cho cache

- 📨 **Kiến trúc Hướng Sự kiện**
  - Kafka cho messaging không đồng bộ
  - Xuất bản và tiêu thụ sự kiện

- 💬 **Giao tiếp Real-time**
  - Hỗ trợ WebSocket cho cập nhật trực tiếp

- 📧 **Dịch vụ Email**
  - Tích hợp Spring Mail cho thông báo

- 📚 **Tài liệu API**
  - Tài liệu Swagger/OpenAPI
  - Trình khám phá API tương tác

- 🐳 **Containerization**
  - Hỗ trợ Docker & Docker Compose
  - Cấu hình triển khai dễ dàng

---

## 🛠️ Bắt đầu

### Yêu cầu

**Backend:**
- Java 21+
- Maven 3.8+
- Docker & Docker Compose (tùy chọn)
- PostgreSQL
- MongoDB
- Redis
- Kafka

**Frontend:**
- Node.js 18+
- npm hoặc yarn

### Cài đặt

1. **Clone repository**
```bash
git clone https://github.com/kit365/teddypet.git
cd teddypet
```

2. **Cấu hình biến môi trường**
Tạo file `.env` trong thư mục gốc:
```env
SERVER_PORT=8080
SPRING_JWT_SECRET_KEY=your-secret-key
SPRING_JWT_EXPIRATION_MS=3600000
SPRING_BACKEND_URL=http://localhost:8080
```

3. **Chạy với Docker Compose** (Khuyến nghị)
```bash
cd teddypet
docker-compose up -d
```

4. **Hoặc chạy thủ công Backend**
```bash
cd teddypet
mvn clean install
mvn spring-boot:run
```

5. **Chạy Frontend** (sẽ thêm sau)
```bash
cd frontend
npm install
npm start
```

### Truy cập Ứng dụng

- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs**: http://localhost:8080/api-docs
- **Frontend**: http://localhost:3000 (sẽ thêm sau)

---

## 📁 Cấu trúc Dự án

```
teddypet/
├── src/
│   ├── main/
│   │   ├── java/fpt/teddypet/
│   │   │   ├── application/     # Tầng ứng dụng
│   │   │   │   ├── dto/         # Data Transfer Objects
│   │   │   │   ├── mapper/      # MapStruct mappers
│   │   │   │   ├── port/        # Port interfaces
│   │   │   │   ├── service/     # Application services
│   │   │   │   └── usecase/     # Use cases
│   │   │   ├── config/          # Lớp cấu hình
│   │   │   ├── domain/          # Tầng nghiệp vụ
│   │   │   │   ├── entity/      # Thực thể nghiệp vụ
│   │   │   │   ├── enums/       # Enum nghiệp vụ
│   │   │   │   └── valueobject/ # Value objects
│   │   │   ├── infrastructure/  # Tầng hạ tầng
│   │   │   │   ├── persistence/ # Database repositories
│   │   │   │   ├── messaging/   # Kafka messaging
│   │   │   │   └── external/    # External adapters
│   │   │   └── presentation/    # Tầng trình bày
│   │   │       ├── controller/  # REST controllers
│   │   │       ├── security/    # Cấu hình bảo mật
│   │   │       ├── filter/      # HTTP filters
│   │   │       └── exception/   # Exception handlers
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── application-prod.yml
│   └── test/                    # File kiểm thử
├── Dockerfile
├── docker-compose.yml
└── pom.xml
```

---

## 📝 Phát triển

### Backend

**Build**
```bash
cd teddypet
mvn clean install
```

**Chạy Tests**
```bash
mvn test
```

**Chạy Ứng dụng**
```bash
mvn spring-boot:run
```

### Frontend (sẽ thêm sau)

**Cài đặt dependencies**
```bash
cd frontend
npm install
```

**Chạy development server**
```bash
npm start
```

**Build production**
```bash
npm run build
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng gửi Pull Request.

---

## 📄 License

Dự án này được cấp phép theo MIT License.

---

## 👥 Tác giả

- **Team TeddyPet**

---

## 🔄 CI/CD

> **Sắp có**: CI/CD pipeline sẽ được thêm vào để tự động hóa build, test và deployment.

---

## 🔗 Liên kết

- [GitHub Repository](https://github.com/kit365/teddypet)
- [API Documentation](http://localhost:8080/swagger-ui.html)

---

<div align="center">

Được tạo với ❤️ bằng Spring Boot & React

</div>
