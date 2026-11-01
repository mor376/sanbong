package com.sanbong.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Users")
public class NguoiDung {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "UserID")
    private Long id;
    @Column(name = "Username", nullable = false, unique = true, length = 100)
    private String username;
    @Column(name = "PasswordHash", nullable = false)
    private String password;
    @Column(name = "FullName", nullable = false)
    private String hoTen;
    @Column(name = "Email", nullable = false, unique = true)
    private String email;
    @Column(name = "Phone", length = 20)
    private String soDienThoai;
    @Enumerated(EnumType.STRING)
    @Column(name = "Role", nullable = false, length = 20)
    private VaiTro vaiTro = VaiTro.MEMBER;
    @Column(name = "Status", nullable = false)
    private boolean status = true;
    @Column(name = "CreatedAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String v) { this.username = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { this.password = v; }
    public String getHoTen() { return hoTen; }
    public void setHoTen(String v) { this.hoTen = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getSoDienThoai() { return soDienThoai; }
    public void setSoDienThoai(String v) { this.soDienThoai = v; }
    public VaiTro getVaiTro() { return vaiTro; }
    public void setVaiTro(VaiTro v) { this.vaiTro = v; }
    public boolean isStatus() { return status; }
    public void setStatus(boolean v) { this.status = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
