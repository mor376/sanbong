-- =========================================================
-- TẠO CƠ SỞ DỮ LIỆU TỔNG HỢP: fag247
-- =========================================================
CREATE DATABASE IF NOT EXISTS fag247
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fag247;

-- 1. BẢNG NGƯỜI DÙNG & TÀI KHOẢN (Users)
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FullName VARCHAR(150) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    Role ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    Status BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG KHÁCH HÀNG (Customers - Liên kết tùy chọn với Users)
CREATE TABLE IF NOT EXISTS Customers (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT UNIQUE,
    FullName VARCHAR(150) NOT NULL,
    Phone VARCHAR(20) NOT NULL UNIQUE,
    Email VARCHAR(150),
    DiaChi VARCHAR(255),
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_user FOREIGN KEY (UserID)
        REFERENCES Users(UserID) ON DELETE SET NULL
);

-- 3. BẢNG NHÂN VIÊN (Staff)
CREATE TABLE IF NOT EXISTS Staff (
    StaffID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL UNIQUE,
    Email VARCHAR(100),
    ChucVu VARCHAR(50) NOT NULL,
    TrangThai VARCHAR(30) NOT NULL DEFAULT 'Đang làm việc'
);

-- 4. BẢNG TRUNG TÂM / CỤM SÂN THỂ THAO (SportsCenters)
CREATE TABLE IF NOT EXISTS SportsCenters (
    CenterID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Address VARCHAR(500) NOT NULL,
    Phone VARCHAR(20),
    Email VARCHAR(100),
    OpenTime TIME DEFAULT '06:00:00',
    CloseTime TIME DEFAULT '23:00:00',
    Rating DECIMAL(2,1) DEFAULT 0.0,
    TotalReviews INT DEFAULT 0,
    Latitude DECIMAL(10,8),
    Longitude DECIMAL(11,8),
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG DANH MỤC MÔN THỂ THAO (Sports)
CREATE TABLE IF NOT EXISTS Sports (
    SportID INT AUTO_INCREMENT PRIMARY KEY,
    SportName VARCHAR(100) NOT NULL UNIQUE
);

-- 6. BẢNG DANH MỤC SÂN (PitchCategories)
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

-- 7. BẢNG SÂN CON / SÂN THÀNH PHẦN (SubFields)
CREATE TABLE IF NOT EXISTS SubFields (
    SubFieldID INT AUTO_INCREMENT PRIMARY KEY,
    CenterID INT NOT NULL,
    SportID INT NOT NULL,
    CategoryID INT,
    SubFieldName VARCHAR(150) NOT NULL,
    Description TEXT,
    GiaGio DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    GiaGioCaoDiem DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    Status ENUM('Active', 'Maintenance', 'Inactive') NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_subfields_category FOREIGN KEY (CategoryID)
        REFERENCES PitchCategories(CategoryID) ON DELETE SET NULL,
    CONSTRAINT fk_subfields_center FOREIGN KEY (CenterID)
        REFERENCES SportsCenters(CenterID) ON DELETE CASCADE,
    CONSTRAINT fk_subfields_sport FOREIGN KEY (SportID)
        REFERENCES Sports(SportID) ON DELETE CASCADE,
    INDEX idx_subfields_center_sport (CenterID, SportID)
);

-- 8. BẢNG QUY ĐỊNH GIÁ THEO KHUNG GIỜ (PricingRules)
CREATE TABLE IF NOT EXISTS PricingRules (
    PricingID INT AUTO_INCREMENT PRIMARY KEY,
    SportID INT NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsWeekend BOOLEAN NOT NULL DEFAULT FALSE,
    PricePerHour DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_pricing_sport FOREIGN KEY (SportID)
        REFERENCES Sports(SportID) ON DELETE CASCADE
);

-- 8. BẢNG QUẢN LÝ SLOT GIỜ ĐẶT SÂN (FieldTimeSlots)
CREATE TABLE IF NOT EXISTS FieldTimeSlots (
    SlotID INT AUTO_INCREMENT PRIMARY KEY,
    SubFieldID INT NOT NULL,
    BookingDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsBooked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_slots_subfield FOREIGN KEY (SubFieldID)
        REFERENCES SubFields(SubFieldID) ON DELETE CASCADE,
    UNIQUE KEY uk_slot_field_date_time (SubFieldID, BookingDate, StartTime, EndTime)
);

-- 9. BẢNG KHUYẾN MÃI (Promotions)
CREATE TABLE IF NOT EXISTS Promotions (
    PromotionID INT AUTO_INCREMENT PRIMARY KEY,
    TenKM VARCHAR(150) NOT NULL,
    PhanTramGiam DECIMAL(5,2) NOT NULL,
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,
    TrangThai VARCHAR(30) NOT NULL DEFAULT 'Đang áp dụng'
);

-- 10. BẢNG ĐẶT SÂN (Bookings)
CREATE TABLE IF NOT EXISTS Bookings (
    BookingID INT AUTO_INCREMENT PRIMARY KEY,
    CustomerID INT NOT NULL,
    SubFieldID INT NOT NULL,
    StaffID INT DEFAULT NULL,
    PromotionID INT DEFAULT NULL,
    BookingDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    TotalPrice DECIMAL(12,2) NOT NULL,
    PaymentMethod VARCHAR(100) NOT NULL DEFAULT 'Thanh toán trực tiếp tại sân',
    BookingStatus ENUM('Pending', 'Confirmed', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    Note TEXT,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_customer FOREIGN KEY (CustomerID)
        REFERENCES Customers(CustomerID),
    CONSTRAINT fk_bookings_subfield FOREIGN KEY (SubFieldID)
        REFERENCES SubFields(SubFieldID),
    CONSTRAINT fk_bookings_staff FOREIGN KEY (StaffID)
        REFERENCES Staff(StaffID) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_promo FOREIGN KEY (PromotionID)
        REFERENCES Promotions(PromotionID) ON DELETE SET NULL,
    INDEX idx_bookings_field_date (SubFieldID, BookingDate),
    INDEX idx_bookings_customer_date (CustomerID, BookingDate)
);

-- 11. BẢNG DỊCH VỤ ĐI KÈM (Services)
CREATE TABLE IF NOT EXISTS Services (
    ServiceID INT AUTO_INCREMENT PRIMARY KEY,
    TenDV VARCHAR(100) NOT NULL,
    DonGia DECIMAL(12,2) NOT NULL,
    DonViTinh VARCHAR(30) NOT NULL,
    TrangThai VARCHAR(30) NOT NULL DEFAULT 'Đang kinh doanh'
);

-- 12. BẢNG CHI TIẾT DỊCH VỤ ĐẶT SÂN (BookingServices)
CREATE TABLE IF NOT EXISTS BookingServices (
    DetailID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID INT NOT NULL,
    ServiceID INT NOT NULL,
    SoLuong INT NOT NULL,
    DonGia DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_bs_booking FOREIGN KEY (BookingID)
        REFERENCES Bookings(BookingID) ON DELETE CASCADE,
    CONSTRAINT fk_bs_service FOREIGN KEY (ServiceID)
        REFERENCES Services(ServiceID),
    UNIQUE KEY uk_booking_service (BookingID, ServiceID)
);

-- 13. BẢNG HÓA ĐƠN (Invoices)
CREATE TABLE IF NOT EXISTS Invoices (
    InvoiceID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID INT NOT NULL UNIQUE,
    NgayLap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TongTien DECIMAL(12,2) NOT NULL,
    GhiChu VARCHAR(500) DEFAULT NULL,
    CONSTRAINT fk_invoice_booking FOREIGN KEY (BookingID)
        REFERENCES Bookings(BookingID) ON DELETE CASCADE
);

-- 14. BẢNG THANH TOÁN (Payments)
CREATE TABLE IF NOT EXISTS Payments (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    BookingID INT NOT NULL,
    SoTien DECIMAL(12,2) NOT NULL,
    PhuongThuc VARCHAR(50) NOT NULL,
    NgayThanhToan DATETIME DEFAULT NULL,
    TrangThai VARCHAR(30) NOT NULL DEFAULT 'Chưa thanh toán',
    CONSTRAINT fk_payment_booking FOREIGN KEY (BookingID)
        REFERENCES Bookings(BookingID) ON DELETE CASCADE
);

-- 15. BẢNG ĐỘI BÓNG / CÂU LẠC BỘ (Teams)
CREATE TABLE IF NOT EXISTS Teams (
    TeamID INT AUTO_INCREMENT PRIMARY KEY,
    TeamName VARCHAR(150) NOT NULL,
    HomeGround VARCHAR(255),
    LogoUrl VARCHAR(500),
    FoundedYear INT,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. BẢNG CẦU THỦ (Players)
CREATE TABLE IF NOT EXISTS Players (
    PlayerID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(150) NOT NULL,
    BirthDate DATE,
    Position VARCHAR(50),
    ShirtNumber INT,
    Height INT,
    TeamID INT,
    Status ENUM('Active', 'Injured', 'Inactive') NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_players_team FOREIGN KEY (TeamID)
        REFERENCES Teams(TeamID) ON DELETE SET NULL
);

-- 17. BẢNG GIẢI ĐẤU (Tournaments)
CREATE TABLE IF NOT EXISTS Tournaments (
    TournamentID INT AUTO_INCREMENT PRIMARY KEY,
    TournamentName VARCHAR(255) NOT NULL,
    Season VARCHAR(50),
    Status ENUM('Upcoming', 'Ongoing', 'Finished') NOT NULL DEFAULT 'Upcoming',
    StartDate DATE,
    EndDate DATE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. BẢNG BẢNG ĐẤU (TournamentGroups)
CREATE TABLE IF NOT EXISTS TournamentGroups (
    GroupID INT AUTO_INCREMENT PRIMARY KEY,
    TournamentID INT NOT NULL,
    GroupName VARCHAR(50) NOT NULL,
    CONSTRAINT fk_groups_tournament FOREIGN KEY (TournamentID)
        REFERENCES Tournaments(TournamentID) ON DELETE CASCADE,
    UNIQUE KEY uk_group_tournament_name (TournamentID, GroupName)
);

-- 19. BẢNG TRẬN ĐẤU (Matches)
CREATE TABLE IF NOT EXISTS Matches (
    MatchID INT AUTO_INCREMENT PRIMARY KEY,
    TournamentID INT NOT NULL,
    HomeTeamID INT NOT NULL,
    AwayTeamID INT NOT NULL,
    SubFieldID INT,
    MatchTime DATETIME NOT NULL,
    HomeScore INT NOT NULL DEFAULT 0,
    AwayScore INT NOT NULL DEFAULT 0,
    MatchStatus ENUM('Scheduled', 'Live', 'Finished', 'Postponed') NOT NULL DEFAULT 'Scheduled',
    CONSTRAINT fk_matches_tournament FOREIGN KEY (TournamentID)
        REFERENCES Tournaments(TournamentID) ON DELETE CASCADE,
    CONSTRAINT fk_matches_home_team FOREIGN KEY (HomeTeamID)
        REFERENCES Teams(TeamID),
    CONSTRAINT fk_matches_away_team FOREIGN KEY (AwayTeamID)
        REFERENCES Teams(TeamID),
    CONSTRAINT fk_matches_subfield FOREIGN KEY (SubFieldID)
        REFERENCES SubFields(SubFieldID) ON DELETE SET NULL,
    INDEX idx_matches_tournament_time (TournamentID, MatchTime)
);

-- 20. BẢNG THỐNG KÊ CẦU THỦ TRONG TRẬN (PlayerMatchStats)
CREATE TABLE IF NOT EXISTS PlayerMatchStats (
    StatID INT AUTO_INCREMENT PRIMARY KEY,
    PlayerID INT NOT NULL,
    MatchID INT NOT NULL,
    Goals INT NOT NULL DEFAULT 0,
    Assists INT NOT NULL DEFAULT 0,
    YellowCards INT NOT NULL DEFAULT 0,
    RedCards INT NOT NULL DEFAULT 0,
    RatingScore DECIMAL(3,1) NOT NULL DEFAULT 0.0,
    CONSTRAINT fk_player_stats_player FOREIGN KEY (PlayerID)
        REFERENCES Players(PlayerID) ON DELETE CASCADE,
    CONSTRAINT fk_player_stats_match FOREIGN KEY (MatchID)
        REFERENCES Matches(MatchID) ON DELETE CASCADE,
    UNIQUE KEY uk_player_match (PlayerID, MatchID)
);

-- 21. BẢNG XẾP HẠNG GIẢI ĐẤU (Standings)
CREATE TABLE IF NOT EXISTS Standings (
    StandingID INT AUTO_INCREMENT PRIMARY KEY,
    TournamentID INT NOT NULL,
    GroupID INT,
    TeamID INT NOT NULL,
    MatchesPlayed INT NOT NULL DEFAULT 0,
    Wins INT NOT NULL DEFAULT 0,
    Draws INT NOT NULL DEFAULT 0,
    Losses INT NOT NULL DEFAULT 0,
    GoalsFor INT NOT NULL DEFAULT 0,
    GoalsAgainst INT NOT NULL DEFAULT 0,
    Points INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_standings_tournament FOREIGN KEY (TournamentID)
        REFERENCES Tournaments(TournamentID) ON DELETE CASCADE,
    CONSTRAINT fk_standings_group FOREIGN KEY (GroupID)
        REFERENCES TournamentGroups(GroupID) ON DELETE SET NULL,
    CONSTRAINT fk_standings_team FOREIGN KEY (TeamID)
        REFERENCES Teams(TeamID) ON DELETE CASCADE,
    UNIQUE KEY uk_standing_tournament_group_team (TournamentID, GroupID, TeamID)
);

-- 22. ĐÁNH GIÁ SÂN CON (PlatformReviews)
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
);