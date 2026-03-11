package fpt.teddypet.infrastructure.persistence.mongodb.repository;

import fpt.teddypet.infrastructure.persistence.mongodb.document.NotificationDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationMongoRepository extends MongoRepository<NotificationDocument, String> {

    List<NotificationDocument> findByRecipientAndIsDeletedFalseOrderByCreatedAtDesc(String recipient);

    List<NotificationDocument> findByRecipientIsNullAndIsDeletedFalseOrderByCreatedAtDesc();

}
