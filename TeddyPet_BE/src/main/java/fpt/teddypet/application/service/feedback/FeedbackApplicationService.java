package fpt.teddypet.application.service.feedback;

import fpt.teddypet.application.constants.feedback.FeedbackMessages;
import fpt.teddypet.application.dto.request.feedback.FeedbackRequest;
import fpt.teddypet.application.dto.response.feedback.FeedbackItemResponse;
import fpt.teddypet.application.dto.response.feedback.FeedbackResponse;
import fpt.teddypet.application.dto.response.feedback.FeedbackTokenResponse;
import fpt.teddypet.application.mapper.feedback.FeedbackMapper;
import fpt.teddypet.application.port.input.feedback.FeedbackService;
import fpt.teddypet.application.port.output.EmailServicePort;
import fpt.teddypet.application.port.output.feedback.FeedbackRepositoryPort;
import fpt.teddypet.application.port.output.feedback.FeedbackTokenRepositoryPort;
import fpt.teddypet.application.port.output.orders.order.OrderRepositoryPort;
import fpt.teddypet.application.port.output.products.ProductRepositoryPort;
import fpt.teddypet.application.port.output.products.ProductVariantRepositoryPort;
import fpt.teddypet.application.util.SecurityUtil;
import fpt.teddypet.domain.entity.*;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.application.port.output.NotificationPublisherPort;
import fpt.teddypet.application.dto.response.notification.NotificationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackApplicationService implements FeedbackService {

    private final FeedbackRepositoryPort feedbackRepositoryPort;
    private final FeedbackTokenRepositoryPort feedbackTokenRepositoryPort;
    private final OrderRepositoryPort orderRepositoryPort;
    private final ProductRepositoryPort productRepositoryPort;
    private final ProductVariantRepositoryPort productVariantRepositoryPort;
    private final FeedbackMapper feedbackMapper;
    private final EmailServicePort emailServicePort;
    private final NotificationPublisherPort notificationPublisherPort;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getAllFeedbacks() {
        return feedbackRepositoryPort.findAll().stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FeedbackResponse submitFeedback(FeedbackRequest request) {

        Order order;
        User user = null;
        String guestEmail = null;
        String guestName = null;

        if (request.token() != null) {
            FeedbackToken token = feedbackTokenRepositoryPort.findByToken(request.token())
                    .orElseThrow(() -> new IllegalArgumentException(FeedbackMessages.MESSAGE_FEEDBACK_INVALID_TOKEN));
            order = orderRepositoryPort.findById(token.getOrderId());
            guestEmail = token.getGuestEmail();
            guestName = order.getShippingName();
        } else if (request.orderId() != null) {
            UUID userId = SecurityUtil.getCurrentUserId();
            order = orderRepositoryPort.findById(request.orderId());
            if (order.getUser() == null || !order.getUser().getId().equals(userId)) {
                throw new AccessDeniedException("You don't have permission to review this order.");
            }
            user = order.getUser();
        } else {
            throw new IllegalArgumentException("Order information or token is required.");
        }

        if (order.getStatus() != OrderStatusEnum.COMPLETED) {
            throw new IllegalStateException(FeedbackMessages.MESSAGE_FEEDBACK_ORDER_NOT_COMPLETED);
        }

        // Verify product in order
        boolean productInOrder = order.getOrderItems().stream()
                .anyMatch(item -> item.getProduct().getId().equals(request.productId()) &&
                        (request.variantId() == null || (item.getVariant() != null
                                && item.getVariant().getVariantId().equals(request.variantId()))));

        if (!productInOrder) {
            throw new IllegalArgumentException(FeedbackMessages.MESSAGE_FEEDBACK_PRODUCT_NOT_IN_ORDER);
        }

        // Check if already exist
        if (feedbackRepositoryPort.existsByOrderIdAndProductIdAndVariantId(order.getId(), request.productId(),
                request.variantId())) {
            throw new IllegalArgumentException(FeedbackMessages.MESSAGE_FEEDBACK_ALREADY_EXISTS);
        }

        Product product = productRepositoryPort.findByIdAndIsDeletedFalse(request.productId())
                .orElseThrow(() -> new EntityNotFoundException("Product not found"));

        ProductVariant variant = null;
        if (request.variantId() != null) {
            variant = productVariantRepositoryPort.findById(request.variantId())
                    .orElseThrow(() -> new EntityNotFoundException("Variant not found"));
        }

        Feedback feedback = Feedback.builder()
                .order(order)
                .user(user)
                .guestEmail(guestEmail)
                .guestName(guestName)
                .product(product)
                .variant(variant)
                .rating(request.rating())
                .comment(request.comment())
                .isPurchased(true)
                .isEdited(false)
                .build();

        Feedback saved = feedbackRepositoryPort.save(feedback);

        // Notify Admin about new review
        notificationPublisherPort.sendToTopic("admin-orders",
                NotificationResponse.builder()
                        .title("Đánh giá mới")
                        .message("Sản phẩm '" + product.getName() + "' vừa nhận được đánh giá " + request.rating()
                                + " sao.")
                        .type("NEW_FEEDBACK")
                        .targetUrl("/admin/feedback")
                        .timestamp(java.time.LocalDateTime.now())
                        .build());

        return feedbackMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public FeedbackResponse updateFeedback(Long feedbackId, FeedbackRequest request) {
        Feedback feedback = feedbackRepositoryPort.findById(feedbackId)
                .orElseThrow(() -> new EntityNotFoundException(FeedbackMessages.MESSAGE_FEEDBACK_NOT_FOUND));

        if (feedback.isEdited()) {
            throw new IllegalStateException(FeedbackMessages.MESSAGE_FEEDBACK_CANNOT_EDIT_TWICE);
        }

        UUID currentUserId = SecurityUtil.getCurrentUserIdOrNull();
        if (currentUserId != null) {
            if (feedback.getUser() == null || !feedback.getUser().getId().equals(currentUserId)) {
                throw new AccessDeniedException("No permission to edit this feedback.");
            }
        } else {
            // Guest must provide token? Requirement says "khách có thể xóa/sửa"
            // For guest update, we might need the token again or some mechanism.
            // But let's assume they are browsing with the token link which identifies them.
            // For now, if no user, check token.
            if (request.token() == null) {
                throw new AccessDeniedException("Token is required for guest to edit feedback.");
            }
            FeedbackToken token = feedbackTokenRepositoryPort.findByToken(request.token())
                    .orElseThrow(() -> new IllegalArgumentException(FeedbackMessages.MESSAGE_FEEDBACK_INVALID_TOKEN));
            if (!feedback.getOrder().getId().equals(token.getOrderId())) {
                throw new AccessDeniedException("Token doesn't match this feedback.");
            }
        }

        feedback.setRating(request.rating());
        feedback.setComment(request.comment());
        feedback.setEdited(true);

        Feedback saved = feedbackRepositoryPort.save(feedback);
        return feedbackMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public FeedbackResponse replyFeedback(Long feedbackId,
            fpt.teddypet.application.dto.request.feedback.FeedbackReplyRequest request) {
        Feedback feedback = feedbackRepositoryPort.findById(feedbackId)
                .orElseThrow(() -> new EntityNotFoundException(FeedbackMessages.MESSAGE_FEEDBACK_NOT_FOUND));

        feedback.setReplyComment(request.replyComment());
        feedback.setRepliedAt(java.time.LocalDateTime.now());

        Feedback saved = feedbackRepositoryPort.save(feedback);

        // Notify User about the reply
        if (saved.getUser() != null) {
            notificationPublisherPort.sendToUser(saved.getUser().getUsername(),
                    NotificationResponse.builder()
                            .title("Phản hồi đánh giá")
                            .message("Quản trị viên đã phản hồi đánh giá của bạn về sản phẩm "
                                    + saved.getProduct().getName())
                            .type("FEEDBACK_REPLIED")
                            .targetUrl("/product/detail/" + saved.getProduct().getSlug())
                            .timestamp(java.time.LocalDateTime.now())
                            .build());
        }

        return feedbackMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public FeedbackResponse editFeedbackByAdmin(Long feedbackId,
            fpt.teddypet.application.dto.request.feedback.FeedbackAdminEditRequest request) {
        Feedback feedback = feedbackRepositoryPort.findById(feedbackId)
                .orElseThrow(() -> new EntityNotFoundException(FeedbackMessages.MESSAGE_FEEDBACK_NOT_FOUND));

        feedback.setComment(request.getComment());
        Feedback saved = feedbackRepositoryPort.save(feedback);
        return feedbackMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        Feedback feedback = feedbackRepositoryPort.findById(feedbackId)
                .orElseThrow(() -> new EntityNotFoundException(FeedbackMessages.MESSAGE_FEEDBACK_NOT_FOUND));

        // Ownership check
        UUID currentUserId = SecurityUtil.getCurrentUserIdOrNull();
        if (currentUserId != null) {
            if (feedback.getUser() == null || !feedback.getUser().getId().equals(currentUserId)) {
                throw new AccessDeniedException("No permission to delete this feedback.");
            }
        }
        // Staff/Admin can also delete, but let's keep it simple for now as requested.

        feedbackRepositoryPort.delete(feedback);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getProductFeedbacks(Long productId) {
        return feedbackRepositoryPort.findByProductId(productId).stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackTokenResponse getFeedbackTokenDetails(UUID token) {
        FeedbackToken feedbackToken = feedbackTokenRepositoryPort.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException(FeedbackMessages.MESSAGE_FEEDBACK_INVALID_TOKEN));

        Order order = orderRepositoryPort.findById(feedbackToken.getOrderId());

        List<Feedback> existingFeedbacks = feedbackRepositoryPort.findByOrderId(order.getId());

        List<FeedbackItemResponse> items = order.getOrderItems().stream()
                .map(item -> convertToFeedbackItemResponse(item, existingFeedbacks))
                .collect(Collectors.toList());

        return new FeedbackTokenResponse(
                token,
                order.getShippingName(),
                feedbackToken.getGuestEmail(),
                items);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedbackTokenResponse getOrderFeedbackDetails(UUID orderId, String email) {
        Order order = orderRepositoryPort.findById(orderId);

        UUID currentUserId = SecurityUtil.getCurrentUserIdOrNull();
        if (currentUserId != null) {
            if (order.getUser() == null || !order.getUser().getId().equals(currentUserId)) {
                throw new AccessDeniedException("You don't have permission to review this order.");
            }
        } else {
            // Guest check: must provide email that matches order
            if (email == null || order.getGuestEmail() == null || !email.equalsIgnoreCase(order.getGuestEmail())) {
                throw new AccessDeniedException("Email mismatch or not provided for guest review.");
            }
        }

        List<Feedback> existingFeedbacks = feedbackRepositoryPort.findByOrderId(order.getId());

        List<FeedbackItemResponse> items = order.getOrderItems().stream()
                .map(item -> convertToFeedbackItemResponse(item, existingFeedbacks))
                .collect(Collectors.toList());

        return new FeedbackTokenResponse(
                null, // No token needed if we have session or verified email
                order.getShippingName(),
                order.getUser() != null ? order.getUser().getEmail() : order.getGuestEmail(),
                items);
    }

    private FeedbackItemResponse convertToFeedbackItemResponse(OrderItem orderItem, List<Feedback> feedbacks) {
        Feedback fb = feedbacks.stream()
                .filter(f -> f.getProduct().getId().equals(orderItem.getProduct().getId()) &&
                        Objects.equals(f.getVariant() != null ? f.getVariant().getVariantId() : null,
                                orderItem.getVariant() != null ? orderItem.getVariant().getVariantId() : null))
                .findFirst()
                .orElse(null);

        return new FeedbackItemResponse(
                orderItem.getProduct().getId(),
                orderItem.getVariant() != null ? orderItem.getVariant().getVariantId() : null,
                orderItem.getProductName(),
                orderItem.getVariantName(),
                orderItem.getImageUrl(),
                fb != null ? fb.getRating() : null,
                fb != null ? fb.getComment() : null,
                fb != null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FeedbackResponse> getMyFeedbacks() {
        UUID currentUserId = SecurityUtil.getCurrentUserId();
        return feedbackRepositoryPort.findByUserId(currentUserId).stream()
                .map(feedbackMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public fpt.teddypet.application.dto.response.feedback.FeedbackStatsResponse getFeedbackStats() {
        long total = feedbackRepositoryPort.findAll().size();
        Double avg = feedbackRepositoryPort.getAverageRating();
        long today = feedbackRepositoryPort.countTodayReviews();

        java.util.Map<Integer, Long> distribution = new java.util.HashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(i, 0L);
        List<Object[]> distRows = feedbackRepositoryPort.getRatingDistribution();
        for (Object[] row : distRows) {
            distribution.put((Integer) row[0], (Long) row[1]);
        }

        List<Object[]> trendRows = feedbackRepositoryPort.getMonthlyTrends();
        java.util.List<fpt.teddypet.application.dto.response.feedback.FeedbackStatsResponse.MonthlyReviewCount> trends = trendRows.stream()
                .map(row -> new fpt.teddypet.application.dto.response.feedback.FeedbackStatsResponse.MonthlyReviewCount((String) row[0], ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        // Simple growth calculation: (this month - last month) / last month
        java.math.BigDecimal growth = java.math.BigDecimal.ZERO;
        if (trends.size() >= 2) {
            long currentMonth = trends.get(0).count();
            long lastMonth = trends.get(1).count();
            if (lastMonth > 0) {
                growth = java.math.BigDecimal.valueOf((double) (currentMonth - lastMonth) / lastMonth * 100)
                        .setScale(2, java.math.RoundingMode.HALF_UP);
            } else if (currentMonth > 0) {
                growth = java.math.BigDecimal.valueOf(100);
            }
        }

        return new fpt.teddypet.application.dto.response.feedback.FeedbackStatsResponse(
                total, avg != null ? avg : 0.0, today, growth, distribution, trends);
    }

    @Override
    @Transactional
    public void sendFeedbackEmailsForOrder(UUID orderId) {
        Order order = orderRepositoryPort.findById(orderId);
        if (order.getStatus() != OrderStatusEnum.COMPLETED) {
            return;
        }

        String email = order.getGuestEmail();
        if (email == null && order.getUser() != null) {
            email = order.getUser().getEmail();
        }

        if (email == null)
            return;

        // Check if token already exists
        FeedbackToken feedbackToken = feedbackTokenRepositoryPort.findByOrderId(orderId)
                .orElseGet(() -> {
                    FeedbackToken newToken = FeedbackToken.builder()
                            .token(UUID.randomUUID())
                            .orderId(orderId)
                            .guestEmail(order.getGuestEmail())
                            .expiryMinutes(43200) // 30 days
                            .build();
                    return feedbackTokenRepositoryPort.save(newToken);
                });

        String feedbackLink = frontendUrl + "/feedback?token=" + feedbackToken.getToken();

        String subject = "TeddyPet - Chia sẻ cảm nhận của bạn về sản phẩm!";
        String body = "<h3>Cảm ơn bạn đã mua sắm tại TeddyPet!</h3>" +
                "<p>Chào " + order.getShippingName() + ",</p>" +
                "<p>Đơn hàng " + order.getOrderCode()
                + " của bạn đã hoàn tất. Chúng mình rất muốn biết cảm nhận của bạn về các sản phẩm đã nhận.</p>" +
                "<p>Hãy dành chút thời gian đánh giá sản phẩm tại link dưới đây nhé:</p>" +
                "<p><a href=\"" + feedbackLink
                + "\" style=\"background-color: #ff6b6b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;\">Gửi đánh giá ngay</a></p>"
                +
                "<p>Cảm ơn bạn!</p>";

        emailServicePort.sendHtmlEmail(email, subject, body);
        log.info("Sent feedback email for order {} to {}", orderId, email);
    }
}
