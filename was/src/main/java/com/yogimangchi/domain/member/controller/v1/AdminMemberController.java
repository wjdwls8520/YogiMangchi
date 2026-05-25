package com.yogimangchi.domain.member.controller.v1;

import com.yogimangchi.domain.member.dto.request.AdminMemberSearchDto;
import com.yogimangchi.domain.member.dto.response.AdminMemberResponseDto;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.member.service.MemberService;
import com.yogimangchi.global.dto.CursorResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/members")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "99 - ADMIN - Member", description = "관리자 - 회원 관리 API")
public class AdminMemberController {

    private final MemberRepository memberRepository;
    private final MemberService memberService;

    @Operation(
            summary = "어드민 회원 조회",
            description = "회원 상태(ALL, ACTIVE, WITHDRAWN) 및 다양한 검색 조건으로 전체 회원을 커서 기반 무한 스크롤로 조회합니다. N+1 없이 한 번의 쿼리로 OAuth 정보까지 함께 조회합니다."
    )
    @GetMapping
    public ResponseEntity<CursorResponseDto<AdminMemberResponseDto>> getMembers(
            @Valid @ParameterObject @ModelAttribute AdminMemberSearchDto searchDto
    ) {
        int limitSize = searchDto.getOrDefaultSize();
        List<AdminMemberResponseDto> members = memberRepository.findMembersByCursor(searchDto);

        boolean hasNext = members.size() > limitSize;
        if (hasNext) {
            members = new ArrayList<>(members.subList(0, limitSize));
        }

        Long nextCursorId = null;
        if (!members.isEmpty() && hasNext) {
            nextCursorId = members.get(members.size() - 1).memberId();
        }

        return ResponseEntity.ok(new CursorResponseDto<>(members, nextCursorId, hasNext));
    }

    @Operation(
            summary = "회원 강제 탈퇴",
            description = "관리자 권한으로 특정 회원을 탈퇴 처리합니다. 기존 탈퇴 비즈니스 로직(소셜 이관, 관계 해제 등)을 그대로 수행합니다."
    )
    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> withdrawMemberByAdmin(
            @Parameter(description = "강제 탈퇴시킬 회원 ID", example = "12")
            @PathVariable Long memberId
    ) {
        memberService.withdrawMember(memberId);
        return ResponseEntity.noContent().build();
    }
}
