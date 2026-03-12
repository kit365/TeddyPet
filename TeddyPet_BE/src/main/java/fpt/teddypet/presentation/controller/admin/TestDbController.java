package fpt.teddypet.presentation.controller.admin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;
@RestController
public class TestDbController {
    @Autowired
    private JdbcTemplate jdbcTemplate;
    @GetMapping("/api/test-db")
    public List<Map<String, Object>> testDb() {
        return jdbcTemplate.queryForList("SELECT id, booking_type, payment_status, status FROM bookings");
    }
}
