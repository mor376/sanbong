package com.sanbong.service;

import static com.sanbong.dto.Dtos.*;

import com.sanbong.entity.NguoiDung;
import com.sanbong.entity.VaiTro;
import com.sanbong.exception.ApiException;
import com.sanbong.repository.NguoiDungRepository;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Quản lý người dùng dành cho admin. */
@Service
public class NguoiDungService {
    private final NguoiDungRepository repo;
    private final PasswordEncoder encoder;

    public NguoiDungService(NguoiDungRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @Transactional(readOnly = true)
    public TrangDto<NguoiDungDto> tim(String q, int trang, int kichThuoc) {
        String key = q == null ? "" : q.trim();
        return TrangDto.of(repo.tim(key, TrangDto.pageable(trang, kichThuoc, Sort.by(Sort.Direction.DESC, "id"))),
                NguoiDungDto::of);
    }

    /** Khoá / mở khoá tài khoản. Tài khoản bị khoá sẽ không đăng nhập được và token cũ cũng hết tác dụng. */
    @Transactional
    public NguoiDungDto doiTrangThai(NguoiDung admin, Long id, boolean status) {
        NguoiDung u = repo.findById(id).orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng"));
        if (u.getId().equals(admin.getId()))
            throw ApiException.badRequest("Không thể tự khoá tài khoản của chính mình");
        if (u.getVaiTro() == VaiTro.ADMIN)
            throw ApiException.forbidden("Không thể khoá tài khoản quản trị viên khác");
        u.setStatus(status);
        return NguoiDungDto.of(u);
    }

    /** Admin đổi mật khẩu cho bất kỳ tài khoản nào (khách hàng hoặc thành viên).
     * Nếu đang đổi mật khẩu cho chính mình thì bắt buộc phải có mật khẩu hiện tại để xác thực.
     */
    @Transactional
    public void doiMatKhau(NguoiDung admin, Long userId, String matKhauCu, String matKhauMoi) {
        NguoiDung target = repo.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Không tìm thấy người dùng"));
        if (admin.getVaiTro() != VaiTro.ADMIN)
            throw ApiException.forbidden("Chỉ quản trị viên mới được đổi mật khẩu tài khoản khác");
        if (target.getVaiTro() == VaiTro.ADMIN && !target.getId().equals(admin.getId()))
            throw ApiException.forbidden("Không thể đổi mật khẩu tài khoản quản trị viên khác");
        if (matKhauMoi == null || matKhauMoi.isBlank() || matKhauMoi.length() < 6)
            throw ApiException.badRequest("Mật khẩu mới tối thiểu 6 ký tự");
        if (target.getId().equals(admin.getId())) {
            if (matKhauCu == null || matKhauCu.isBlank())
                throw ApiException.badRequest("Vui lòng nhập mật khẩu hiện tại");
            if (!encoder.matches(matKhauCu, target.getPassword()))
                throw ApiException.badRequest("Mật khẩu hiện tại không đúng");
        }
        if (encoder.matches(matKhauMoi, target.getPassword()))
            throw ApiException.badRequest("Mật khẩu mới phải khác mật khẩu hiện tại");
        target.setPassword(encoder.encode(matKhauMoi));
    }
}
