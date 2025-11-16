package fpt.teddypet.application.port.output;


public interface EventPublisherPort {
    
 
    void publishBookingCreated(Object event);
    

    void publishOrderCreated(Object event);
    

    void publishCartUpdated(Object event);
    
  
    void publish(String topic, Object event);
}

