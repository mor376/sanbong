package com.sanbong.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("mysql")
public class PitchCategorySchema implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(PitchCategorySchema.class);

    private final JdbcTemplate jdbc;

    public PitchCategorySchema(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(String... args) {
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS PitchCategories (
                    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
                    CenterID INT NOT NULL,
                    SportID INT NOT NULL,
                    CategoryName VARCHAR(150) NOT NULL,
                    PlayerCount INT NOT NULL DEFAULT 0,
                    ChildCount INT NOT NULL DEFAULT 0,
                    CONSTRAINT fk_pitch_categories_center FOREIGN KEY (CenterID)
                        REFERENCES SportsCenters(CenterID) ON DELETE CASCADE,
                    CONSTRAINT fk_pitch_categories_sport FOREIGN KEY (SportID)
                        REFERENCES Sports(SportID) ON DELETE CASCADE,
                    CONSTRAINT uq_pitch_category_name UNIQUE (CenterID, SportID, CategoryName)
                )
                """);

        if (!columnExists("SubFields", "CategoryID")) {
            jdbc.execute("ALTER TABLE SubFields ADD COLUMN CategoryID INT NULL");
        }
        if (!constraintExists("SubFields", "fk_subfields_category")) {
            jdbc.execute("""
                    ALTER TABLE SubFields ADD CONSTRAINT fk_subfields_category
                    FOREIGN KEY (CategoryID) REFERENCES PitchCategories(CategoryID)
                    ON DELETE SET NULL
                    """);
        }

        jdbc.update("""
                INSERT IGNORE INTO PitchCategories
                    (CenterID, SportID, CategoryName, PlayerCount, ChildCount)
                SELECT sf.CenterID, sf.SportID, sf.SubFieldName,
                       CASE
                           WHEN sf.SubFieldName LIKE '%11%' THEN 11
                           WHEN sf.SubFieldName LIKE '%7%' THEN 7
                           ELSE 5
                       END,
                       FLOOR(2 + RAND() * 4)
                FROM SubFields sf
                WHERE sf.CategoryID IS NULL
                  AND sf.SubFieldName REGEXP '([0-9]+[A-Z]|[[:space:]][A-Z])$'
                """);

        jdbc.update("""
                UPDATE SubFields sf
                JOIN PitchCategories pc
                  ON pc.CenterID = sf.CenterID
                 AND pc.SportID = sf.SportID
                 AND pc.CategoryName = sf.SubFieldName
                SET sf.CategoryID = pc.CategoryID,
                    sf.SubFieldName = 'Sân 1'
                WHERE sf.CategoryID IS NULL
                  AND sf.SubFieldName REGEXP '([0-9]+[A-Z]|[[:space:]][A-Z])$'
                """);

        jdbc.update("""
                INSERT INTO SubFields
                    (CenterID, SportID, CategoryID, SubFieldName, Description,
                     GiaGio, GiaGioCaoDiem, Status)
                SELECT pc.CenterID, pc.SportID, pc.CategoryID, CONCAT('Sân ', numbers.child_no),
                       template.Description, template.GiaGio, template.GiaGioCaoDiem, template.Status
                FROM PitchCategories pc
                JOIN SubFields template
                  ON template.CategoryID = pc.CategoryID
                 AND template.SubFieldName = 'Sân 1'
                JOIN (
                    SELECT 2 AS child_no
                    UNION ALL SELECT 3
                    UNION ALL SELECT 4
                    UNION ALL SELECT 5
                ) numbers ON numbers.child_no <= pc.ChildCount
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM SubFields existing
                    WHERE existing.CategoryID = pc.CategoryID
                      AND existing.SubFieldName = CONCAT('Sân ', numbers.child_no)
                )
                """);

        log.info("Pitch category schema is ready");
    }

    private boolean columnExists(String table, String column) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
                """, Integer.class, table, column);
        return count != null && count > 0;
    }

    private boolean constraintExists(String table, String constraint) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                WHERE CONSTRAINT_SCHEMA = DATABASE()
                  AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?
                """, Integer.class, table, constraint);
        return count != null && count > 0;
    }
}
