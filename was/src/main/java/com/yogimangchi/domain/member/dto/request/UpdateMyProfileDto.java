package com.yogimangchi.domain.member.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import org.springframework.web.multipart.MultipartFile;

@Getter
public class UpdateMyProfileDto {
        @Schema(description = "변경할 닉네임", example = "홍길동")
        private final String nickname;

        @Schema(description = "변경할 프로필 이미지 파일", type = "string", format = "binary")
        private final MultipartFile profileImage;

        @Schema(description = "프로필 이미지 처리 타입. reset 이면 기본 이미지로 초기화합니다.", example = "reset")
        private final String type;

        @Schema(description = "변경할 프로필 메시지", example = "안녕하세요!")
        private final String profileMsg;

        private UpdateMyProfileDto(String nickname, MultipartFile profileImage, String type, String profileMsg) {
                this.nickname = nickname;
                this.profileImage = profileImage;
                this.type = type;
                this.profileMsg = profileMsg;
        }

        public static UpdateMyProfileDto of(String nickname, MultipartFile profileImage, String type, String profileMsg) {
                return new UpdateMyProfileDto(nickname, profileImage, type, profileMsg);
        }
}
