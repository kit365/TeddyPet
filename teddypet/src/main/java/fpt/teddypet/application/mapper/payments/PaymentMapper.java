package fpt.teddypet.application.mapper.payments;


import fpt.teddypet.application.dto.response.payment.PaymentOrderResponse;
import fpt.teddypet.domain.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;


@Mapper(
        componentModel = "spring",
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
        unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface PaymentMapper {

    @Mapping(target = "orderCode", source = "order.orderCode")
    PaymentOrderResponse toResponse(Payment payment);
}
