package com.sanbong.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.sanbong.entity.NguoiDung;
import com.sanbong.entity.VaiTro;
import com.sanbong.repository.NguoiDungRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class NguoiDungServiceTest {
    private NguoiDungRepository repo;
    private PasswordEncoder encoder;
    private NguoiDungService service;

    @BeforeEach
    void setUp() {
        repo = mock(NguoiDungRepository.class);
        encoder = new BCryptPasswordEncoder();
        service = new NguoiDungService(repo, encoder);
    }

    @Test
    void doiMatKhau_shouldUpdatePasswordForCustomerAccount() {
        NguoiDung admin = new NguoiDung();
        ReflectionTestUtils.setField(admin, "id", 1L);
        admin.setVaiTro(VaiTro.ADMIN);

        NguoiDung customer = new NguoiDung();
        ReflectionTestUtils.setField(customer, "id", 10L);
        customer.setUsername("khach1");
        customer.setHoTen("Khách 1");
        customer.setEmail("khach1@example.com");
        customer.setVaiTro(VaiTro.MEMBER);
        customer.setPassword(encoder.encode("old-pass"));

        when(repo.findById(10L)).thenReturn(java.util.Optional.of(customer));

        service.doiMatKhau(admin, 10L, null, "new-pass-123");

        assertNotEquals("old-pass", customer.getPassword());
        assertTrue(encoder.matches("new-pass-123", customer.getPassword()));
    }
}
