package com.sanbong.controller;

import static com.sanbong.dto.Dtos.DoiMatKhauTaiKhoanRequest;
import static com.sanbong.dto.Dtos.NguoiDungDto;
import static com.sanbong.dto.Dtos.TrangDto;
import static com.sanbong.dto.Dtos.TrangThaiTaiKhoanRequest;

import com.sanbong.entity.NguoiDung;
import com.sanbong.service.NguoiDungService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final NguoiDungService nguoiDungService;

    public AdminController(NguoiDungService nguoiDungService) {
        this.nguoiDungService = nguoiDungService;
    }

    @GetMapping("/nguoi-dung")
    public TrangDto<NguoiDungDto> nguoiDung(@RequestParam(name = "q", defaultValue = "") String q,
                                            @RequestParam(name = "trang", defaultValue = "0") int trang,
                                            @RequestParam(name = "kichThuoc", defaultValue = "20") int kichThuoc) {
        return nguoiDungService.tim(q, trang, kichThuoc);
    }

    @PutMapping("/nguoi-dung/{id}/trang-thai")
    public NguoiDungDto doiTrangThaiTaiKhoan(@AuthenticationPrincipal NguoiDung admin,
                                             @PathVariable("id") Long id,
                                             @Valid @RequestBody TrangThaiTaiKhoanRequest request) {
        return nguoiDungService.doiTrangThai(admin, id, request.status());
    }

    @PutMapping("/nguoi-dung/{id}/doi-mat-khau")
    public Map<String, String> doiMatKhauNguoiDung(@AuthenticationPrincipal NguoiDung admin,
                                                   @PathVariable("id") Long id,
                                                   @Valid @RequestBody DoiMatKhauTaiKhoanRequest request) {
        nguoiDungService.doiMatKhau(admin, id, request.matKhauCu(), request.matKhauMoi());
        return Map.of("message", "Đổi mật khẩu tài khoản thành công");
    }
}
