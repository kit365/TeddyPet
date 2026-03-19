package fpt.teddypet.application.dto.request.orders.order;

import jakarta.validation.constraints.NotNull;

public record AdminHandleOrderRefundRequest(
        Boolean approved,
        Boolean requireMoreInfo,
        String adminNote,
        String refundTransactionId,
        java.util.List<String> adminEvidenceUrls
) {
}

