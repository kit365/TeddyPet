package fpt.teddypet.infrastructure.adapter.orders;

import fpt.teddypet.application.port.output.orders.CartRepositoryPort;
import fpt.teddypet.infrastructure.persistence.mongodb.document.Cart;
import fpt.teddypet.infrastructure.persistence.mongodb.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CartRepositoryAdapter implements CartRepositoryPort {

    private final CartRepository cartRepository;

    @Override
    public Cart save(Cart cart) {
        return cartRepository.save(cart);
    }

    @Override
    public void deleteByUserId(Long userId) {
        cartRepository.deleteById(String.valueOf(userId));
    }

    @Override
    public Optional<Cart> findByUserId(Long userId) {
        return cartRepository.findById(String.valueOf(userId));
    }
}