USE fag247;

CREATE TEMPORARY TABLE fag247_import_centers (
    name VARCHAR(255) PRIMARY KEY,
    address VARCHAR(500) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    total_reviews INT NOT NULL
);

INSERT INTO fag247_import_centers VALUES
('Gò Vấp Sports Park', 'Đường số 1, Phường 4, Quận Gò Vấp, TP.HCM', '0913217102', 'govaip@fagleague.vn', '06:00:00', '23:00:00', 4.9, 1250),
('Tân Bình Football Center', '18 Cộng Hòa, Quận Tân Bình, TP.HCM', '0906000001', 'tanbinh@fagleague.vn', '06:00:00', '23:00:00', 4.7, 86),
('Thủ Đức Sports Hub', '25 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', '0906000002', 'thuduc@fagleague.vn', '05:30:00', '22:30:00', 4.6, 74),
('Bình Thạnh Arena', '70 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM', '0906000003', 'binhthanh@fagleague.vn', '06:00:00', '23:00:00', 4.8, 102),
('Quận 7 Sport Complex', '45 Nguyễn Thị Thập, Quận 7, TP.HCM', '0906000005', 'quan7@fagleague.vn', '05:00:00', '23:00:00', 4.9, 133);

CREATE TEMPORARY TABLE fag247_import_sports (
    sport_name VARCHAR(100) PRIMARY KEY
);
INSERT INTO fag247_import_sports VALUES
('Bóng đá'), ('Cầu lông'), ('Pickleball'), ('Quần vợt'), ('Bóng rổ');

CREATE TEMPORARY TABLE fag247_import_fields (
    center_name VARCHAR(255) NOT NULL,
    sport_name VARCHAR(100) NOT NULL,
    field_name VARCHAR(150) NOT NULL,
    description TEXT,
    regular_price DECIMAL(12,2) NOT NULL,
    peak_price DECIMAL(12,2) NOT NULL,
    PRIMARY KEY (center_name, field_name)
);
INSERT INTO fag247_import_fields VALUES
('Gò Vấp Sports Park', 'Bóng đá', 'Sân Gò Vấp 5A', 'Sân cỏ nhân tạo chuẩn 5 người', 250000, 400000),
('Tân Bình Football Center', 'Bóng đá', 'Sân 7 Tân Bình A', 'Sân bóng đá 7 người, có đèn chiếu sáng', 300000, 400000),
('Thủ Đức Sports Hub', 'Quần vợt', 'Sân quần vợt Thủ Đức 1', 'Mặt sân cứng tiêu chuẩn', 180000, 240000),
('Bình Thạnh Arena', 'Bóng rổ', 'Sân bóng rổ Bình Thạnh 1', 'Sân ngoài trời có bảng điểm', 200000, 250000),
('Quận 7 Sport Complex', 'Bóng đá futsal', 'Sân Q7 Futsal A', 'Sân trong nhà chống trượt', 450000, 500000);

CREATE TEMPORARY TABLE fag247_import_customers (
    customer_id INT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address VARCHAR(255)
);
INSERT INTO fag247_import_customers VALUES
(1, 'Nguyễn Minh An', '0905000002', 'khach.demo1@fagleague.vn', 'TP.HCM'),
(2, 'Trần Quốc Bình', '0905000003', 'khach.demo2@fagleague.vn', 'Thủ Đức'),
(3, 'Lê Hoàng Cường', '0905000004', 'khach.demo3@fagleague.vn', 'Bình Thạnh'),
(4, 'Phạm Gia Huy', '0905000005', 'khach.demo4@fagleague.vn', 'Gò Vấp'),
(5, 'Đỗ Nhật Minh', '0905000006', 'khach.demo5@fagleague.vn', 'Quận 12');

CREATE TEMPORARY TABLE fag247_import_bookings (
    booking_id INT PRIMARY KEY,
    customer_id INT NOT NULL,
    field_name VARCHAR(150) NOT NULL,
    center_name VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    booking_status VARCHAR(20) NOT NULL,
    note VARCHAR(255) NOT NULL
);
INSERT INTO fag247_import_bookings VALUES
(1, 1, 'Sân Gò Vấp 5A', 'Gò Vấp Sports Park', '2026-11-10', '08:00:00', '09:00:00', 250000, 'Tiền mặt', 'Confirmed', 'Đặt ca sáng sân 1'),
(2, 2, 'Sân 7 Tân Bình A', 'Tân Bình Football Center', '2026-11-10', '09:00:00', '10:00:00', 300000, 'Chuyển khoản', 'Confirmed', 'Đặt ca sáng sân 2'),
(3, 3, 'Sân quần vợt Thủ Đức 1', 'Thủ Đức Sports Hub', '2026-11-10', '10:00:00', '11:00:00', 180000, 'Tiền mặt', 'Pending', 'Giữ chỗ sân quần vợt'),
(4, 4, 'Sân bóng rổ Bình Thạnh 1', 'Bình Thạnh Arena', '2026-11-10', '15:00:00', '16:00:00', 200000, 'Chuyển khoản', 'Confirmed', 'Đặt sân bóng rổ'),
(5, 5, 'Sân Q7 Futsal A', 'Quận 7 Sport Complex', '2026-11-10', '16:00:00', '17:00:00', 450000, 'Thẻ ngân hàng', 'Confirmed', 'Đá giải nội bộ'),
(6, 1, 'Sân 7 Tân Bình A', 'Tân Bình Football Center', '2026-11-11', '17:00:00', '18:00:00', 400000, 'Tiền mặt', 'Confirmed', 'Khung giờ cao điểm'),
(7, 2, 'Sân quần vợt Thủ Đức 1', 'Thủ Đức Sports Hub', '2026-11-11', '18:00:00', '19:00:00', 240000, 'Chuyển khoản', 'Confirmed', 'Tennis tối'),
(8, 3, 'Sân bóng rổ Bình Thạnh 1', 'Bình Thạnh Arena', '2026-11-11', '19:00:00', '20:00:00', 200000, 'Tiền mặt', 'Pending', 'Bóng rổ tối'),
(9, 4, 'Sân Q7 Futsal A', 'Quận 7 Sport Complex', '2026-11-11', '20:00:00', '21:00:00', 500000, 'Chuyển khoản', 'Confirmed', 'Futsal tối'),
(10, 5, 'Sân Gò Vấp 5A', 'Gò Vấp Sports Park', '2026-11-11', '21:00:00', '22:00:00', 350000, 'Thẻ ngân hàng', 'Confirmed', 'Ca muộn'),
(11, 1, 'Sân quần vợt Thủ Đức 1', 'Thủ Đức Sports Hub', '2026-11-12', '08:00:00', '09:00:00', 180000, 'Tiền mặt', 'Confirmed', 'Đánh sáng'),
(12, 2, 'Sân bóng rổ Bình Thạnh 1', 'Bình Thạnh Arena', '2026-11-12', '09:00:00', '10:00:00', 200000, 'Chuyển khoản', 'Confirmed', 'Bóng rổ sáng'),
(13, 3, 'Sân Q7 Futsal A', 'Quận 7 Sport Complex', '2026-11-12', '10:00:00', '11:00:00', 450000, 'Tiền mặt', 'Confirmed', 'Futsal trưa'),
(14, 4, 'Sân Gò Vấp 5A', 'Gò Vấp Sports Park', '2026-11-12', '14:00:00', '15:00:00', 250000, 'Chuyển khoản', 'Pending', 'Đá chiều'),
(15, 5, 'Sân 7 Tân Bình A', 'Tân Bình Football Center', '2026-11-12', '15:00:00', '16:00:00', 300000, 'Tiền mặt', 'Confirmed', 'Đá chiều sân 7'),
(16, 1, 'Sân bóng rổ Bình Thạnh 1', 'Bình Thạnh Arena', '2026-11-13', '16:00:00', '17:00:00', 200000, 'Chuyển khoản', 'Confirmed', 'Luyện tập'),
(17, 2, 'Sân Q7 Futsal A', 'Quận 7 Sport Complex', '2026-11-13', '17:00:00', '18:00:00', 500000, 'Tiền mặt', 'Confirmed', 'Thi đấu giao hữu'),
(18, 3, 'Sân Gò Vấp 5A', 'Gò Vấp Sports Park', '2026-11-13', '18:00:00', '19:00:00', 400000, 'Thẻ ngân hàng', 'Confirmed', 'Khung giờ vàng'),
(19, 4, 'Sân 7 Tân Bình A', 'Tân Bình Football Center', '2026-11-13', '19:00:00', '20:00:00', 420000, 'Chuyển khoản', 'Confirmed', 'Căng thẳng'),
(20, 5, 'Sân quần vợt Thủ Đức 1', 'Thủ Đức Sports Hub', '2026-11-13', '20:00:00', '21:00:00', 280000, 'Tiền mặt', 'Confirmed', 'Cuối ngày');

START TRANSACTION;

DELETE slot
FROM FieldTimeSlots slot
JOIN Bookings b
  ON b.SubFieldID = slot.SubFieldID
 AND b.BookingDate = slot.BookingDate
 AND b.StartTime < slot.EndTime
 AND b.EndTime > slot.StartTime
LEFT JOIN fag247_import_bookings imported
  ON imported.booking_id = b.BookingID
 AND imported.booking_date = b.BookingDate
 AND imported.start_time = b.StartTime
 AND imported.end_time = b.EndTime
 AND imported.note = b.Note
WHERE b.Note LIKE 'Đặt sân mẫu %'
   OR b.Note = 'FAG247_SAMPLE_SEED_V1 - dữ liệu mẫu, không phải đặt sân thật'
   OR imported.booking_id IS NOT NULL;

DELETE FROM Bookings
WHERE Note LIKE 'Đặt sân mẫu %'
   OR Note = 'FAG247_SAMPLE_SEED_V1 - dữ liệu mẫu, không phải đặt sân thật'
   OR EXISTS (
       SELECT 1 FROM fag247_import_bookings imported
       WHERE imported.booking_id = Bookings.BookingID
         AND imported.booking_date = Bookings.BookingDate
         AND imported.start_time = Bookings.StartTime
         AND imported.end_time = Bookings.EndTime
         AND imported.note = Bookings.Note
   );

DELETE slot
FROM FieldTimeSlots slot
JOIN SubFields sf ON sf.SubFieldID = slot.SubFieldID
WHERE sf.SubFieldName LIKE 'Sân mẫu FAG247 %';

DELETE FROM SubFields
WHERE SubFieldName LIKE 'Sân mẫu FAG247 %';

DELETE FROM Customers
WHERE FullName LIKE 'Khách mẫu FAG247 %'
  AND Phone LIKE '09860000%';

DELETE FROM SportsCenters
WHERE Name LIKE 'FAG247 Sân mẫu %';

DELETE p
FROM PricingRules p
JOIN Sports s ON s.SportID = p.SportID
WHERE s.SportName IN (
    'Cầu mây', 'Bóng ném', 'Bóng chày', 'Bóng bầu dục',
    'Bóng đá bãi biển', 'Bóng chuyền bãi biển', 'Billiards',
    'Boxing', 'Võ thuật', 'Yoga', 'Thể dục dụng cụ',
    'Leo núi trong nhà', 'Trượt patin', 'Bắn cung',
    'Bắn súng thể thao', 'Bơi lội', 'Chạy bộ', 'Cờ vua',
    'Cờ tướng', 'Nhảy hiện đại'
);

DELETE s
FROM Sports s
LEFT JOIN SubFields sf ON sf.SportID = s.SportID
WHERE s.SportName IN (
    'Cầu mây', 'Bóng ném', 'Bóng chày', 'Bóng bầu dục',
    'Bóng đá bãi biển', 'Bóng chuyền bãi biển', 'Billiards',
    'Boxing', 'Võ thuật', 'Yoga', 'Thể dục dụng cụ',
    'Leo núi trong nhà', 'Trượt patin', 'Bắn cung',
    'Bắn súng thể thao', 'Bơi lội', 'Chạy bộ', 'Cờ vua',
    'Cờ tướng', 'Nhảy hiện đại'
)
AND sf.SubFieldID IS NULL;

UPDATE SportsCenters c
JOIN fag247_import_centers src ON src.name = c.Name
SET c.Address = src.address,
    c.Phone = src.phone,
    c.Email = src.email,
    c.OpenTime = src.open_time,
    c.CloseTime = src.close_time,
    c.Rating = src.rating,
    c.TotalReviews = src.total_reviews;

INSERT INTO SportsCenters
    (Name, Address, Phone, Email, OpenTime, CloseTime, Rating, TotalReviews)
SELECT src.name, src.address, src.phone, src.email, src.open_time, src.close_time,
       src.rating, src.total_reviews
FROM fag247_import_centers src
WHERE NOT EXISTS (
    SELECT 1 FROM SportsCenters c WHERE c.Name = src.name
);

INSERT IGNORE INTO Sports (SportName)
SELECT sport_name FROM fag247_import_sports;

UPDATE SubFields sf
JOIN SportsCenters c ON c.CenterID = sf.CenterID
JOIN fag247_import_fields src
  ON src.center_name = c.Name
 AND src.field_name = sf.SubFieldName
JOIN Sports s ON s.SportName = src.sport_name
SET sf.SportID = s.SportID,
    sf.Description = src.description,
    sf.GiaGio = src.regular_price,
    sf.GiaGioCaoDiem = src.peak_price,
    sf.Status = 'Active';

INSERT INTO SubFields
    (CenterID, SportID, SubFieldName, Description, GiaGio, GiaGioCaoDiem, Status)
SELECT c.CenterID, s.SportID, src.field_name, src.description,
       src.regular_price, src.peak_price, 'Active'
FROM fag247_import_fields src
JOIN SportsCenters c ON c.Name = src.center_name
JOIN Sports s ON s.SportName = src.sport_name
WHERE NOT EXISTS (
    SELECT 1 FROM SubFields sf
    WHERE sf.CenterID = c.CenterID
      AND sf.SubFieldName = src.field_name
);

INSERT INTO Customers (FullName, Phone, Email, DiaChi)
SELECT src.full_name, src.phone, src.email, src.address
FROM fag247_import_customers src
WHERE NOT EXISTS (
    SELECT 1 FROM Customers c WHERE c.Phone = src.phone
);

UPDATE Customers c
JOIN fag247_import_customers src ON src.phone = c.Phone
SET c.FullName = src.full_name,
    c.Email = src.email,
    c.DiaChi = src.address
WHERE c.UserID IS NULL;

INSERT INTO Bookings
    (BookingID, CustomerID, SubFieldID, BookingDate, StartTime, EndTime,
     TotalPrice, PaymentMethod, BookingStatus, Note)
SELECT src.booking_id, c.CustomerID, sf.SubFieldID, src.booking_date,
       src.start_time, src.end_time, src.total_price, src.payment_method,
       src.booking_status, src.note
FROM fag247_import_bookings src
JOIN fag247_import_customers sample_customer
  ON sample_customer.customer_id = src.customer_id
JOIN Customers c ON c.Phone = sample_customer.phone
JOIN SportsCenters center ON center.Name = src.center_name
JOIN SubFields sf
  ON sf.CenterID = center.CenterID
 AND sf.SubFieldName = src.field_name;

INSERT INTO FieldTimeSlots (SubFieldID, BookingDate, StartTime, EndTime, IsBooked)
SELECT sf.SubFieldID, src.booking_date,
       ADDTIME(src.start_time, SEC_TO_TIME(halves.half_hour * 1800)),
       ADDTIME(src.start_time, SEC_TO_TIME((halves.half_hour + 1) * 1800)),
       TRUE
FROM fag247_import_bookings src
JOIN SportsCenters center ON center.Name = src.center_name
JOIN SubFields sf
  ON sf.CenterID = center.CenterID
 AND sf.SubFieldName = src.field_name
JOIN (
   SELECT 0 AS half_hour
   UNION ALL SELECT 1
) halves
WHERE ADDTIME(src.start_time, SEC_TO_TIME(halves.half_hour * 1800)) < src.end_time
ON DUPLICATE KEY UPDATE IsBooked = VALUES(IsBooked);

COMMIT;

ALTER TABLE Bookings AUTO_INCREMENT = 21;

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
JOIN SportsCenters c ON c.CenterID = sf.CenterID
JOIN fag247_import_fields src
  ON src.center_name = c.Name
 AND src.field_name = sf.SubFieldName
WHERE sf.SubFieldName REGEXP '([0-9]+[A-Z]|[[:space:]][A-Z])$';

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

SELECT 'SportsCenters' AS table_name, COUNT(*) AS sample_rows
FROM SportsCenters c JOIN fag247_import_centers src ON src.name = c.Name
UNION ALL
SELECT 'Sports', COUNT(*)
FROM Sports s JOIN fag247_import_sports src ON src.sport_name = s.SportName
UNION ALL
SELECT 'SubFields', COUNT(*)
FROM SubFields sf
JOIN SportsCenters c ON c.CenterID = sf.CenterID
LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
JOIN fag247_import_fields src
  ON src.center_name = c.Name
 AND src.field_name = COALESCE(pc.CategoryName, sf.SubFieldName)
UNION ALL
SELECT 'Customers', COUNT(*)
FROM Customers c JOIN fag247_import_customers src ON src.phone = c.Phone
UNION ALL
SELECT 'Bookings', COUNT(*)
FROM Bookings b JOIN fag247_import_bookings src ON src.booking_id = b.BookingID
UNION ALL
SELECT 'FieldTimeSlots', COUNT(*)
FROM FieldTimeSlots slot
JOIN Bookings b
  ON b.SubFieldID = slot.SubFieldID
 AND b.BookingDate = slot.BookingDate
 AND b.StartTime < slot.EndTime
 AND b.EndTime > slot.StartTime
JOIN fag247_import_bookings src ON src.booking_id = b.BookingID;
