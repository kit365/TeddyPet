package fpt.teddypet.infrastructure.adapter.orders;

import fpt.teddypet.application.constants.orders.order.OrderMessages;
import fpt.teddypet.application.port.output.orders.order.OrderRepositoryPort;
import fpt.teddypet.domain.entity.Order;
import fpt.teddypet.domain.enums.orders.OrderStatusEnum;
import fpt.teddypet.infrastructure.persistence.postgres.repository.orders.OrderRepository;
import fpt.teddypet.infrastructure.persistence.postgres.specification.OrderSpecification;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
@Primary
@RequiredArgsConstructor
public class OrderRepositoryAdapter implements OrderRepositoryPort {

    private final OrderRepository orderRepository;

    @Override
    public Order save(Order order) {
        return orderRepository.save(order);
    }

    @Override
    public Order findById(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(OrderMessages.MESSAGE_ORDER_NOT_FOUND_BY_ID, orderId)));
    }

    @Override
    public Order findByOrderCode(String orderCode) {
        return orderRepository.findByOrderCode(orderCode)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format(OrderMessages.MESSAGE_ORDER_NOT_FOUND_BY_CODE, orderCode)));
    }

    @Override
    public Page<Order> findAll(Pageable pageable) {
        return orderRepository.findAll(pageable);
    }

    @Override
    public Page<Order> findByUserId(UUID userId, Pageable pageable) {
        return orderRepository.findByUserId(userId, pageable);
    }

    @Override
    public Page<Order> findByStatus(OrderStatusEnum status, Pageable pageable) {
        return orderRepository.findByStatus(status, pageable);
    }

    @Override
    public Page<Order> searchOrders(String keyword, Pageable pageable) {
        return orderRepository.findAll(OrderSpecification.searchByKeyword(keyword), pageable);
    }

    @Override
    public List<Order> findByUserId(UUID userId) {
        return orderRepository.findByUserId(userId);
    }

    @Override
    public boolean existsByOrderCode(String orderCode) {
        return orderRepository.existsByOrderCode(orderCode);
    }

    @Override
    public Order getReferenceById(UUID orderId) {
        return orderRepository.getReferenceById(orderId);
    }

    @Override
    public Optional<Order> findByOrderCodeAndGuestEmail(String orderCode, String guestEmail) {
        return orderRepository.findByOrderCodeAndGuestEmail(orderCode, guestEmail);
    }

    @Override
    public List<Order> findByStatusAndDeliveringAtBefore(OrderStatusEnum status, LocalDateTime dateTime) {
        return orderRepository.findByStatusAndDeliveringAtBefore(status, dateTime);
    }
}
