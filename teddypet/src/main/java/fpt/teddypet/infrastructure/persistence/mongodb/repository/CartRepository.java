package fpt.teddypet.infrastructure.persistence.mongodb.repository;

import fpt.teddypet.infrastructure.persistence.mongodb.document.Cart;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CartRepository extends MongoRepository<Cart, String> {
}
