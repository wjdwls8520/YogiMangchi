package com.yogimangchi.domain.member.dto;

import lombok.Getter;

@Getter
public class MemberRequestDto {

    // 1. 내 프로필 수정 요청용 DTO
    public record userProfileInfo(
            Long MemberId
    ) {}

}
