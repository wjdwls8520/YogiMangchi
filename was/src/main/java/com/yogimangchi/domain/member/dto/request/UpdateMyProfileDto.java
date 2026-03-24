package com.yogimangchi.domain.member.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class UpdateMyProfileDto {
        @Schema(description = "변경할 닉네임", example = "홍길동")
        private String nickname;

        @Schema(description = "변경할 프로필 이미지 파일", type = "string", format = "binary")
        private MultipartFile profileImage;

        @Schema(description = "변경할 프로필 메시지", example = "안녕하세요!")
        private String profileMsg;
}
