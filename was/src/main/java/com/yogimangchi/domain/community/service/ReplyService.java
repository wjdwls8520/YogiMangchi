package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.request.ReplyCreateDto;
import com.yogimangchi.domain.community.dto.request.ReplySearchDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.repository.ReplyLikeRepository;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import com.yogimangchi.domain.report.repository.ReplyReportRepository;
import com.yogimangchi.global.support.MemberReader;
import com.yogimangchi.domain.community.support.PostReader;
import com.yogimangchi.domain.community.support.ReplyReader;
import com.yogimangchi.domain.community.validator.CommunityPermissionValidator;
import com.yogimangchi.domain.community.validator.ReplyValidator;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.global.dto.CursorResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReplyService {

    private static final String WITHDRAWN_MEMBER_NICKNAME = "탈퇴한 유저";

    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final ReplyLikeRepository replyLikeRepository;
    private final ReplyReportRepository replyReportRepository;
    private final MemberReader memberReader;
    private final PostReader postReader;
    private final ReplyReader replyReader;
    private final ReplyValidator replyValidator;
    private final CommunityPermissionValidator communityPermissionValidator;

    private static final int MAX_CONTENT_LENGTH = 1000;


    @Transactional(readOnly = true)
    public CursorResponseDto<ReplyDetailDto> getParentReplys(Long loginMemberId, Long postId, ReplySearchDto request) {

        Post post = postReader.getActive(postId);
        int limitSize = request.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<ReplyDetailDto> replys;

        // 최상위 부모 조회 로직
        if (request.parentId() == null) {
            replys = replyRepository.findAllParentReplysByCursor(post.getId(), request.cursorId(), pageable);
        } else {
            Reply parentReply = replyReader.get(request.parentId());
            replyValidator.validateReplyGroupParent(post, parentReply);
            replys = replyRepository.findAllChildrenReplysByCursor(post.getId(), request.parentId(), request.cursorId(), pageable);
        }

        if (replys == null || replys.isEmpty()) {
            return new CursorResponseDto<>(List.of(), null, false);
        }

        boolean hasNext = replys.size() > limitSize;
        if (hasNext) {
            replys = new ArrayList<>(replys.subList(0, limitSize));
        }

        Set<Long> likedReplyIds = getLikedReplyIds(loginMemberId, replys.stream()
                .map(ReplyDetailDto::id)
                .toList());

        Set<Long> reportedReplyIds = getReportedReplyIds(loginMemberId, replys.stream()
                .map(ReplyDetailDto::id)
                .toList());

        List<ReplyDetailDto> content = replys.stream().map(reply -> new ReplyDetailDto(
                reply.id(),
                reply.content(),
                reply.likeCount(),
                likedReplyIds.contains(reply.id()),
                reply.reportCount(),
                reportedReplyIds.contains(reply.id()),
                reply.replyCount(),
                reply.parentReplyId(),
                reply.targetMemberId(),
                reply.targetNickname(),
                reply.createdAt(),
                reply.updatedAt(),
                reply.memberId(),
                reply.nickname(),
                reply.profileImgUrl(),
                reply.postId(),
                reply.deleteYn()
        )).toList();

        Long nextCursorId = replys.get(replys.size() - 1).id();
        return new CursorResponseDto<>(content, hasNext ? nextCursorId : null, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ReplyDetailDto> getReplysByAuthor(Long loginMemberId, Long authorMemberId, ReplySearchDto request) {

        memberReader.getFindMember(authorMemberId);
        int limitSize = request.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<ReplyDetailDto> replys = replyRepository.getReplysByAuthorByCursor(authorMemberId, request.cursorId(), pageable);

        if (replys.isEmpty()) return new CursorResponseDto<>(List.of(), null, false);

        boolean hasNext = replys.size() > limitSize;
        if (hasNext) {
            replys = new ArrayList<>(replys.subList(0, limitSize));
        }

        Set<Long> likedReplyIds = getLikedReplyIds(loginMemberId, replys.stream()
                .map(ReplyDetailDto::id)
                .toList());

        Set<Long> reportedReplyIds = getReportedReplyIds(loginMemberId, replys.stream()
                .map(ReplyDetailDto::id)
                .toList());

        List<ReplyDetailDto> content = replys.stream().map(reply -> new ReplyDetailDto(
                reply.id(),
                reply.content(),
                reply.likeCount(),
                likedReplyIds.contains(reply.id()),
                reply.reportCount(),
                reportedReplyIds.contains(reply.id()),
                reply.replyCount(),
                reply.parentReplyId(),
                reply.targetMemberId(),
                reply.targetNickname(),
                reply.createdAt(),
                reply.updatedAt(),
                reply.memberId(),
                reply.nickname(),
                reply.profileImgUrl(),
                reply.postId(),
                reply.deleteYn()
        )).toList();

        Long nextCursorId = replys.get(replys.size() - 1).id();
        return new CursorResponseDto<>(content, hasNext ? nextCursorId : null, hasNext);
    }


    @Transactional
    public ReplyDetailDto createReply(Long loginMemberId, Long postId, ReplyCreateDto request) {

        // ── 1. 입력값 정제 (앞뒤 공백 제거 + 빈 값 방어) ──
        String content = normalizeText(request.content(), "내용");

        // ── 2. 길이 제한 검증 ──
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("내용은 최대 1000자까지 입력 가능합니다.");
        }

        // ── 3. 요청자와 활성 게시글을 먼저 확인합니다. ──
        Member member = memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        replyValidator.validateCreateRequest(request);

        Reply reply;
        if (request.parentId() == null) {
            reply = Reply.create(content, member, post);
        } else {
            Reply replyParent = replyReader.getActive(request.parentId());
            replyValidator.validateParent(post, replyParent);

            Reply replyTarget = null;
            if (request.targetId() != null) {
                replyTarget = replyReader.getActive(request.targetId());
                replyValidator.validateTarget(post, replyParent, replyTarget);
            }

            reply = Reply.createChild(content, replyParent, replyTarget, member, post);
        }

        Reply saveReply = replyRepository.save(reply);

        Long parentId = saveReply.getParentReply() == null ? null : saveReply.getParentReply().getId();
        Long targetMemberId = saveReply.getTargetReply() == null ? null : saveReply.getTargetReply().getMember().getId();
        String targetNickname = saveReply.getTargetReply() == null
                ? null
                : displayNickname(saveReply.getTargetReply().getMember());

        // 저장이 끝난 뒤 게시글과 부모댓글 카운트를 반영합니다.
        postRepository.increaseReplyCount(postId);
        if (saveReply.getParentReply() != null) {
            replyRepository.increaseReplyCount(saveReply.getParentReply().getId());
        }

        return new ReplyDetailDto(
                saveReply.getId(),
                saveReply.getContent(),
                saveReply.getLikeCount(),
                false,
                saveReply.getReportCount(),
                false,
                saveReply.getReplyCount(),
                parentId,
                targetMemberId,
                targetNickname,
                saveReply.getCreatedAt(),
                saveReply.getUpdatedAt(),
                saveReply.getMember().getId(),
                saveReply.getMember().getNickname(),
                saveReply.getMember().getProfileImgUrl(),
                saveReply.getPost().getId(),
                saveReply.getDeleteYn()
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


    @Transactional
    public ReplyDetailDto updateReply(Long loginMemberId, Long postId, Long replyId, String content) {
        // ── 1. 입력값 정제 (앞뒤 공백 제거 + 빈 값 방어) ──
        String content1 = normalizeText(content, "내용");

        // ── 2. 길이 제한 검증 ──
        if (content1.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("내용은 최대 1000자까지 입력 가능합니다.");
        }

        // ── 3. 수정 대상의 소속과 권한을 확인합니다. ──
        Member member = memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글만 수정할 수 있습니다.");
        communityPermissionValidator.validateReplyAuthorOrAdmin(reply, member, "댓글 수정 권한이 없습니다.");

        Reply updatedReply = reply.update(content1);

        Long parentId = updatedReply.getParentReply() == null ? null : updatedReply.getParentReply().getId();
        Long targetMemberId = updatedReply.getTargetReply() == null ? null : updatedReply.getTargetReply().getMember().getId();
        String targetNickname = updatedReply.getTargetReply() == null
                ? null
                : displayNickname(updatedReply.getTargetReply().getMember());

        return new ReplyDetailDto(
                updatedReply.getId(),
                updatedReply.getContent(),
                updatedReply.getLikeCount(),
                replyLikeRepository.existsByMember_IdAndReply_Id(loginMemberId, replyId),
                updatedReply.getReportCount(),
                isReplyReportedByMember(loginMemberId, replyId),
                updatedReply.getReplyCount(),
                parentId,
                targetMemberId,
                targetNickname,
                updatedReply.getCreatedAt(),
                updatedReply.getUpdatedAt(),
                updatedReply.getMember().getId(),
                updatedReply.getMember().getNickname(),
                updatedReply.getMember().getProfileImgUrl(),
                updatedReply.getPost().getId(),
                updatedReply.getDeleteYn()
        );

    }

    @Transactional
    public void deleteReply(Long loginMemberId, Long postId, Long replyId) {
        // ── 1. 삭제 대상의 소속과 권한을 확인합니다. ──
        Member member = memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글만 삭제할 수 있습니다.");
        communityPermissionValidator.validateReplyAuthorOrAdmin(reply, member, "댓글 삭제 권한이 없습니다.");

        reply.delete();

        // 자식댓글이 삭제되면 부모댓글의 댓글카운트 -1
        if (reply.getParentReply() != null) {
            replyRepository.decreaseReplyCount(reply.getParentReply().getId());
        }

        // 댓글 삭제는 게시글 전체 댓글 수에서도 차감합니다.
        postRepository.decreaseReplyCount(postId);
    }

    private Set<Long> getLikedReplyIds(Long loginMemberId, List<Long> replyIds) {
        if (loginMemberId == null || replyIds.isEmpty()) {
            return Set.of();
        }

        return new HashSet<>(replyLikeRepository.findLikedReplyIds(loginMemberId, replyIds));
    }

    private Set<Long> getReportedReplyIds(Long loginMemberId, List<Long> replyIds) {
        if (loginMemberId == null || replyIds.isEmpty()) {
            return Set.of();
        }

        return new HashSet<>(replyReportRepository.findReportedReplyIds(loginMemberId, replyIds));
    }

    private boolean isReplyReportedByMember(Long loginMemberId, Long replyId) {
        if (loginMemberId == null) {
            return false;
        }

        return replyReportRepository.existsByMember_IdAndReply_Id(loginMemberId, replyId);
    }

    private String displayNickname(Member member) {
        return member.isDeleted() ? WITHDRAWN_MEMBER_NICKNAME : member.getNickname();
    }

}
