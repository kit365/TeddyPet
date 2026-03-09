package fpt.teddypet;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:testdb;NON_KEYWORDS=VALUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.data.mongodb.uri=mongodb://localhost:27017/test",
        "spring.kafka.bootstrap-servers=localhost:9092",
        "spring.elasticsearch.uris=http://localhost:9200",
        "spring.elasticsearch.connection-timeout=5s",
        "spring.elasticsearch.socket-timeout=60s",
        "spring.data.redis.host=localhost",
        "spring.data.redis.port=6379",
        "spring.data.redis.password=",
        "spring.data.redis.ssl.enabled=false",
        "jwt.secret.key=yoursecretkeyyoursecretkeyyoursecretkeyyoursecretkey",
        "jwt.expiration.ms=3600000",
        "payment.payos.client-id=test_id",
        "payment.payos.api-key=test_key",
        "payment.payos.checksum-key=test_checksum"
})
class TeddyPetApplicationTests {

    @Test
    void contextLoads() {
    }

}
