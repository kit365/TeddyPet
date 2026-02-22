package fpt.teddypet.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        // Cloudinary SDK will automatically look for the CLOUDINARY_URL environment variable
        return new Cloudinary();
    }
}
