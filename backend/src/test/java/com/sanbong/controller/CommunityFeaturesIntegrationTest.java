package com.sanbong.controller;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sanbong.entity.NguoiDung;
import com.sanbong.repository.NguoiDungRepository;
import com.sanbong.repository.YeuCauChuSanRepository;
import com.sanbong.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@Transactional
class CommunityFeaturesIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private YeuCauChuSanRepository applications;
    @Autowired private NguoiDungRepository users;
    @Autowired private JwtService jwtService;

    @Test
    void ownerApplicationIsPersistedAndVisibleOnlyToAdmins() throws Exception {
        long before = applications.count();
        mockMvc.perform(post("/api/yeu-cau-chu-san")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hoTen": "Nguyen Van A",
                                  "soDienThoai": "0912345678",
                                  "email": null,
                                  "tenSan": "San bong Test",
                                  "diaChiSan": "Quan 1, TP HCM",
                                  "ghiChu": "Lien he buoi chieu"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai", is("MOI")));
        org.junit.jupiter.api.Assertions.assertEquals(before + 1, applications.count());
        mockMvc.perform(get("/api/admin/yeu-cau-chu-san"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void legacyTournamentApiIsRemoved() throws Exception {
        NguoiDung user = new NguoiDung();
        user.setUsername("legacy-api-test");
        user.setPassword("not-used-by-token-test");
        user.setHoTen("Test User");
        user.setEmail("legacy-api-test@example.test");
        users.saveAndFlush(user);

        mockMvc.perform(get("/api/giai-dau")
                        .header("Authorization", "Bearer " + jwtService.generate(user.getUsername())))
                .andExpect(status().isNotFound());
    }
}
