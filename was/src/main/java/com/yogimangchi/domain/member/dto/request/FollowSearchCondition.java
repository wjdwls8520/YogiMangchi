package com.yogimangchi.domain.member.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "팔로우 멤버 목록 검색 조건 / 무한 스크롤")
public record FollowSearchCondition(

        @Schema(description = "첫 요청은 비워두고, 다음 요청부터는 이전 응답의 nextCursorId 값을 넣어주세요.", example = "120", nullable = true)
        Long cursorId,

        @Schema(description = "닉네임 검색어입니다. 검색어를 바꿔서 다시 조회할 때는 cursorId 를 비워주세요. ( 검색버튼을 눌렀을때 마다 초기화해주면 깔끔할 것 같음 )", example = "홍길동", nullable = true)
        String keyword,

        @Schema(description = "한 번에 가져올 개수입니다. 비우면 기본값 10으로 조회되고, 최대 10까지만 적용됩니다.", example = "10", defaultValue = "10", maximum = "10")
        Integer size
) {
    @Schema(hidden = true)
    public Integer getOrDefaultSize() {
        return size == null || size <= 0 ? 10 : Math.min(size, 10);
    }
}
