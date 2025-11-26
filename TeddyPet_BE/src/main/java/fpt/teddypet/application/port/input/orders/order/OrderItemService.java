package fpt.teddypet.application.port.input.orders.order;

import fpt.teddypet.application.dto.request.orders.order.OrderItemRequest;
import fpt.teddypet.domain.entity.OrderItem;


import java.util.List;

public interface OrderItemService {
    OrderItem createOrderItemFromRequest(OrderItemRequest request);
    List<OrderItem> createOrderItemsFromRequests(List<OrderItemRequest> requests);
}
