package fpt.teddypet.application.port.output.newsletter;

import fpt.teddypet.domain.entity.NewsletterSubscription;
import java.util.Optional;

public interface NewsletterSubscriptionRepositoryPort {
    NewsletterSubscription save(NewsletterSubscription subscription);
    Optional<NewsletterSubscription> findByEmail(String email);
    boolean existsByEmail(String email);
}
