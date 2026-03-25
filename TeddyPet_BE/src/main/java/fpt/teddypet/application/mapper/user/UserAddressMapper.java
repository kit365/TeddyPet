package fpt.teddypet.application.mapper.user;

import fpt.teddypet.application.dto.request.user.UserAddressRequest;
import fpt.teddypet.application.dto.response.user.UserAddressResponse;
import fpt.teddypet.domain.entity.UserAddress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserAddressMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "defaultAddress", source = "isDefault")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    UserAddress toEntity(UserAddressRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "defaultAddress", source = "isDefault")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    void updateEntityFromRequest(UserAddressRequest request, @MappingTarget UserAddress address);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "isDefault", source = "defaultAddress")
    UserAddressResponse toResponse(UserAddress address);
}
