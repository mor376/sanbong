package com.sanbong.repository;

import com.sanbong.entity.NguoiDung;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {
    @Query("""
        select u from NguoiDung u
        where lower(u.username) = lower(:login) or lower(u.email) = lower(:login)
        """)
    Optional<NguoiDung> timBangTenDangNhapHoacEmail(@Param("login") String login);
    Optional<NguoiDung> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    /** Tìm theo username / họ tên / email (q rỗng = lấy tất cả). */
    @Query("""
        select u from NguoiDung u
        where lower(u.username) like lower(concat('%', :q, '%'))
           or lower(u.hoTen) like lower(concat('%', :q, '%'))
           or lower(u.email) like lower(concat('%', :q, '%'))
        """)
    Page<NguoiDung> tim(@Param("q") String q, Pageable pageable);
}
