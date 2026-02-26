package fpt.teddypet.application.dto.request.orders.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public record AdminHandleReturnRequest(
                @NotNull @JsonProperty("approved") boolean approved,
                @JsonProperty("adminNote") String adminNote) {
}
