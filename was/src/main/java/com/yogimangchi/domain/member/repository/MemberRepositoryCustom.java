package com.yogimangchi.domain.member.repository;

import com.yogimangchi.domain.member.dto.request.AdminMemberSearchDto;
import com.yogimangchi.domain.member.dto.response.AdminMemberResponseDto;
import java.util.List;

public interface MemberRepositoryCustom {
    List<AdminMemberResponseDto> findMembersByCursor(AdminMemberSearchDto searchDto);
}
