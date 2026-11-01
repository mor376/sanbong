package com.sanbong.service;

import static com.sanbong.dto.Dtos.*;

import com.sanbong.entity.TrangThaiYeuCauChuSan;
import com.sanbong.entity.YeuCauChuSan;
import com.sanbong.exception.ApiException;
import com.sanbong.repository.YeuCauChuSanRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class YeuCauChuSanService {
    private final YeuCauChuSanRepository repository;

    public YeuCauChuSanService(YeuCauChuSanRepository repository) { this.repository = repository; }

    @Transactional
    public YeuCauChuSanDto tao(YeuCauChuSanRequest request) {
        YeuCauChuSan item = new YeuCauChuSan();
        item.setHoTen(request.hoTen().trim());
        item.setSoDienThoai(request.soDienThoai().trim());
        item.setEmail(blankToNull(request.email()));
        item.setTenSan(request.tenSan().trim());
        item.setDiaChiSan(request.diaChiSan().trim());
        item.setGhiChu(blankToNull(request.ghiChu()));
        return YeuCauChuSanDto.of(repository.save(item));
    }

    @Transactional(readOnly = true)
    public List<YeuCauChuSanDto> danhSach() {
        return repository.findAll(org.springframework.data.domain.Sort.by(
                org.springframework.data.domain.Sort.Direction.DESC, "createdAt"))
                .stream().map(YeuCauChuSanDto::of).toList();
    }

    @Transactional
    public YeuCauChuSanDto capNhatTrangThai(Long id, TrangThaiYeuCauChuSan status) {
        YeuCauChuSan item = repository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy yêu cầu chủ sân"));
        item.setTrangThai(status);
        return YeuCauChuSanDto.of(item);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
