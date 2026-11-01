package com.sanbong.controller;

import com.sanbong.entity.NguoiDung;
import com.sanbong.exception.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Statement;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping("/api/platform")
public class PlatformController {
    private final JdbcTemplate jdbc;

    private record Field(String key, String column, boolean required) {}
    private record Resource(String table, String idColumn, List<Field> fields) {}

    public record BookingRequest(
            @NotNull Integer subFieldId,
            @NotNull LocalDate bookingDate,
            @NotNull LocalTime startTime,
            @NotNull LocalTime endTime,
            @NotBlank @Size(max = 100) String fullName,
            @NotBlank @Pattern(regexp = "^[0-9+ ]{9,15}$") String phone,
            @Email @Size(max = 150) String email,
            @NotBlank @Size(max = 100) String paymentMethod,
            @Size(max = 2000) String note,
            @Size(max = 150) String promotionName) {}

    public record BookingStatusRequest(
            @NotBlank String status) {}

    public record PromotionCheckRequest(
            @NotBlank @Size(max = 150) String name,
            @NotNull LocalDate bookingDate,
            @NotNull BigDecimal baseTotal) {}

    public record PaymentRequest(
            @NotNull @DecimalMin("1.00") BigDecimal amount,
            @NotBlank @Size(max = 50) String method) {}

    private record Promotion(int id, String name, BigDecimal percent) {}

    public PlatformController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/overview")
    public Map<String, Long> overview() {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("sportsCenters", count("SportsCenters"));
        counts.put("sports", count("Sports"));
        counts.put("pitchCategories", count("PitchCategories"));
        counts.put("subFields", count("SubFields"));
        counts.put("bookings", count("Bookings"));
        counts.put("teams", count("Teams"));
        counts.put("players", count("Players"));
        counts.put("tournaments", count("Tournaments"));
        counts.put("matches", count("Matches"));
        return counts;
    }

    @GetMapping("/admin/customers")
    public List<Map<String, Object>> customers() {
        return jdbc.queryForList("""
                SELECT c.CustomerID AS id, c.UserID AS userId, c.FullName AS fullName,
                       c.Phone AS phone, c.Email AS email, c.CreatedAt AS createdAt
                FROM Customers c ORDER BY c.FullName
                """);
    }

    @GetMapping("/admin/users/{userId}/bookings")
    public List<Map<String, Object>> userBookings(@PathVariable int userId) {
        return jdbc.queryForList("""
                SELECT b.BookingID AS id,
                       CASE WHEN pc.CategoryID IS NULL THEN sf.SubFieldName
                            ELSE CONCAT(pc.CategoryName, ' · ', sf.SubFieldName) END AS tenSan,
                       b.BookingDate AS ngay, b.StartTime AS gioBatDau,
                       b.EndTime AS gioKetThuc, b.TotalPrice AS tongTien,
                       b.PaymentMethod AS phuongThucThanhToan,
                       b.BookingStatus AS trangThai
                FROM Bookings b
                JOIN Customers c ON c.CustomerID = b.CustomerID
                JOIN SubFields sf ON sf.SubFieldID = b.SubFieldID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                WHERE c.UserID = ?
                ORDER BY b.BookingDate DESC, b.StartTime DESC
                """, userId);
    }

    @GetMapping("/admin/bookings")
    public List<Map<String, Object>> bookings() {
        return jdbc.queryForList("""
                SELECT b.BookingID AS id, c.FullName AS customerName, c.Phone AS phone,
                       sc.Name AS centerName, pc.CategoryName AS categoryName,
                       sf.SubFieldName AS subFieldName,
                       s.SportName AS sportName, b.BookingDate AS bookingDate,
                       b.StartTime AS startTime, b.EndTime AS endTime,
                       b.TotalPrice AS totalPrice, b.PaymentMethod AS paymentMethod,
                       b.BookingStatus AS status, b.Note AS note, b.CreatedAt AS createdAt
                FROM Bookings b
                JOIN Customers c ON c.CustomerID = b.CustomerID
                JOIN SubFields sf ON sf.SubFieldID = b.SubFieldID
                JOIN SportsCenters sc ON sc.CenterID = sf.CenterID
                JOIN Sports s ON s.SportID = sf.SportID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                ORDER BY b.BookingDate DESC, b.StartTime DESC
                """);
    }

    @PostMapping("/admin/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createAdminBooking(@Valid @RequestBody BookingRequest request) {
        LocalTime start = request.startTime();
        LocalTime end = request.endTime();
        if (!start.isBefore(end) || start.getMinute() % 30 != 0 || end.getMinute() % 30 != 0)
            throw ApiException.badRequest("Khung giờ phải hợp lệ và theo bước 30 phút");
        if (request.bookingDate().isBefore(LocalDate.now())
                || request.bookingDate().equals(LocalDate.now()) && start.isBefore(LocalTime.now()))
            throw ApiException.badRequest("Không thể đặt sân vào thời gian đã qua");

        List<Map<String, Object>> fields = jdbc.queryForList("""
                SELECT sf.SportID AS sportId, sf.Status AS status,
                       sf.GiaGio AS giaGio, sf.GiaGioCaoDiem AS giaGioCaoDiem,
                       sc.OpenTime AS openTime, sc.CloseTime AS closeTime
                FROM SubFields sf JOIN SportsCenters sc ON sc.CenterID = sf.CenterID
                WHERE sf.SubFieldID = ? FOR UPDATE
                """, request.subFieldId());
        if (fields.isEmpty()) throw ApiException.notFound("Không tìm thấy sân con");
        Map<String, Object> field = fields.get(0);
        if (!"Active".equals(field.get("status"))) throw ApiException.conflict("Sân con hiện không hoạt động");
        if (start.isBefore(toLocalTime(field.get("openTime")))
                || end.isAfter(toLocalTime(field.get("closeTime"))))
            throw ApiException.badRequest("Khung giờ nằm ngoài giờ hoạt động của cụm sân");
        if (isBooked(request.subFieldId(), request.bookingDate(), start, end))
            throw ApiException.conflict("Khung giờ này đã có người đặt");

        int sportId = ((Number) field.get("sportId")).intValue();
        BigDecimal originalTotal = BigDecimal.ZERO;
        for (LocalTime cursor = start; cursor.isBefore(end); cursor = cursor.plusMinutes(30)) {
            LocalTime slotEnd = cursor.plusMinutes(30);
            if (slotEnd.isAfter(end)) throw ApiException.badRequest("Khung giờ phải theo bước 30 phút");
            originalTotal = originalTotal.add(hourlyPrice(field, sportId, request.bookingDate(), cursor, slotEnd)
                    .divide(BigDecimal.valueOf(2)));
        }
        Promotion promotion = request.promotionName() == null || request.promotionName().isBlank()
                ? null : findPromotion(request.promotionName(), request.bookingDate());
        BigDecimal discount = promotion == null ? BigDecimal.ZERO : discountAmount(originalTotal, promotion.percent());
        BigDecimal total = originalTotal.subtract(discount);

        Integer customerId = jdbc.query("""
                SELECT CustomerID FROM Customers WHERE Phone = ? FOR UPDATE
                """, rs -> rs.next() ? rs.getInt(1) : null, request.phone().trim());
        if (customerId == null) {
            KeyHolder customerKey = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                var statement = connection.prepareStatement("""
                        INSERT INTO Customers (FullName, Phone, Email)
                        VALUES (?, ?, ?)
                        """, Statement.RETURN_GENERATED_KEYS);
                statement.setString(1, request.fullName().trim());
                statement.setString(2, request.phone().trim());
                statement.setString(3, blankToNull(request.email()));
                return statement;
            }, customerKey);
            customerId = Objects.requireNonNull(customerKey.getKey()).intValue();
        } else {
            jdbc.update("""
                    UPDATE Customers SET FullName = ?, Email = ?
                    WHERE CustomerID = ? AND UserID IS NULL
                    """, request.fullName().trim(), blankToNull(request.email()), customerId);
        }

        KeyHolder bookingKey = new GeneratedKeyHolder();
        int finalCustomerId = customerId;
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("""
                    INSERT INTO Bookings
                        (CustomerID, SubFieldID, PromotionID, BookingDate, StartTime, EndTime,
                         TotalPrice, PaymentMethod, BookingStatus, Note)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setInt(1, finalCustomerId);
            statement.setInt(2, request.subFieldId());
            if (promotion == null) statement.setNull(3, java.sql.Types.INTEGER);
            else statement.setInt(3, promotion.id());
            statement.setObject(4, request.bookingDate());
            statement.setObject(5, start);
            statement.setObject(6, end);
            statement.setBigDecimal(7, total);
            statement.setString(8, request.paymentMethod().trim());
            statement.setString(9, blankToNull(request.note()));
            return statement;
        }, bookingKey);
        for (LocalTime cursor = start; cursor.isBefore(end); cursor = cursor.plusMinutes(30)) {
            jdbc.update("""
                    INSERT INTO FieldTimeSlots (SubFieldID, BookingDate, StartTime, EndTime, IsBooked)
                    VALUES (?, ?, ?, ?, TRUE)
                    ON DUPLICATE KEY UPDATE IsBooked = TRUE
                    """, request.subFieldId(), request.bookingDate(), cursor, cursor.plusMinutes(30));
        }
        return Map.of("id", Objects.requireNonNull(bookingKey.getKey()).longValue(),
                "status", "Confirmed", "totalPrice", total);
    }

    @GetMapping("/bookings/mine")
    public List<Map<String, Object>> myBookings(@AuthenticationPrincipal NguoiDung user) {
        return jdbc.queryForList("""
                SELECT b.BookingID AS id,
                       CASE WHEN pc.CategoryID IS NULL THEN sf.SubFieldName
                            ELSE CONCAT(pc.CategoryName, ' · ', sf.SubFieldName) END AS tenSan,
                       b.BookingDate AS ngay, b.StartTime AS gioBatDau,
                       b.EndTime AS gioKetThuc, b.TotalPrice AS tongTien,
                       b.PaymentMethod AS phuongThucThanhToan,
                       b.BookingStatus AS trangThai, b.Note AS ghiChu
                FROM Bookings b
                JOIN Customers c ON c.CustomerID = b.CustomerID
                JOIN SubFields sf ON sf.SubFieldID = b.SubFieldID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                WHERE c.UserID = ?
                ORDER BY b.BookingDate DESC, b.StartTime DESC, b.BookingID DESC
                """, user.getId());
    }

    @PutMapping("/admin/bookings/{id}/status")
    @Transactional
    public Map<String, Object> updateBookingStatus(@PathVariable int id,
                                                   @Valid @RequestBody BookingStatusRequest request) {
        Set<String> statuses = Set.of("Pending", "Confirmed", "Completed", "Cancelled");
        if (!statuses.contains(request.status()))
            throw ApiException.badRequest("Trạng thái đặt sân không hợp lệ");
        List<Map<String, Object>> booking = jdbc.queryForList("""
                SELECT SubFieldID AS subFieldId, BookingDate AS bookingDate,
                       StartTime AS startTime, EndTime AS endTime
                FROM Bookings WHERE BookingID = ?
                """, id);
        if (booking.isEmpty()) throw ApiException.notFound("Không tìm thấy đơn đặt sân");
        Map<String, Object> row = booking.get(0);
        jdbc.update("UPDATE Bookings SET BookingStatus = ? WHERE BookingID = ?", request.status(), id);
        jdbc.update("""
                UPDATE FieldTimeSlots SET IsBooked = ?
                WHERE SubFieldID = ? AND BookingDate = ? AND StartTime >= ? AND EndTime <= ?
                """, !"Cancelled".equals(request.status()), row.get("subFieldId"),
                row.get("bookingDate"), row.get("startTime"), row.get("endTime"));
        return Map.of("id", id, "status", request.status());
    }

    @GetMapping("/admin/invoices")
    public List<Map<String, Object>> invoices() {
        List<Map<String, Object>> result = jdbc.queryForList("""
                SELECT i.InvoiceID AS id, i.BookingID AS datSanId,
                       CASE WHEN pc.CategoryID IS NULL THEN sf.SubFieldName
                            ELSE CONCAT(pc.CategoryName, ' · ', sf.SubFieldName) END AS tenSan,
                       c.FullName AS tenKhach,
                       b.BookingDate AS ngayDat, i.TongTien AS tongTien,
                       i.GhiChu AS ghiChu,
                       COALESCE(paid.total, 0) AS daThanhToan,
                       GREATEST(i.TongTien - COALESCE(paid.total, 0), 0) AS conLai
                FROM Invoices i
                JOIN Bookings b ON b.BookingID = i.BookingID
                JOIN Customers c ON c.CustomerID = b.CustomerID
                JOIN SubFields sf ON sf.SubFieldID = b.SubFieldID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                LEFT JOIN (
                    SELECT BookingID, SUM(SoTien) AS total
                    FROM Payments WHERE TrangThai = 'Đã thanh toán'
                    GROUP BY BookingID
                ) paid ON paid.BookingID = b.BookingID
                ORDER BY i.NgayLap DESC, i.InvoiceID DESC
                """);
        for (Map<String, Object> invoice : result) {
            invoice.put("thanhToans", jdbc.queryForList("""
                    SELECT PaymentID AS id, SoTien AS soTien, PhuongThuc AS phuongThuc,
                           NgayThanhToan AS ngayThanhToan, TrangThai AS trangThai
                    FROM Payments WHERE BookingID = ? ORDER BY PaymentID
                    """, invoice.get("datSanId")));
        }
        return result;
    }

    @PostMapping("/admin/bookings/{id}/invoice")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createInvoice(@PathVariable int id,
                                              @RequestBody(required = false) Map<String, String> request) {
        Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM Invoices WHERE BookingID = ?",
                Integer.class, id);
        if (Objects.requireNonNull(existing) > 0) throw ApiException.conflict("Đơn đặt sân đã có hóa đơn");
        int created = jdbc.update("""
                INSERT INTO Invoices (BookingID, TongTien, GhiChu)
                SELECT BookingID, TotalPrice, ?
                FROM Bookings WHERE BookingID = ? AND BookingStatus = 'Completed'
                """, request == null ? null : blankToNull(request.get("ghiChu")), id);
        if (created == 0) throw ApiException.badRequest("Chỉ lập hóa đơn cho đơn đã hoàn thành");
        return Map.of("bookingId", id);
    }

    @PostMapping("/admin/bookings/{id}/payments")
    @Transactional
    public Map<String, Object> recordPayment(@PathVariable int id,
                                             @Valid @RequestBody PaymentRequest request) {
        List<Map<String, Object>> invoices = jdbc.queryForList("""
                SELECT i.TongTien AS total,
                       COALESCE((SELECT SUM(p.SoTien) FROM Payments p
                                 WHERE p.BookingID = i.BookingID AND p.TrangThai = 'Đã thanh toán'), 0) AS paid
                FROM Invoices i WHERE i.BookingID = ?
                """, id);
        if (invoices.isEmpty()) throw ApiException.notFound("Không tìm thấy hóa đơn của đơn đặt sân");
        BigDecimal total = (BigDecimal) invoices.get(0).get("total");
        BigDecimal paid = (BigDecimal) invoices.get(0).get("paid");
        if (request.amount().compareTo(total.subtract(paid)) > 0)
            throw ApiException.badRequest("Số tiền thanh toán vượt quá số tiền còn lại");
        jdbc.update("""
                INSERT INTO Payments (BookingID, SoTien, PhuongThuc, NgayThanhToan, TrangThai)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'Đã thanh toán')
                """, id, request.amount(), request.method().trim());
        return Map.of("bookingId", id, "paidAmount", request.amount());
    }

    @PostMapping("/promotions/validate")
    public Map<String, Object> validatePromotion(@Valid @RequestBody PromotionCheckRequest request) {
        if (request.baseTotal().signum() < 0)
            throw ApiException.badRequest("Tổng tiền không hợp lệ");
        Promotion promotion = findPromotion(request.name(), request.bookingDate());
        BigDecimal discount = discountAmount(request.baseTotal(), promotion.percent());
        return Map.of("name", promotion.name(), "discountPercent", promotion.percent(),
                "originalTotal", request.baseTotal(), "discountAmount", discount,
                "totalPrice", request.baseTotal().subtract(discount));
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createBooking(@AuthenticationPrincipal NguoiDung user,
                                              @Valid @RequestBody BookingRequest request) {
        LocalTime start = request.startTime();
        LocalTime end = request.endTime();
        if (!start.isBefore(end) || start.getMinute() % 30 != 0 || end.getMinute() % 30 != 0)
            throw ApiException.badRequest("Khung giờ phải hợp lệ và theo bước 30 phút");
        if (request.bookingDate().isBefore(LocalDate.now())
                || request.bookingDate().equals(LocalDate.now()) && start.isBefore(LocalTime.now()))
            throw ApiException.badRequest("Không thể đặt sân vào thời gian đã qua");

        List<Map<String, Object>> fieldRows = jdbc.queryForList("""
                SELECT sf.SubFieldID, sf.SportID AS sportId, sf.Status,
                       sf.GiaGio AS giaGio, sf.GiaGioCaoDiem AS giaGioCaoDiem,
                       sc.OpenTime, sc.CloseTime
                FROM SubFields sf JOIN SportsCenters sc ON sc.CenterID = sf.CenterID
                WHERE sf.SubFieldID = ? FOR UPDATE
                """, request.subFieldId());
        if (fieldRows.isEmpty()) throw ApiException.notFound("Không tìm thấy sân con");
        Map<String, Object> field = fieldRows.get(0);
        if (!"Active".equals(field.get("Status"))) throw ApiException.conflict("Sân con hiện không hoạt động");
        LocalTime open = toLocalTime(field.get("OpenTime"));
        LocalTime close = toLocalTime(field.get("CloseTime"));
        if (start.isBefore(open) || end.isAfter(close))
            throw ApiException.badRequest("Khung giờ nằm ngoài giờ hoạt động của cụm sân");

        Integer conflict = jdbc.queryForObject("""
                SELECT COUNT(*) FROM Bookings
                WHERE SubFieldID = ? AND BookingDate = ? AND BookingStatus <> 'Cancelled'
                  AND StartTime < ? AND EndTime > ?
                """, Integer.class, request.subFieldId(), request.bookingDate(), end, start);
        Integer bookedSlots = jdbc.queryForObject("""
                SELECT COUNT(*) FROM FieldTimeSlots
                WHERE SubFieldID = ? AND BookingDate = ? AND IsBooked = TRUE
                  AND StartTime < ? AND EndTime > ?
                """, Integer.class, request.subFieldId(), request.bookingDate(), end, start);
        if (Objects.requireNonNull(conflict) > 0 || Objects.requireNonNull(bookedSlots) > 0)
            throw ApiException.conflict("Khung giờ này đã có người đặt");

        int sportId = ((Number) field.get("sportId")).intValue();
        BigDecimal total = BigDecimal.ZERO;
        for (LocalTime cursor = start; cursor.isBefore(end); cursor = cursor.plusMinutes(30)) {
            LocalTime slotEnd = cursor.plusMinutes(30);
            if (slotEnd.isAfter(end)) throw ApiException.badRequest("Khung giờ phải theo bước 30 phút");
            BigDecimal hourlyPrice = hourlyPrice(field, sportId, request.bookingDate(), cursor, slotEnd);
            total = total.add(hourlyPrice.divide(BigDecimal.valueOf(2)));
        }
        BigDecimal originalTotal = total;
        Promotion promotion = request.promotionName() == null || request.promotionName().isBlank()
                ? null : findPromotion(request.promotionName(), request.bookingDate());
        BigDecimal discount = promotion == null ? BigDecimal.ZERO : discountAmount(originalTotal, promotion.percent());
        BigDecimal bookingTotal = originalTotal.subtract(discount);

        List<Map<String, Object>> customerRows = jdbc.queryForList("""
                SELECT CustomerID AS customerId, UserID AS userId, Phone AS phone
                FROM Customers WHERE UserID = ? OR Phone = ? FOR UPDATE
                """, user.getId(), request.phone().trim());
        Map<String, Object> accountCustomer = customerRows.stream()
                .filter(row -> row.get("userId") != null
                        && ((Number) row.get("userId")).longValue() == user.getId())
                .findFirst().orElse(null);
        Map<String, Object> phoneCustomer = customerRows.stream()
                .filter(row -> request.phone().trim().equals(row.get("phone")))
                .findFirst().orElse(null);
        if (phoneCustomer != null && phoneCustomer.get("userId") != null
                && ((Number) phoneCustomer.get("userId")).longValue() != user.getId())
            throw ApiException.conflict("Số điện thoại đã được liên kết với tài khoản khác");

        Integer customerId;
        if (accountCustomer != null) {
            customerId = ((Number) accountCustomer.get("customerId")).intValue();
            if (phoneCustomer != null
                    && !Objects.equals(accountCustomer.get("customerId"), phoneCustomer.get("customerId"))) {
                int duplicateCustomerId = ((Number) phoneCustomer.get("customerId")).intValue();
                jdbc.update("UPDATE Bookings SET CustomerID = ? WHERE CustomerID = ?",
                        customerId, duplicateCustomerId);
                jdbc.update("DELETE FROM Customers WHERE CustomerID = ?", duplicateCustomerId);
            }
            jdbc.update("""
                    UPDATE Customers SET FullName = ?, Phone = ?, Email = ?
                    WHERE CustomerID = ?
                    """, request.fullName().trim(), request.phone().trim(),
                    blankToNull(request.email()), customerId);
        } else if (phoneCustomer != null) {
            customerId = ((Number) phoneCustomer.get("customerId")).intValue();
            jdbc.update("""
                    UPDATE Customers SET UserID = ?, FullName = ?, Email = ?
                    WHERE CustomerID = ?
                    """, user.getId(), request.fullName().trim(), blankToNull(request.email()), customerId);
        } else {
            KeyHolder customerKey = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                var statement = connection.prepareStatement("""
                        INSERT INTO Customers (UserID, FullName, Phone, Email)
                        VALUES (?, ?, ?, ?)
                        """, Statement.RETURN_GENERATED_KEYS);
                statement.setLong(1, user.getId());
                statement.setString(2, request.fullName().trim());
                statement.setString(3, request.phone().trim());
                statement.setString(4, blankToNull(request.email()));
                return statement;
            }, customerKey);
            customerId = Objects.requireNonNull(customerKey.getKey()).intValue();
        }

        KeyHolder bookingKey = new GeneratedKeyHolder();
        int finalCustomerId = customerId;
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("""
                    INSERT INTO Bookings
                        (CustomerID, SubFieldID, PromotionID, BookingDate, StartTime, EndTime,
                         TotalPrice, PaymentMethod, BookingStatus, Note)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
                    """, Statement.RETURN_GENERATED_KEYS);
            statement.setInt(1, finalCustomerId);
            statement.setInt(2, request.subFieldId());
            if (promotion == null) statement.setNull(3, java.sql.Types.INTEGER);
            else statement.setInt(3, promotion.id());
            statement.setObject(4, request.bookingDate());
            statement.setObject(5, start);
            statement.setObject(6, end);
            statement.setBigDecimal(7, bookingTotal);
            statement.setString(8, request.paymentMethod().trim());
            statement.setString(9, blankToNull(request.note()));
            return statement;
        }, bookingKey);
        for (LocalTime cursor = start; cursor.isBefore(end); cursor = cursor.plusMinutes(30)) {
            jdbc.update("""
                    INSERT INTO FieldTimeSlots (SubFieldID, BookingDate, StartTime, EndTime, IsBooked)
                    VALUES (?, ?, ?, ?, TRUE)
                    ON DUPLICATE KEY UPDATE IsBooked = TRUE
                    """, request.subFieldId(), request.bookingDate(), cursor, cursor.plusMinutes(30));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", Objects.requireNonNull(bookingKey.getKey()).longValue());
        result.put("status", "Pending");
        result.put("totalPrice", bookingTotal);
        result.put("originalTotal", originalTotal);
        result.put("discountAmount", discount);
        if (promotion != null) result.put("promotionName", promotion.name());
        return result;
    }

    private Promotion findPromotion(String name, LocalDate bookingDate) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT PromotionID AS id, TenKM AS name, PhanTramGiam AS percent
                FROM Promotions
                WHERE LOWER(TenKM) = LOWER(?) AND TrangThai = 'Đang áp dụng'
                  AND NgayBatDau <= ? AND NgayKetThuc >= ?
                ORDER BY PromotionID DESC LIMIT 1
                """, name.trim(), bookingDate, bookingDate);
        if (rows.isEmpty()) throw ApiException.badRequest("Khuyến mãi không tồn tại hoặc không áp dụng cho ngày đã chọn");
        Map<String, Object> row = rows.get(0);
        return new Promotion(((Number) row.get("id")).intValue(),
                Objects.toString(row.get("name")), (BigDecimal) row.get("percent"));
    }

    private BigDecimal discountAmount(BigDecimal total, BigDecimal percent) {
        return total.multiply(percent).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
    }

    @GetMapping("/sports-centers")
    public List<Map<String, Object>> sportsCenters() {
        return jdbc.queryForList("""
                SELECT CenterID AS id, Name AS name, Address AS address, Phone AS phone,
                       Email AS email, OpenTime AS openTime, CloseTime AS closeTime,
                       Rating AS rating, TotalReviews AS totalReviews,
                       Latitude AS latitude, Longitude AS longitude
                FROM SportsCenters ORDER BY Name
                """);
    }

    @GetMapping("/sports")
    public List<Map<String, Object>> sports() {
        return jdbc.queryForList("""
                SELECT SportID AS id, SportName AS name
                FROM Sports ORDER BY SportName
                """);
    }

    @GetMapping("/subfields")
    public List<Map<String, Object>> subFields(
            @RequestParam(name = "centerId", required = false) Integer centerId,
            @RequestParam(name = "sportId", required = false) Integer sportId) {
        StringBuilder sql = new StringBuilder("""
                SELECT sf.SubFieldID AS id, sf.CenterID AS centerId, sc.Name AS centerName,
                       pc.CategoryID AS categoryId, pc.CategoryName AS categoryName,
                       pc.PlayerCount AS playerCount,
                       sc.Address AS address, sf.SportID AS sportId, s.SportName AS sportName,
                       sf.SubFieldName AS name, sf.Description AS description, sf.Status AS status,
                       sf.GiaGio AS giaGio, sf.GiaGioCaoDiem AS giaGioCaoDiem,
                       sc.OpenTime AS openTime, sc.CloseTime AS closeTime
                FROM SubFields sf
                JOIN SportsCenters sc ON sc.CenterID = sf.CenterID
                JOIN Sports s ON s.SportID = sf.SportID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                WHERE 1 = 1
                """);
        if (centerId != null) sql.append(" AND sf.CenterID = ?");
        if (sportId != null) sql.append(" AND sf.SportID = ?");
        sql.append(" ORDER BY sc.Name, s.SportName, sf.SubFieldName");
        if (centerId == null && sportId == null) return jdbc.queryForList(sql.toString());
        if (centerId != null && sportId != null)
            return jdbc.queryForList(sql.toString(), centerId, sportId);
        return jdbc.queryForList(sql.toString(), centerId != null ? centerId : sportId);
    }

    @GetMapping("/pitches")
    public List<Map<String, Object>> pitches() {
        return jdbc.queryForList("""
                SELECT sf.SubFieldID AS id, sf.CenterID AS centerId, sc.Name AS centerName,
                       pc.CategoryID AS categoryId, pc.CategoryName AS categoryName,
                       pc.PlayerCount AS playerCount,
                       sf.SubFieldName AS ten, sf.SportID AS sportId,
                       s.SportName AS sportName, sf.Description AS moTa,
                       sc.Address AS diaChi, sf.GiaGio AS giaGio,
                       sf.GiaGioCaoDiem AS giaGioCaoDiem,
                       sc.OpenTime AS gioMo, sc.CloseTime AS gioDong, sf.Status AS status
                FROM SubFields sf
                JOIN SportsCenters sc ON sc.CenterID = sf.CenterID
                JOIN Sports s ON s.SportID = sf.SportID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                ORDER BY sc.Name, s.SportName, sf.SubFieldName
                """).stream().map(this::pitchResponse).toList();
    }

    @GetMapping("/pitches/{id}")
    public Map<String, Object> pitch(@PathVariable int id) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT sf.SubFieldID AS id, sf.CenterID AS centerId, sc.Name AS centerName,
                       pc.CategoryID AS categoryId, pc.CategoryName AS categoryName,
                       pc.PlayerCount AS playerCount,
                       sf.SubFieldName AS ten, sf.SportID AS sportId,
                       s.SportName AS sportName, sf.Description AS moTa,
                       sc.Address AS diaChi, sf.GiaGio AS giaGio,
                       sf.GiaGioCaoDiem AS giaGioCaoDiem,
                       sc.OpenTime AS gioMo, sc.CloseTime AS gioDong, sf.Status AS status
                FROM SubFields sf
                JOIN SportsCenters sc ON sc.CenterID = sf.CenterID
                JOIN Sports s ON s.SportID = sf.SportID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                WHERE sf.SubFieldID = ?
                """, id);
        if (rows.isEmpty()) throw ApiException.notFound("Không tìm thấy sân");
        return pitchResponse(rows.get(0));
    }

    @GetMapping("/pitches/available")
    public List<Map<String, Object>> availablePitches(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("startTime") @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam("endTime") @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(name = "sportId", required = false) Integer sportId) {
        if (!startTime.isBefore(endTime) || startTime.getMinute() % 30 != 0
                || endTime.getMinute() % 30 != 0)
            throw ApiException.badRequest("Khung giờ phải hợp lệ và theo bước 30 phút");
        if (date.isBefore(LocalDate.now())
                || date.equals(LocalDate.now()) && startTime.isBefore(LocalTime.now()))
            throw ApiException.badRequest("Không thể tìm sân trong thời gian đã qua");

        List<Map<String, Object>> fields = pitches().stream()
                .filter(field -> sportId == null || ((Number) field.get("sportId")).intValue() == sportId)
                .toList();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> field : fields) {
            LocalTime open = toLocalTime(field.get("gioMo"));
            LocalTime close = toLocalTime(field.get("gioDong"));
            if (!"HOAT_DONG".equals(field.get("trangThai"))
                    || startTime.isBefore(open) || endTime.isAfter(close)
                    || isBooked((Integer) field.get("id"), date, startTime, endTime)) continue;
            BigDecimal total = fieldPrice(field, date, startTime, endTime);
            result.add(Map.of("san", field, "tongTien", total.longValue()));
        }
        return result;
    }

    @GetMapping("/pitches/{id}/schedule")
    public List<Map<String, Object>> pitchSchedule(
            @PathVariable int id,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Map<String, Object>> fields = jdbc.queryForList("""
                SELECT sf.SubFieldID AS id, sf.SportID AS sportId, sf.GiaGio AS giaGio,
                       sf.GiaGioCaoDiem AS giaGioCaoDiem, sf.Status AS status,
                       sc.OpenTime AS openTime, sc.CloseTime AS closeTime
                FROM SubFields sf JOIN SportsCenters sc ON sc.CenterID = sf.CenterID
                WHERE sf.SubFieldID = ?
                """, id);
        if (fields.isEmpty()) throw ApiException.notFound("Không tìm thấy sân");
        Map<String, Object> field = fields.get(0);
        LocalTime open = toLocalTime(field.get("openTime"));
        LocalTime close = toLocalTime(field.get("closeTime"));
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        List<Map<String, Object>> slots = new ArrayList<>();
        for (LocalTime start = open; start.isBefore(close); start = start.plusMinutes(30)) {
            LocalTime end = start.plusMinutes(30);
            if (end.isAfter(close)) break;
            boolean past = LocalDateTime.of(date, start).isBefore(now);
            boolean booked = !"Active".equals(field.get("status"))
                    || past || isBooked(id, date, start, end);
            BigDecimal hourlyPrice = hourlyPrice(field, date, start, end);
            Map<String, Object> slot = new LinkedHashMap<>();
            slot.put("gio", start.getHour());
            slot.put("phut", start.getMinute());
            slot.put("nhan", String.format("%02d:%02d - %02d:%02d",
                    start.getHour(), start.getMinute(), end.getHour(), end.getMinute()));
            slot.put("trong", !booked);
            slot.put("quaKhu", past);
            slot.put("gia", hourlyPrice.divide(BigDecimal.valueOf(2)).longValue());
            slots.add(slot);
        }
        return slots;
    }

    @GetMapping("/pricing-rules")
    public List<Map<String, Object>> pricingRules(
            @RequestParam(name = "sportId", required = false) Integer sportId) {
        if (sportId == null) return jdbc.queryForList("""
                SELECT p.PricingID AS id, p.SportID AS sportId, s.SportName AS sportName,
                       p.StartTime AS startTime, p.EndTime AS endTime,
                       p.IsWeekend AS weekend, p.PricePerHour AS pricePerHour
                FROM PricingRules p JOIN Sports s ON s.SportID = p.SportID
                ORDER BY s.SportName, p.IsWeekend, p.StartTime
                """);
        return jdbc.queryForList("""
                SELECT p.PricingID AS id, p.SportID AS sportId, s.SportName AS sportName,
                       p.StartTime AS startTime, p.EndTime AS endTime,
                       p.IsWeekend AS weekend, p.PricePerHour AS pricePerHour
                FROM PricingRules p JOIN Sports s ON s.SportID = p.SportID
                WHERE p.SportID = ?
                ORDER BY p.IsWeekend, p.StartTime
                """, sportId);
    }

    @GetMapping("/time-slots")
    public List<Map<String, Object>> timeSlots(
            @RequestParam("subFieldId") int subFieldId,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return jdbc.queryForList("""
                SELECT SlotID AS id, SubFieldID AS subFieldId, BookingDate AS bookingDate,
                       StartTime AS startTime, EndTime AS endTime, IsBooked AS booked
                FROM FieldTimeSlots
                WHERE SubFieldID = ? AND BookingDate = ?
                ORDER BY StartTime
                """, subFieldId, date);
    }

    @GetMapping("/teams")
    public List<Map<String, Object>> teams() {
        return jdbc.queryForList("""
                SELECT TeamID AS id, TeamName AS name, HomeGround AS homeGround,
                       LogoUrl AS logoUrl, FoundedYear AS foundedYear
                FROM Teams ORDER BY TeamName
                """);
    }

    @GetMapping("/players")
    public List<Map<String, Object>> players() {
        return jdbc.queryForList("""
                SELECT p.PlayerID AS id, p.FullName AS fullName, p.BirthDate AS birthDate,
                       p.Position AS position, p.ShirtNumber AS shirtNumber, p.Height AS height,
                       p.TeamID AS teamId, t.TeamName AS teamName, p.Status AS status
                FROM Players p LEFT JOIN Teams t ON t.TeamID = p.TeamID
                ORDER BY p.FullName
                """);
    }

    @GetMapping("/tournaments")
    public List<Map<String, Object>> tournaments() {
        return jdbc.queryForList("""
                SELECT TournamentID AS id, TournamentName AS name, Season AS season,
                       Status AS status, StartDate AS startDate, EndDate AS endDate
                FROM Tournaments ORDER BY StartDate, TournamentName
                """);
    }

    @GetMapping("/tournaments/{id}")
    public Map<String, Object> tournament(@PathVariable int id) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT TournamentID AS id, TournamentName AS name, Season AS season,
                       Status AS status, StartDate AS startDate, EndDate AS endDate
                FROM Tournaments WHERE TournamentID = ?
                """, id);
        if (rows.isEmpty()) throw ApiException.notFound("Không tìm thấy giải đấu");
        return rows.get(0);
    }

    @GetMapping("/groups")
    public List<Map<String, Object>> groups(
            @RequestParam(name = "tournamentId", required = false) Integer tournamentId) {
        if (tournamentId == null) return jdbc.queryForList("""
                SELECT g.GroupID AS id, g.TournamentID AS tournamentId,
                       t.TournamentName AS tournamentName, g.GroupName AS name
                FROM TournamentGroups g JOIN Tournaments t ON t.TournamentID = g.TournamentID
                ORDER BY t.TournamentName, g.GroupName
                """);
        return jdbc.queryForList("""
                SELECT g.GroupID AS id, g.TournamentID AS tournamentId,
                       t.TournamentName AS tournamentName, g.GroupName AS name
                FROM TournamentGroups g JOIN Tournaments t ON t.TournamentID = g.TournamentID
                WHERE g.TournamentID = ?
                ORDER BY g.GroupName
                """, tournamentId);
    }

    @GetMapping("/matches")
    public List<Map<String, Object>> matches(
            @RequestParam(name = "tournamentId", required = false) Integer tournamentId) {
        String query = """
                SELECT m.MatchID AS id, m.TournamentID AS tournamentId,
                       t.TournamentName AS tournamentName, m.HomeTeamID AS homeTeamId,
                       home.TeamName AS homeTeam, m.AwayTeamID AS awayTeamId,
                       away.TeamName AS awayTeam, m.SubFieldID AS subFieldId,
                       CASE WHEN pc.CategoryID IS NULL THEN sf.SubFieldName
                            ELSE CONCAT(pc.CategoryName, ' · ', sf.SubFieldName) END AS subFieldName,
                       m.MatchTime AS matchTime,
                       m.HomeScore AS homeScore, m.AwayScore AS awayScore,
                       m.MatchStatus AS status
                FROM Matches m
                JOIN Tournaments t ON t.TournamentID = m.TournamentID
                JOIN Teams home ON home.TeamID = m.HomeTeamID
                JOIN Teams away ON away.TeamID = m.AwayTeamID
                LEFT JOIN SubFields sf ON sf.SubFieldID = m.SubFieldID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                """;
        if (tournamentId == null)
            return jdbc.queryForList(query + " ORDER BY m.MatchTime");
        return jdbc.queryForList(query + " WHERE m.TournamentID = ? ORDER BY m.MatchTime", tournamentId);
    }

    @GetMapping("/player-stats")
    public List<Map<String, Object>> playerStats(
            @RequestParam(name = "matchId", required = false) Integer matchId) {
        String query = """
                SELECT ps.StatID AS id, ps.PlayerID AS playerId, p.FullName AS playerName,
                       ps.MatchID AS matchId, m.MatchTime AS matchTime,
                       ps.Goals AS goals, ps.Assists AS assists,
                       ps.YellowCards AS yellowCards, ps.RedCards AS redCards,
                       ps.RatingScore AS rating
                FROM PlayerMatchStats ps
                JOIN Players p ON p.PlayerID = ps.PlayerID
                JOIN Matches m ON m.MatchID = ps.MatchID
                """;
        if (matchId == null) return jdbc.queryForList(query + " ORDER BY m.MatchTime DESC, p.FullName");
        return jdbc.queryForList(query + " WHERE ps.MatchID = ? ORDER BY p.FullName", matchId);
    }

    @GetMapping("/standings")
    public List<Map<String, Object>> standings(
            @RequestParam(name = "tournamentId", required = false) Integer tournamentId) {
        String query = """
                SELECT st.StandingID AS id, st.TournamentID AS tournamentId,
                       t.TournamentName AS tournamentName, st.GroupID AS groupId,
                       g.GroupName AS groupName, st.TeamID AS teamId, team.TeamName AS teamName,
                       st.MatchesPlayed AS matchesPlayed, st.Wins AS wins, st.Draws AS draws,
                       st.Losses AS losses, st.GoalsFor AS goalsFor,
                       st.GoalsAgainst AS goalsAgainst, st.Points AS points
                FROM Standings st
                JOIN Tournaments t ON t.TournamentID = st.TournamentID
                LEFT JOIN TournamentGroups g ON g.GroupID = st.GroupID
                JOIN Teams team ON team.TeamID = st.TeamID
                """;
        if (tournamentId == null) return jdbc.queryForList(query + " ORDER BY t.TournamentName, st.Points DESC");
        return jdbc.queryForList(query + " WHERE st.TournamentID = ? ORDER BY st.Points DESC", tournamentId);
    }

    @GetMapping("/admin/{resource}")
    public List<Map<String, Object>> adminList(@PathVariable String resource) {
        Resource config = resource(resource);
        String columns = config.fields().stream()
                .map(field -> field.column() + " AS " + field.key()).collect(Collectors.joining(", "));
        return jdbc.queryForList("SELECT " + config.idColumn() + " AS id, " + columns
                + " FROM " + config.table() + " ORDER BY " + config.idColumn() + " DESC");
    }

    @PostMapping("/admin/{resource}")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> adminCreate(@PathVariable String resource,
                                           @RequestBody Map<String, Object> body) {
        Resource config = resource(resource);
        List<Field> supplied = suppliedFields(config, body, true);
        String columns = supplied.stream().map(Field::column).collect(Collectors.joining(", "));
        String placeholders = supplied.stream().map(field -> "?").collect(Collectors.joining(", "));
        Object[] values = supplied.stream().map(field -> body.get(field.key())).toArray();
        KeyHolder key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            var statement = connection.prepareStatement("INSERT INTO " + config.table() + " ("
                    + columns + ") VALUES (" + placeholders + ")", Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < values.length; i++) statement.setObject(i + 1, values[i]);
            return statement;
        }, key);
        return Map.of("id", Objects.requireNonNull(key.getKey()).longValue());
    }

    @PutMapping("/admin/{resource}/{id}")
    @Transactional
    public Map<String, Object> adminUpdate(@PathVariable String resource, @PathVariable long id,
                                           @RequestBody Map<String, Object> body) {
        Resource config = resource(resource);
        List<Field> supplied = suppliedFields(config, body, false);
        if (supplied.isEmpty()) throw ApiException.badRequest("Không có trường nào để cập nhật");
        Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM " + config.table()
                + " WHERE " + config.idColumn() + " = ?", Integer.class, id);
        if (Objects.requireNonNull(exists) == 0) throw ApiException.notFound("Không tìm thấy bản ghi");
        String assignments = supplied.stream().map(field -> field.column() + " = ?").collect(Collectors.joining(", "));
        List<Object> values = new ArrayList<>();
        supplied.forEach(field -> values.add(body.get(field.key())));
        values.add(id);
        jdbc.update("UPDATE " + config.table() + " SET " + assignments
                + " WHERE " + config.idColumn() + " = ?", values.toArray());
        return Map.of("id", id);
    }

    @DeleteMapping("/admin/{resource}/{id}")
    @Transactional
    public Map<String, String> adminDelete(@PathVariable String resource, @PathVariable long id) {
        Resource config = resource(resource);
        int changed = jdbc.update("DELETE FROM " + config.table() + " WHERE " + config.idColumn() + " = ?", id);
        if (changed == 0) throw ApiException.notFound("Không tìm thấy bản ghi");
        return Map.of("message", "Đã xóa bản ghi");
    }

    private Resource resource(String name) {
        return switch (name) {
            case "sports-centers" -> new Resource("SportsCenters", "CenterID", List.of(
                    new Field("name", "Name", true), new Field("address", "Address", true),
                    new Field("phone", "Phone", false), new Field("email", "Email", false),
                    new Field("openTime", "OpenTime", false), new Field("closeTime", "CloseTime", false),
                    new Field("rating", "Rating", false), new Field("totalReviews", "TotalReviews", false),
                    new Field("latitude", "Latitude", false), new Field("longitude", "Longitude", false)));
            case "services" -> new Resource("Services", "ServiceID", List.of(
                    new Field("name", "TenDV", true), new Field("price", "DonGia", true),
                    new Field("unit", "DonViTinh", true), new Field("status", "TrangThai", false)));
            case "promotions" -> new Resource("Promotions", "PromotionID", List.of(
                    new Field("name", "TenKM", true), new Field("discountPercent", "PhanTramGiam", true),
                    new Field("startDate", "NgayBatDau", true), new Field("endDate", "NgayKetThuc", true),
                    new Field("status", "TrangThai", false)));
            case "staff" -> new Resource("Staff", "StaffID", List.of(
                    new Field("fullName", "FullName", true), new Field("phone", "Phone", true),
                    new Field("email", "Email", false), new Field("position", "ChucVu", true),
                    new Field("status", "TrangThai", false)));
            case "sports" -> new Resource("Sports", "SportID", List.of(new Field("name", "SportName", true)));
            case "pitch-categories" -> new Resource("PitchCategories", "CategoryID", List.of(
                    new Field("centerId", "CenterID", true), new Field("sportId", "SportID", true),
                    new Field("name", "CategoryName", true), new Field("playerCount", "PlayerCount", true)));
            case "subfields" -> new Resource("SubFields", "SubFieldID", List.of(
                    new Field("centerId", "CenterID", true), new Field("sportId", "SportID", true),
                    new Field("categoryId", "CategoryID", false),
                    new Field("name", "SubFieldName", true), new Field("description", "Description", false),
                    new Field("giaGio", "GiaGio", true), new Field("giaGioCaoDiem", "GiaGioCaoDiem", true),
                    new Field("status", "Status", false)));
            case "pricing-rules" -> new Resource("PricingRules", "PricingID", List.of(
                    new Field("sportId", "SportID", true), new Field("startTime", "StartTime", true),
                    new Field("endTime", "EndTime", true), new Field("weekend", "IsWeekend", false),
                    new Field("pricePerHour", "PricePerHour", true)));
            case "teams" -> new Resource("Teams", "TeamID", List.of(
                    new Field("name", "TeamName", true), new Field("homeGround", "HomeGround", false),
                    new Field("logoUrl", "LogoUrl", false), new Field("foundedYear", "FoundedYear", false)));
            case "players" -> new Resource("Players", "PlayerID", List.of(
                    new Field("fullName", "FullName", true), new Field("birthDate", "BirthDate", false),
                    new Field("position", "Position", false), new Field("shirtNumber", "ShirtNumber", false),
                    new Field("height", "Height", false), new Field("teamId", "TeamID", false),
                    new Field("status", "Status", false)));
            case "tournaments" -> new Resource("Tournaments", "TournamentID", List.of(
                    new Field("name", "TournamentName", true), new Field("season", "Season", false),
                    new Field("status", "Status", false), new Field("startDate", "StartDate", false),
                    new Field("endDate", "EndDate", false)));
            case "groups" -> new Resource("TournamentGroups", "GroupID", List.of(
                    new Field("tournamentId", "TournamentID", true), new Field("name", "GroupName", true)));
            case "matches" -> new Resource("Matches", "MatchID", List.of(
                    new Field("tournamentId", "TournamentID", true), new Field("homeTeamId", "HomeTeamID", true),
                    new Field("awayTeamId", "AwayTeamID", true), new Field("subFieldId", "SubFieldID", false),
                    new Field("matchTime", "MatchTime", true), new Field("homeScore", "HomeScore", false),
                    new Field("awayScore", "AwayScore", false), new Field("status", "MatchStatus", false)));
            case "player-stats" -> new Resource("PlayerMatchStats", "StatID", List.of(
                    new Field("playerId", "PlayerID", true), new Field("matchId", "MatchID", true),
                    new Field("goals", "Goals", false), new Field("assists", "Assists", false),
                    new Field("yellowCards", "YellowCards", false), new Field("redCards", "RedCards", false),
                    new Field("rating", "RatingScore", false)));
            case "standings" -> new Resource("Standings", "StandingID", List.of(
                    new Field("tournamentId", "TournamentID", true), new Field("groupId", "GroupID", false),
                    new Field("teamId", "TeamID", true), new Field("matchesPlayed", "MatchesPlayed", false),
                    new Field("wins", "Wins", false), new Field("draws", "Draws", false),
                    new Field("losses", "Losses", false), new Field("goalsFor", "GoalsFor", false),
                    new Field("goalsAgainst", "GoalsAgainst", false), new Field("points", "Points", false)));
            default -> throw ApiException.notFound("Không hỗ trợ quản lý bảng dữ liệu này");
        };
    }

    private List<Field> suppliedFields(Resource config, Map<String, Object> body, boolean creating) {
        Set<String> allowed = config.fields().stream().map(Field::key).collect(Collectors.toSet());
        for (String key : body.keySet()) {
            if (!allowed.contains(key)) throw ApiException.badRequest("Trường không được hỗ trợ: " + key);
        }
        if (creating) {
            for (Field field : config.fields()) {
                if (field.required() && (!body.containsKey(field.key()) || body.get(field.key()) == null
                        || body.get(field.key()) instanceof String value && value.isBlank()))
                    throw ApiException.badRequest("Thiếu trường bắt buộc: " + field.key());
            }
        }
        return config.fields().stream().filter(field -> body.containsKey(field.key())).toList();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Map<String, Object> pitchResponse(Map<String, Object> row) {
        String sportName = Objects.toString(row.get("sportName"), "");
        String fieldName = Objects.toString(row.get("ten"), "");
        Object categoryPlayerCount = row.get("playerCount");
        int players = categoryPlayerCount instanceof Number count ? count.intValue()
                : sportName.equals("Bóng đá") || sportName.equals("Bóng đá futsal")
                ? fieldName.matches(".*11.*") ? 11 : fieldName.matches(".*7.*") ? 7 : 5
                : 0;
        Map<String, Object> pitch = new LinkedHashMap<>();
        pitch.put("id", row.get("id"));
        pitch.put("centerId", row.get("centerId"));
        pitch.put("centerName", row.get("centerName"));
        pitch.put("categoryId", row.get("categoryId"));
        pitch.put("categoryName", row.get("categoryName"));
        pitch.put("ten", fieldName);
        pitch.put("sportId", row.get("sportId"));
        pitch.put("sportName", sportName);
        pitch.put("soNguoi", players);
        pitch.put("diaChi", row.get("diaChi"));
        pitch.put("moTa", row.get("moTa"));
        pitch.put("hinhAnh", null);
        pitch.put("tienIch", List.of());
        pitch.put("giaGio", ((BigDecimal) row.get("giaGio")).longValue());
        pitch.put("giaGioCaoDiem", ((BigDecimal) row.get("giaGioCaoDiem")).longValue());
        pitch.put("gioMo", row.get("gioMo"));
        pitch.put("gioDong", row.get("gioDong"));
        pitch.put("trangThai", "Active".equals(row.get("status")) ? "HOAT_DONG" : "BAO_TRI");
        return pitch;
    }

    private boolean isBooked(int subFieldId, LocalDate date, LocalTime start, LocalTime end) {
        Integer bookingCount = jdbc.queryForObject("""
                SELECT COUNT(*) FROM Bookings
                WHERE SubFieldID = ? AND BookingDate = ? AND BookingStatus <> 'Cancelled'
                  AND StartTime < ? AND EndTime > ?
                """, Integer.class, subFieldId, date, end, start);
        Integer bookedSlots = jdbc.queryForObject("""
                SELECT COUNT(*) FROM FieldTimeSlots
                WHERE SubFieldID = ? AND BookingDate = ? AND IsBooked = TRUE
                  AND StartTime < ? AND EndTime > ?
                """, Integer.class, subFieldId, date, end, start);
        return Objects.requireNonNull(bookingCount) > 0 || Objects.requireNonNull(bookedSlots) > 0;
    }

    private BigDecimal fieldPrice(Map<String, Object> field, LocalDate date,
                                  LocalTime start, LocalTime end) {
        BigDecimal total = BigDecimal.ZERO;
        int sportId = ((Number) field.get("sportId")).intValue();
        for (LocalTime cursor = start; cursor.isBefore(end); cursor = cursor.plusMinutes(30)) {
            LocalTime slotEnd = cursor.plusMinutes(30);
            total = total.add(hourlyPrice(field, sportId, date, cursor, slotEnd)
                    .divide(BigDecimal.valueOf(2)));
        }
        return total;
    }

    private BigDecimal hourlyPrice(Map<String, Object> field, LocalDate date,
                                   LocalTime start, LocalTime end) {
        return hourlyPrice(field, ((Number) field.get("sportId")).intValue(), date, start, end);
    }

    private BigDecimal hourlyPrice(Map<String, Object> field, int sportId, LocalDate date,
                                   LocalTime start, LocalTime end) {
        boolean weekend = date.getDayOfWeek() == DayOfWeek.SATURDAY
                || date.getDayOfWeek() == DayOfWeek.SUNDAY;
        List<BigDecimal> prices = jdbc.queryForList("""
                SELECT PricePerHour FROM PricingRules
                WHERE SportID = ? AND IsWeekend = ?
                  AND StartTime <= ? AND EndTime >= ?
                ORDER BY PricingID DESC LIMIT 1
                """, BigDecimal.class, sportId, weekend, start, end);
        if (!prices.isEmpty()) return prices.get(0);
        BigDecimal fallback = start.getHour() >= 17
                ? (BigDecimal) field.get("giaGioCaoDiem")
                : (BigDecimal) field.get("giaGio");
        return fallback;
    }

    private LocalTime toLocalTime(Object value) {
        if (value instanceof LocalTime time) return time;
        if (value instanceof java.sql.Time time) return time.toLocalTime();
        if (value instanceof String time) return LocalTime.parse(time);
        throw new IllegalStateException("Unexpected SQL TIME value: " + value);
    }

    private long count(String table) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
    }
}
