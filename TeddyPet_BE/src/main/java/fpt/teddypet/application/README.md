# Application Layer
Business logic, use cases, DTOs, and application services.

## Structure:
- `service/` - Application Services (business logic, orchestration)
  - Implements `port/input/` interfaces
  - Contains business rules and use case logic
  - Uses repositories directly from infrastructure layer
- `usecase/` - Use case implementations (optional, can use service instead)
- `dto/` - Data Transfer Objects (request/response)
- `mapper/` - MapStruct mappers
- `port/` - Ports (interfaces)
  - `input/` - Input ports (use case/service interfaces)
  - `output/` - Output ports (for external services, messaging, etc. - optional)

