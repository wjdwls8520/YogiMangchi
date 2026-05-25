package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.request.AdminPostSearchDto;
import com.yogimangchi.domain.community.dto.response.AdminPostResponseDto;
import java.util.List;

public interface PostRepositoryCustom {
    List<AdminPostResponseDto> findPostsByCursor(AdminPostSearchDto searchDto, String authorStatus);
}
