package com.sanbong.config;

import com.sanbong.entity.NguoiDung;
import com.sanbong.entity.VaiTro;
import com.sanbong.repository.NguoiDungRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("!mysql")
public class DataSeeder implements CommandLineRunner {
    private final NguoiDungRepository users;
    private final PasswordEncoder encoder;

    public DataSeeder(NguoiDungRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureAccount("admin", "123456", "Quản trị viên", "admin@sanbong.vn",
                "0900000000", VaiTro.ADMIN);
        ensureAccount("trandat", "123456", "Trần Đạt", "trandat@sanbong.vn",
                "0912345678", VaiTro.MEMBER);
        ensureAccount("khachhang1", "123456", "Khách hàng 1", "khachhang1@sanbong.vn",
                "0911111111", VaiTro.MEMBER);
    }

    private void ensureAccount(String username, String password, String name, String email,
                              String phone, VaiTro role) {
        NguoiDung account = users.findByUsername(username).orElseGet(NguoiDung::new);
        account.setUsername(username);
        account.setPassword(encoder.encode(password));
        account.setHoTen(name);
        account.setEmail(email);
        account.setSoDienThoai(phone);
        account.setVaiTro(role);
        account.setStatus(true);
        users.save(account);
    }
}
