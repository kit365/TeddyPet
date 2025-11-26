# Infrastructure Layer
External concerns: databases, messaging, external APIs.

## Structure:
- `persistence/` - Database implementations
  - `postgres/` - PostgreSQL repositories (Spring Data JPA)
  - `mongodb/` - MongoDB repositories and documents
  - `redis/` - Redis cache implementations
- `messaging/` - Kafka producers/consumers, event handlers
- `external/` - External API clients
- `adapter/` - Adapters for complex integrations (optional)

