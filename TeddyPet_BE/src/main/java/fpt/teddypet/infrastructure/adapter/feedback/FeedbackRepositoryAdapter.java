package fpt.teddypet.infrastructure.adapter.feedback;

import fpt.teddypet.application.port.output.feedback.FeedbackRepositoryPort;
import fpt.teddypet.domain.entity.Feedback;
import fpt.teddypet.infrastructure.persistence.postgres.repository.feedback.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class FeedbackRepositoryAdapter implements FeedbackRepositoryPort {

    private final FeedbackRepository feedbackRepository;

    @Override
    public Feedback save(Feedback feedback) {
        return feedbackRepository.save(feedback);
    }

    @Override
    public Optional<Feedback> findById(Long id) {
        return feedbackRepository.findById(id);
    }

    @Override
    public List<Feedback> findByProductId(Long productId) {
        return feedbackRepository.findByProductId(productId);
    }

    @Override
    public List<Feedback> findByOrderId(UUID orderId) {
        return feedbackRepository.findByOrderId(orderId);
    }

    @Override
    public List<Feedback> findByUserId(UUID userId) {
        return feedbackRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Optional<Feedback> findByOrderIdAndProductIdAndVariantId(UUID orderId, Long productId, Long variantId) {
        return feedbackRepository.findByOrderIdAndProductIdAndVariantVariantId(orderId, productId, variantId);
    }

    @Override
    public void delete(Feedback feedback) {
        feedbackRepository.delete(feedback);
    }

    @Override
    public boolean existsByOrderIdAndProductIdAndVariantId(UUID orderId, Long productId, Long variantId) {
        return feedbackRepository.existsByOrderIdAndProductIdAndVariantVariantId(orderId, productId, variantId);
    }
}
