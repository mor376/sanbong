package com.sanbong.dto;

import com.sanbong.entity.NguoiDung;
import com.sanbong.entity.TrangThaiYeuCauChuSan;
import com.sanbong.entity.VaiTro;
import com.sanbong.entity.YeuCauChuSan;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/** Gom toàn bộ request/response vào một file cho gọn. */
public final class Dtos {
    private Dtos() {}

    // ---------- Auth ----------
    public record DangKyRequest(
            @NotBlank(message = "Tên đăng nhập không được để trống") @Size(min = 3, max = 50, message = "Tên đăng nhập từ 3-50 ký tự") String username,
            @NotBlank(message = "Mật khẩu không được để trống") @Size(min = 6, message = "Mật khẩu tối thiểu 6 ký tự") String password,
            @NotBlank(message = "Họ tên không được để trống") String hoTen,
            @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,
            @Pattern(regexp = "^$|^[0-9+ ]{9,15}$", message = "Số điện thoại không hợp lệ") String soDienThoai) {}

    public record DangNhapRequest(
            @NotBlank(message = "Vui lòng nhập tên đăng nhập hoặc email") String login,
            @NotBlank(message = "Vui lòng nhập mật khẩu") String password) {}

    public record NguoiDungDto(Long id, String username, String hoTen, String email, String soDienThoai,
                               VaiTro vaiTro, boolean status, LocalDateTime createdAt) {
        public static NguoiDungDto of(NguoiDung u) {
            return new NguoiDungDto(u.getId(), u.getUsername(), u.getHoTen(), u.getEmail(),
                    u.getSoDienThoai(), u.getVaiTro(), u.isStatus(), u.getCreatedAt());
        }
    }

    public record AuthResponse(String message, NguoiDungDto user, String token) {}

    public record YeuCauChuSanRequest(
            @NotBlank @Size(max = 100) String hoTen,
            @NotBlank @Pattern(regexp = "^[0-9+ ]{9,15}$", message = "Số điện thoại không hợp lệ") String soDienThoai,
            @Email @Size(max = 150) String email,
            @NotBlank @Size(max = 150) String tenSan,
            @NotBlank @Size(max = 500) String diaChiSan,
            @Size(max = 1000) String ghiChu) {}

    public record YeuCauChuSanDto(Long id, String hoTen, String soDienThoai, String email,
                                  String tenSan, String diaChiSan, String ghiChu,
                                  TrangThaiYeuCauChuSan trangThai, LocalDateTime createdAt) {
        public static YeuCauChuSanDto of(YeuCauChuSan item) {
            return new YeuCauChuSanDto(item.getId(), item.getHoTen(), item.getSoDienThoai(),
                    item.getEmail(), item.getTenSan(), item.getDiaChiSan(), item.getGhiChu(),
                    item.getTrangThai(), item.getCreatedAt());
        }
    }

    public record TrangThaiYeuCauRequest(@NotNull TrangThaiYeuCauChuSan trangThai) {}

    // ---------- Tài khoản ----------
    public record CapNhatHoSoRequest(
            @NotBlank(message = "Họ tên không được để trống") String hoTen,
            @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,
            @Pattern(regexp = "^$|^[0-9+ ]{9,15}$", message = "Số điện thoại không hợp lệ") String soDienThoai) {}

    public record DoiMatKhauRequest(
            @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại") String matKhauCu,
            @NotBlank(message = "Vui lòng nhập mật khẩu mới") @Size(min = 6, message = "Mật khẩu mới tối thiểu 6 ký tự") String matKhauMoi) {}

    public record DoiMatKhauTaiKhoanRequest(
            String matKhauCu,
            @NotBlank(message = "Vui lòng nhập mật khẩu mới") @Size(min = 6, message = "Mật khẩu mới tối thiểu 6 ký tự") String matKhauMoi) {}

    /** status = true: mở khoá, false: khoá tài khoản. */
    public record TrangThaiTaiKhoanRequest(@NotNull(message = "Thiếu trạng thái tài khoản") Boolean status) {}

    // ---------- Phân trang ----------
    public record TrangDto<T>(List<T> noiDung, int trang, int kichThuoc, long tongPhanTu, int tongTrang) {
        public static <E, T> TrangDto<T> of(Page<E> p, Function<E, T> map) {
            return new TrangDto<>(p.getContent().stream().map(map).toList(), p.getNumber(), p.getSize(),
                    p.getTotalElements(), p.getTotalPages());
        }

        /** trang bắt đầu từ 0; kích thước bị chặn trong khoảng 1..100. */
        public static Pageable pageable(int trang, int kichThuoc, Sort sort) {
            return PageRequest.of(Math.max(trang, 0), Math.min(Math.max(kichThuoc, 1), 100), sort);
        }
    }
}
