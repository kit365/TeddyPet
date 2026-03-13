package fpt.teddypet.application.port.input.newsletter;

public interface NewsletterSubscriptionService {
    void subscribe(String email);
    void unsubscribe(String email);
}
