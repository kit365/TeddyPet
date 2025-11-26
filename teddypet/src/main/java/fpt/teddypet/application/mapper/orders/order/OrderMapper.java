package fpt.teddypet.application.mapper.orders.order;

import fpt.teddypet.application.dto.response.orders.order.OrderResponse;

import fpt.teddypet.application.mapper.UserMapper;
import fpt.teddypet.application.mapper.payments.PaymentMapper;
import fpt.teddypet.domain.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE,

        uses = {
                UserMapper.class,
                OrderItemMapper.class,
                PaymentMapper.class
        }
)
public interface OrderMapper {

    OrderResponse toResponse(Order order);
}
