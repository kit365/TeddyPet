package fpt.teddypet.infrastructure.adapter.newsletter;

import fpt.teddypet.application.port.output.newsletter.NewsletterSubscriptionRepositoryPort;
import fpt.teddypet.domain.entity.NewsletterSubscription;
import fpt.teddypet.infrastructure.persistence.postgres.repository.newsletter.NewsletterSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class NewsletterSubscriptionRepositoryAdapter implements NewsletterSubscriptionRepositoryPort {

    private final NewsletterSubscriptionRepository newsletterSubscriptionRepository;

    @Override
    public NewsletterSubscription save(NewsletterSubscription subscription) {
        return newsletterSubscriptionRepository.save(subscription);
    }

    @Override
    public Optional<NewsletterSubscription> findByEmail(String email) {
        return newsletterSubscriptionRepository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return newsletterSubscriptionRepository.existsByEmail(email);
    }
}
