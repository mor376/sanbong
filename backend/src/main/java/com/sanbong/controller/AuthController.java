package com.sanbong.controller;

import static com.sanbong.dto.Dtos.*;

import com.sanbong.entity.NguoiDung;
import com.sanbong.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) { this.service = service; }

    @PostMapping("/dang-ky")
    public ResponseEntity<AuthResponse> dangKy(@Valid @RequestBody DangKyRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.dangKy(r));
    }

    @PostMapping("/dang-nhap")
    public AuthResponse dangNhap(@Valid @RequestBody DangNhapRequest r) { return service.dangNhap(r); }

    @GetMapping("/me")
    public NguoiDungDto me(@AuthenticationPrincipal NguoiDung user) { return NguoiDungDto.of(user); }

    @PutMapping("/me")
    public NguoiDungDto capNhatHoSo(@AuthenticationPrincipal NguoiDung user, @Valid @RequestBody CapNhatHoSoRequest r) {
        return service.capNhatHoSo(user, r);
    }

    @PutMapping("/doi-mat-khau")
    public Map<String, String> doiMatKhau(@AuthenticationPrincipal NguoiDung user, @Valid @RequestBody DoiMatKhauRequest r) {
        service.doiMatKhau(user, r);
        return Map.of("message", "Đổi mật khẩu thành công");
    }
}
