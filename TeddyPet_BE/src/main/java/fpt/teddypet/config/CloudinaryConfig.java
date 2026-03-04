package fpt.teddypet.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        // Ưu tiên đọc từ System property (từ file .env do TeddyPetApplication load), sau đó mới env
        String url = System.getProperty("CLOUDINARY_URL");
        if (url == null || url.isBlank()) {
            url = System.getenv("CLOUDINARY_URL");
        }
        if (url != null && !url.isBlank()) {
            return new Cloudinary(url);
        }
        return new Cloudinary();
    }
}
