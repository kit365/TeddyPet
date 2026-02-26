package fpt.teddypet.domain.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

/**
 * Persists List&lt;String&gt; as JSON array in a TEXT column.
 * Backward compatible: if existing DB values are non-JSON, attempts to parse comma/newline-separated values.
 */
@Converter
public class StringListJsonConverter implements AttributeConverter<List<String>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> LIST_STRING = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null) return null;
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize list to JSON", e);
        }
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new ArrayList<>();
        String trimmed = dbData.trim();
        try {
            if (trimmed.startsWith("[")) {
                return MAPPER.readValue(trimmed, LIST_STRING);
            }
        } catch (Exception ignored) {
            // fall through to legacy parsing
        }

        // Legacy parsing: split by comma or new line
        String normalized = trimmed.replace("\\r\\n", "\\n");
        String[] parts = normalized.split("[,\\n]");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            if (p == null) continue;
            String v = p.trim();
            if (!v.isEmpty()) out.add(v);
        }
        return out;
    }
}

