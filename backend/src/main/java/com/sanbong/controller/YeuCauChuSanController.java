package com.sanbong.controller;

import static com.sanbong.dto.Dtos.YeuCauChuSanDto;
import static com.sanbong.dto.Dtos.YeuCauChuSanRequest;

import com.sanbong.service.YeuCauChuSanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/yeu-cau-chu-san")
public class YeuCauChuSanController {
    private final YeuCauChuSanService service;

    public YeuCauChuSanController(YeuCauChuSanService service) { this.service = service; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public YeuCauChuSanDto tao(@Valid @RequestBody YeuCauChuSanRequest request) {
        return service.tao(request);
    }
}
