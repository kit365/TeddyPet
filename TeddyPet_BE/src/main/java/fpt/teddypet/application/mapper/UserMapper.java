package fpt.teddypet.application.mapper;


import fpt.teddypet.application.dto.response.UserOrderInfoResponse;
import fpt.teddypet.domain.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(source = "id", target = "userId")
    UserOrderInfoResponse toUserOrderResponse(User user);
}
