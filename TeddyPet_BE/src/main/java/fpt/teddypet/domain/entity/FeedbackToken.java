package fpt.teddypet.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackToken implements Serializable {
    private UUID token;
    private UUID orderId;
    private String guestEmail;
    private long expiryMinutes;
}
