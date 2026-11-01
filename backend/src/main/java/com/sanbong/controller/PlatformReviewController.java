package com.sanbong.controller;

import com.sanbong.entity.NguoiDung;
import com.sanbong.exception.ApiException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/platform/reviews")
public class PlatformReviewController {
    public record ReviewRequest(
            @NotNull Integer sanId,
            @Min(1) @Max(5) int diem,
            @NotBlank @Size(min = 3, max = 1000) String noiDung) {}

    private final JdbcTemplate jdbc;

    public PlatformReviewController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(name = "sanId", required = false) Integer subFieldId) {
        String query = """
                SELECT r.ReviewID AS id, r.SubFieldID AS sanId,
                       CASE WHEN pc.CategoryID IS NULL THEN sf.SubFieldName
                            ELSE CONCAT(pc.CategoryName, ' · ', sf.SubFieldName) END AS tenSan,
                       u.FullName AS tenNguoiDung, r.Rating AS diem, r.Comment AS noiDung,
                       r.CreatedAt AS createdAt
                FROM SubFieldReviews r
                JOIN SubFields sf ON sf.SubFieldID = r.SubFieldID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                JOIN Users u ON u.UserID = r.UserID
                """;
        if (subFieldId == null) return jdbc.queryForList(query + " ORDER BY r.CreatedAt DESC");
        return jdbc.queryForList(query + " WHERE r.SubFieldID = ? ORDER BY r.CreatedAt DESC", subFieldId);
    }

    @GetMapping("/mine")
    public Map<String, Object> mine(@AuthenticationPrincipal NguoiDung user,
                                    @RequestParam("sanId") int subFieldId) {
        List<Map<String, Object>> items = jdbc.queryForList("""
                SELECT r.ReviewID AS id, r.SubFieldID AS sanId,
                       CASE WHEN pc.CategoryID IS NULL THEN sf.SubFieldName
                            ELSE CONCAT(pc.CategoryName, ' · ', sf.SubFieldName) END AS tenSan,
                       u.FullName AS tenNguoiDung, r.Rating AS diem, r.Comment AS noiDung,
                       r.CreatedAt AS createdAt
                FROM SubFieldReviews r
                JOIN SubFields sf ON sf.SubFieldID = r.SubFieldID
                LEFT JOIN PitchCategories pc ON pc.CategoryID = sf.CategoryID
                JOIN Users u ON u.UserID = r.UserID
                WHERE r.UserID = ? AND r.SubFieldID = ?
                """, user.getId(), subFieldId);
        return items.isEmpty() ? null : items.get(0);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> create(@AuthenticationPrincipal NguoiDung user,
                                      @Valid @RequestBody ReviewRequest request) {
        Integer fieldCount = jdbc.queryForObject("SELECT COUNT(*) FROM SubFields WHERE SubFieldID = ?",
                Integer.class, request.sanId());
        if (Objects.requireNonNull(fieldCount) == 0) throw ApiException.notFound("Không tìm thấy sân");
        Integer reviewCount = jdbc.queryForObject("""
                SELECT COUNT(*) FROM SubFieldReviews WHERE UserID = ? AND SubFieldID = ?
                """, Integer.class, user.getId(), request.sanId());
        if (Objects.requireNonNull(reviewCount) > 0)
            throw ApiException.conflict("Bạn đã đánh giá sân này. Hãy cập nhật đánh giá hiện có.");
        jdbc.update("""
                INSERT INTO SubFieldReviews (UserID, SubFieldID, Rating, Comment)
                VALUES (?, ?, ?, ?)
                """, user.getId(), request.sanId(), request.diem(), request.noiDung().trim());
        updateCenterRating(request.sanId());
        return mine(user, request.sanId());
    }

    @PutMapping("/{id}")
    @Transactional
    public Map<String, Object> update(@AuthenticationPrincipal NguoiDung user,
                                      @PathVariable int id,
                                      @Valid @RequestBody ReviewRequest request) {
        int changed = jdbc.update("""
                UPDATE SubFieldReviews
                SET Rating = ?, Comment = ?
                WHERE ReviewID = ? AND UserID = ? AND SubFieldID = ?
                """, request.diem(), request.noiDung().trim(), id, user.getId(), request.sanId());
        if (changed == 0) throw ApiException.notFound("Không tìm thấy đánh giá của bạn");
        updateCenterRating(request.sanId());
        return mine(user, request.sanId());
    }

    private void updateCenterRating(int subFieldId) {
        jdbc.update("""
                UPDATE SportsCenters sc
                SET TotalReviews = (
                    SELECT COUNT(*) FROM SubFieldReviews r
                    JOIN SubFields sf ON sf.SubFieldID = r.SubFieldID
                    WHERE sf.CenterID = sc.CenterID
                ),
                Rating = COALESCE((
                    SELECT ROUND(AVG(r.Rating), 1) FROM SubFieldReviews r
                    JOIN SubFields sf ON sf.SubFieldID = r.SubFieldID
                    WHERE sf.CenterID = sc.CenterID
                ), 0)
                WHERE sc.CenterID = (SELECT CenterID FROM SubFields WHERE SubFieldID = ?)
                """, subFieldId);
    }
}
