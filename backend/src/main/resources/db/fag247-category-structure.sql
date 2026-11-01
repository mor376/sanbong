-- Run once against an existing FAG247 MySQL/MariaDB database after taking a backup.
-- Existing SubFieldIDs are preserved so bookings and reviews remain attached.

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
);

ALTER TABLE SubFields ADD COLUMN IF NOT EXISTS CategoryID INT NULL;

SET @category_fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'SubFields'
      AND CONSTRAINT_NAME = 'fk_subfields_category'
);
SET @category_fk_sql = IF(
    @category_fk_exists = 0,
    'ALTER TABLE SubFields ADD CONSTRAINT fk_subfields_category FOREIGN KEY (CategoryID) REFERENCES PitchCategories(CategoryID) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE category_fk_stmt FROM @category_fk_sql;
EXECUTE category_fk_stmt;
DEALLOCATE PREPARE category_fk_stmt;

START TRANSACTION;

INSERT IGNORE INTO PitchCategories (CenterID, SportID, CategoryName, PlayerCount, ChildCount)
SELECT CenterID, SportID, SubFieldName,
       CASE
           WHEN SubFieldName LIKE '%11%' THEN 11
           WHEN SubFieldName LIKE '%7%' THEN 7
           ELSE 5
       END,
       FLOOR(2 + RAND() * 4)
FROM SubFields
WHERE SubFieldName REGEXP '([0-9]+[A-Z]|[[:space:]][A-Z])$';

UPDATE SubFields sf
JOIN PitchCategories pc
  ON pc.CenterID = sf.CenterID
 AND pc.SportID = sf.SportID
 AND pc.CategoryName = sf.SubFieldName
SET sf.CategoryID = pc.CategoryID,
    sf.SubFieldName = 'Sân 1'
WHERE sf.CategoryID IS NULL
  AND sf.SubFieldName REGEXP '([0-9]+[A-Z]|[[:space:]][A-Z])$';

INSERT INTO SubFields
    (CenterID, SportID, CategoryID, SubFieldName, Description, GiaGio, GiaGioCaoDiem, Status)
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
);

COMMIT;
