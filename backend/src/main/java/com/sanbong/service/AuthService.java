package com.sanbong.service;

import static com.sanbong.dto.Dtos.*;

import com.sanbong.entity.NguoiDung;
import com.sanbong.entity.VaiTro;
import com.sanbong.exception.ApiException;
import com.sanbong.repository.NguoiDungRepository;
import com.sanbong.security.JwtService;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final NguoiDungRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(NguoiDungRepository repo, PasswordEncoder encoder, JwtService jwt) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public AuthResponse dangKy(DangKyRequest r) {
        if (repo.existsByUsername(r.username().trim()))
            throw ApiException.conflict("Tên đăng nhập đã tồn tại");
        if (repo.existsByEmail(r.email().trim().toLowerCase()))
            throw ApiException.conflict("Email đã được sử dụng");
        NguoiDung u = new NguoiDung();
        u.setUsername(r.username().trim());
        u.setPassword(encoder.encode(r.password()));
        u.setHoTen(r.hoTen().trim());
        u.setEmail(r.email().trim().toLowerCase());
        u.setSoDienThoai(r.soDienThoai());
        u.setVaiTro(VaiTro.MEMBER);
        repo.save(u);
        return new AuthResponse("Đăng ký thành công", NguoiDungDto.of(u), jwt.generate(u.getUsername()));
    }

    public AuthResponse dangNhap(DangNhapRequest r) {
        String login = r.login().trim();
        NguoiDung u = repo.timBangTenDangNhapHoacEmail(login).orElse(null);
        if (u == null || !u.isStatus() || !encoder.matches(r.password(), u.getPassword()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Thông tin đăng nhập không đúng");
        return new AuthResponse("Đăng nhập thành công", NguoiDungDto.of(u), jwt.generate(u.getUsername()));
    }

    /** Người dùng tự cập nhật hồ sơ (họ tên, email, SĐT). */
    @Transactional
    public NguoiDungDto capNhatHoSo(NguoiDung hienTai, CapNhatHoSoRequest r) {
        NguoiDung u = repo.findById(Objects.requireNonNull(hienTai.getId()))
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản"));
        String email = r.email().trim().toLowerCase();
        if (repo.existsByEmailAndIdNot(email, u.getId()))
            throw ApiException.conflict("Email đã được sử dụng");
        u.setHoTen(r.hoTen().trim());
        u.setEmail(email);
        u.setSoDienThoai(r.soDienThoai());
        return NguoiDungDto.of(u);
    }

    @Transactional
    public void doiMatKhau(NguoiDung hienTai, DoiMatKhauRequest r) {
        NguoiDung u = repo.findById(Objects.requireNonNull(hienTai.getId()))
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy tài khoản"));
        if (!encoder.matches(r.matKhauCu(), u.getPassword()))
            throw ApiException.badRequest("Mật khẩu hiện tại không đúng");
        if (r.matKhauCu().equals(r.matKhauMoi()))
            throw ApiException.badRequest("Mật khẩu mới phải khác mật khẩu hiện tại");
        u.setPassword(encoder.encode(r.matKhauMoi()));
    }
}
