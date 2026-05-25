package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.request.AdminReplySearchDto;
import com.yogimangchi.domain.community.dto.response.AdminReplyResponseDto;
import java.util.List;

public interface ReplyRepositoryCustom {
    List<AdminReplyResponseDto> findRepliesByCursor(AdminReplySearchDto searchDto, String authorStatus);
}
