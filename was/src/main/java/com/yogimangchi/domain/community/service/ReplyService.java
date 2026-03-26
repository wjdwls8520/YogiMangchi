package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.request.ReplyCreateDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.enums.MemberRole;
import com.yogimangchi.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReplyService {

    private final ReplyRepository replyRepository;
    private final MemberRepository memberRepository;
    private final PostRepository postRepository;

    private static final int MAX_CONTENT_LENGTH = 1000;

    @Transactional
    public ReplyDetailDto createReply(Long memberId, Long postId, ReplyCreateDto request) {

        if(memberId == null) { throw new IllegalArgumentException("로그인 이후 이용할 수 있습니다."); };

        // ── 1. 입력값 정제 (앞뒤 공백 제거 + 빈 값 방어) ──
        String content = normalizeText(request.content(), "내용");

        // ── 2. 길이 제한 검증 ──
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("내용은 최대 1000자까지 입력 가능합니다.");
        }

        // ── 3. 작성자 조회 ──
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        // ── 4. 게시글 조회 ──
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        Reply reply;
        if(request.parentId() == null) {
            reply = Reply.create(content, member, post);
        } else {

            Reply replyParent = replyRepository.findById(request.parentId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글 입니다."));

            Reply replyTarget = replyRepository.findById(request.targetId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글 입니다."));

            if (!replyParent.getPost().getId().equals(post.getId()) ||  !replyTarget.getPost().getId().equals(post.getId())) {
                throw new IllegalArgumentException("같은 게시글의 댓글에만 대댓글을 작성할 수 있습니다.");
            }

            reply = Reply.createChild(content, replyParent, replyTarget, member, post);
        }

        Reply saveReply = replyRepository.save(reply);

        Long parentId = saveReply.getParentReply() == null ? null : saveReply.getParentReply().getId();
        Long targetMemberId = saveReply.getTargetReply() == null ? null : saveReply.getTargetReply().getMember().getId();
        String targetNickname = saveReply.getTargetReply() == null ? null : saveReply.getTargetReply().getMember().getNickname();

        postRepository.replyCountUp(postId);

        return new ReplyDetailDto(
                saveReply.getId(),
                saveReply.getContent(),
                saveReply.getLikeCount(),
                saveReply.getReplyCount(),
                parentId,
                targetMemberId,
                targetNickname,
                saveReply.getCreatedAt(),
                saveReply.getUpdatedAt(),
                saveReply.getMember().getId(),
                saveReply.getMember().getNickname(),
                saveReply.getMember().getProfileImgUrl(),
                saveReply.getPost().getId()
        );
    }

    private String normalizeText(String value, String fieldName) {
        if (value == null) {
            throw new IllegalArgumentException(fieldName + "은(는) 필수값입니다.");
        }

        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            throw new IllegalArgumentException(fieldName + "은(는) 빈 값일 수 없습니다.");
        }

        return trimmed;
    }

    @Transactional(readOnly = true)
    public Page<ReplyDetailDto> getParentReplys(Long postId, Long parentId, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ReplyDetailDto> replys = null;

        // 최상위 부모 조회 로직
        if( parentId == null ) {
            replys = replyRepository.findAllParentReplys(postId, pageable);
        }
        if( parentId != null ) {
            replys = replyRepository.findAllChildrenReplys(postId, parentId, pageable);
        }

        return replys;
    }

    @Transactional
    public ReplyDetailDto updateReply(Long memberId, Long postId, Long replyId, String content) {
        if(memberId == null) { throw new IllegalArgumentException("로그인 이후 이용할 수 있습니다."); };

        // ── 1. 입력값 정제 (앞뒤 공백 제거 + 빈 값 방어) ──
        String content1 = normalizeText(content, "내용");

        // ── 2. 길이 제한 검증 ──
        if (content1.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("내용은 최대 1000자까지 입력 가능합니다.");
        }

        // ── 3. 작성자 조회 ──
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        // ── 4. 게시글 조회 ──
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        // ── 5. 댓글 조회 ──
        Reply reply = replyRepository.findById(replyId)
                .filter(r -> "N".equals(r.getDeleteYn()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));

        boolean isAuthor = reply.getMember().getId().equals(memberId);
        boolean isAdmin = member.getRole() == MemberRole.ADMIN;

        if (!isAuthor && !isAdmin) {
            throw new SecurityException("게시글 수정 권한이 없습니다.");
        }

        Reply updatedReply = reply.update(content1);

        Long parentId = updatedReply.getParentReply() == null ? null : updatedReply.getParentReply().getId();
        Long targetMemberId = updatedReply.getTargetReply() == null ? null : updatedReply.getTargetReply().getMember().getId();
        String targetNickname = updatedReply.getTargetReply() == null ? null : updatedReply.getTargetReply().getMember().getNickname();

        return new ReplyDetailDto(
                updatedReply.getId(),
                updatedReply.getContent(),
                updatedReply.getLikeCount(),
                updatedReply.getReplyCount(),
                parentId,
                targetMemberId,
                targetNickname,
                updatedReply.getCreatedAt(),
                updatedReply.getUpdatedAt(),
                updatedReply.getMember().getId(),
                updatedReply.getMember().getNickname(),
                updatedReply.getMember().getProfileImgUrl(),
                updatedReply.getPost().getId()
        );

    }
}
