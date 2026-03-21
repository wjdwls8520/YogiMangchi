package com.yogimangchi.domain.member.controller.v1;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/member")
@Tag(name = "Auth", description = "인증 및 회원가입 관련 API") // 도메인 구분
public class memberController {
}
