package fpt.teddypet.application.dto.request.staff;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Deserializes startTime/endTime from ISO-8601 (có thể kèm múi giờ) sang LocalDateTime
 * theo giờ Việt Nam (Asia/Ho_Chi_Minh), tránh lệch khi server chạy UTC.
 */
public class OpenShiftRequestDeserializer extends JsonDeserializer<OpenShiftRequest> {

    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    @Override
    public OpenShiftRequest deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        LocalDateTime startTime = parseInVietnam(node.get("startTime").asText());
        LocalDateTime endTime = parseInVietnam(node.get("endTime").asText());
        return new OpenShiftRequest(startTime, endTime);
    }

    private static LocalDateTime parseInVietnam(String iso) {
        return Instant.parse(iso).atZone(VIETNAM).toLocalDateTime();
    }
}
