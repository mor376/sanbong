package com.sanbong.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("mysql")
public class PlatformReviewSchema implements CommandLineRunner {
    private final JdbcTemplate jdbc;

    public PlatformReviewSchema(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS SubFieldReviews (
                    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
                    UserID INT NOT NULL,
                    SubFieldID INT NOT NULL,
                    Rating INT NOT NULL,
                    Comment VARCHAR(1000) NOT NULL,
                    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,
                    CONSTRAINT fk_subfield_reviews_user FOREIGN KEY (UserID)
                        REFERENCES Users(UserID) ON DELETE CASCADE,
                    CONSTRAINT fk_subfield_reviews_field FOREIGN KEY (SubFieldID)
                        REFERENCES SubFields(SubFieldID) ON DELETE CASCADE,
                    CONSTRAINT uk_subfield_reviews_user_field UNIQUE (UserID, SubFieldID)
                )
                """);
    }
}
