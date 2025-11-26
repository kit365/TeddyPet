//package fpt.teddypet.infrastructure.messaging.kafka;
//
//import fpt.teddypet.application.port.output.EventPublisherPort;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.kafka.core.KafkaTemplate;
//import org.springframework.stereotype.Component;
//
///**
// * Kafka implementation of EventPublisherPort
// * Publishes events to Kafka topics
// */
//@Component
//public class EventPublisherAdapter implements EventPublisherPort {
//
//    private static final Logger logger = LoggerFactory.getLogger(EventPublisherAdapter.class);
//
//    private final KafkaTemplate<String, Object> kafkaTemplate;
//
//    // Topic names
//    private static final String BOOKING_CREATED_TOPIC = "booking-created";
//    private static final String ORDER_CREATED_TOPIC = "order-created";
//    private static final String CART_UPDATED_TOPIC = "cart-updated";
//
//    public EventPublisherAdapter(KafkaTemplate<String, Object> kafkaTemplate) {
//        this.kafkaTemplate = kafkaTemplate;
//    }
//
//    @Override
//    public void publishBookingCreated(Object event) {
//        publish(BOOKING_CREATED_TOPIC, event);
//    }
//
//    @Override
//    public void publishOrderCreated(Object event) {
//        publish(ORDER_CREATED_TOPIC, event);
//    }
//
//    @Override
//    public void publishCartUpdated(Object event) {
//        publish(CART_UPDATED_TOPIC, event);
//    }
//
//    @Override
//    public void publish(String topic, Object event) {
//        try {
//            kafkaTemplate.send(topic, event);
//            logger.info("Event published to topic: {}, event: {}", topic, event);
//        } catch (Exception e) {
//            logger.error("Failed to publish event to topic: {}", topic, e);
//            // In production, you might want to:
//            // - Retry the publish
//            // - Store in dead letter queue
//            // - Notify monitoring system
//        }
//    }
//}
//
