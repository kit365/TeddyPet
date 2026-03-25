package fpt.teddypet.application.dto.response.staff;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Serializes LocalDateTime (giờ Việt Nam) ra ISO-8601 kèm offset +07:00
 * để frontend hiển thị đúng (tránh chuỗi không múi giờ bị parse thành giờ local sai).
 */
public class VietnamLocalDateTimeSerializer extends StdSerializer<LocalDateTime> {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    public VietnamLocalDateTimeSerializer() {
        super(LocalDateTime.class);
    }

    @Override
    public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider provider) throws IOException {
        if (value == null) {
            gen.writeNull();
            return;
        }
        String iso = value.atZone(VIETNAM).format(FORMATTER);
        gen.writeString(iso);
    }
}
