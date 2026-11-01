package com.sanbong.controller;

import com.sanbong.dto.Dtos.TrangThaiYeuCauRequest;
import com.sanbong.dto.Dtos.YeuCauChuSanDto;

import com.sanbong.service.YeuCauChuSanService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminNoiDungController {
    private final YeuCauChuSanService yeuCauChuSanService;

    public AdminNoiDungController(YeuCauChuSanService yeuCauChuSanService) {
        this.yeuCauChuSanService = yeuCauChuSanService;
    }

    @GetMapping("/yeu-cau-chu-san")
    public List<YeuCauChuSanDto> yeuCauChuSan() { return yeuCauChuSanService.danhSach(); }

    @PutMapping("/yeu-cau-chu-san/{id}/trang-thai")
    public YeuCauChuSanDto capNhatYeuCau(@PathVariable("id") @NonNull Long id,
                                         @Valid @RequestBody TrangThaiYeuCauRequest request) {
        return yeuCauChuSanService.capNhatTrangThai(id, request.trangThai());
    }
}
