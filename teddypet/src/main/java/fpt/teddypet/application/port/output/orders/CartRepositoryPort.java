package fpt.teddypet.application.port.output.orders;

import fpt.teddypet.infrastructure.persistence.mongodb.document.Cart;

import java.util.Optional;

public interface CartRepositoryPort {
    Cart save(Cart cart);
    void deleteByUserId(String userId);
    Optional<Cart> findByUserId(String userId);
}
