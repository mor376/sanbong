package com.sanbong.exception;

import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Mọi lỗi đều trả về dạng JSON {"message": "..."} để frontend xử lý thống nhất. */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static ResponseEntity<Map<String, Object>> loi(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<Map<String, Object>> api(ApiException e) {
        return loi(e.getStatus(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> errors.putIfAbsent(f.getField(), f.getDefaultMessage()));
        String first = errors.values().stream().findFirst().orElse("Dữ liệu không hợp lệ");
        return ResponseEntity.badRequest().body(Map.of("message", first, "errors", errors));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> badInput(Exception e) {
        return loi(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> thieuThamSo(MissingServletRequestParameterException e) {
        return loi(HttpStatus.BAD_REQUEST, "Thiếu tham số bắt buộc: " + e.getParameterName());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> saiPhuongThuc(HttpRequestMethodNotSupportedException e) {
        return loi(HttpStatus.METHOD_NOT_ALLOWED, "Phương thức " + e.getMethod() + " không được hỗ trợ cho đường dẫn này");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, Object>> saiContentType(HttpMediaTypeNotSupportedException e) {
        return loi(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Content-Type phải là application/json");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> khongTimThay(NoResourceFoundException e) {
        return loi(HttpStatus.NOT_FOUND, "Không tìm thấy đường dẫn này");
    }

    /** Vi phạm ràng buộc DB (vd trùng username/email khi hai request đến cùng lúc). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> raRangBuoc(DataIntegrityViolationException e) {
        log.warn("Vi phạm ràng buộc dữ liệu", e);
        return loi(HttpStatus.CONFLICT, "Dữ liệu bị trùng hoặc không hợp lệ");
    }

    /** Để Spring Security tự trả 403 theo accessDeniedHandler trong SecurityConfig. */
    @ExceptionHandler(AccessDeniedException.class)
    public void tuChoi(AccessDeniedException e) { throw e; }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> khac(Exception e) {
        log.error("Lỗi không xác định", e);
        return loi(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi xảy ra phía máy chủ, vui lòng thử lại sau");
    }
}
