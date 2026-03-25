package fpt.teddypet.application.service.newsletter;

import fpt.teddypet.application.port.input.newsletter.NewsletterSubscriptionService;
import fpt.teddypet.application.port.output.newsletter.NewsletterSubscriptionRepositoryPort;
import fpt.teddypet.domain.entity.NewsletterSubscription;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NewsletterSubscriptionApplicationService implements NewsletterSubscriptionService {

    private final NewsletterSubscriptionRepositoryPort newsletterSubscriptionRepositoryPort;

    @Override
    @Transactional
    public void subscribe(String email) {
        if (newsletterSubscriptionRepositoryPort.existsByEmail(email)) {
            newsletterSubscriptionRepositoryPort.findByEmail(email).ifPresent(sub -> {
                if (!sub.isActive()) {
                    sub.setActive(true);
                    newsletterSubscriptionRepositoryPort.save(sub);
                }
            });
            return;
        }

        NewsletterSubscription subscription = NewsletterSubscription.builder()
                .email(email)
                .isActive(true)
                .build();
        newsletterSubscriptionRepositoryPort.save(subscription);
    }

    @Override
    @Transactional
    public void unsubscribe(String email) {
        newsletterSubscriptionRepositoryPort.findByEmail(email).ifPresent(sub -> {
            sub.setActive(false);
            newsletterSubscriptionRepositoryPort.save(sub);
        });
    }
}
