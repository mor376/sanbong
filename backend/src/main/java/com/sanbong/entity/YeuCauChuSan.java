package com.sanbong.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "yeu_cau_chu_san")
public class YeuCauChuSan {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 100)
    private String hoTen;
    @Column(nullable = false, length = 20)
    private String soDienThoai;
    @Column(length = 150)
    private String email;
    @Column(nullable = false, length = 150)
    private String tenSan;
    @Column(nullable = false, length = 500)
    private String diaChiSan;
    @Column(length = 1000)
    private String ghiChu;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TrangThaiYeuCauChuSan trangThai = TrangThaiYeuCauChuSan.MOI;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getHoTen() { return hoTen; }
    public void setHoTen(String value) { hoTen = value; }
    public String getSoDienThoai() { return soDienThoai; }
    public void setSoDienThoai(String value) { soDienThoai = value; }
    public String getEmail() { return email; }
    public void setEmail(String value) { email = value; }
    public String getTenSan() { return tenSan; }
    public void setTenSan(String value) { tenSan = value; }
    public String getDiaChiSan() { return diaChiSan; }
    public void setDiaChiSan(String value) { diaChiSan = value; }
    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String value) { ghiChu = value; }
    public TrangThaiYeuCauChuSan getTrangThai() { return trangThai; }
    public void setTrangThai(TrangThaiYeuCauChuSan value) { trangThai = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
