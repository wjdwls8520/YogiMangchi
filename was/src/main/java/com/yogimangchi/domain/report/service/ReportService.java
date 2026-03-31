package com.yogimangchi.domain.report.service;

import com.yogimangchi.domain.community.dto.query.PostQueryDto;
import com.yogimangchi.domain.community.dto.query.ReplyQueryDto;
import com.yogimangchi.domain.community.dto.request.PostSearchDto;
import com.yogimangchi.domain.community.dto.request.ReplySearchDto;
import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.ReplyDetailDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import com.yogimangchi.global.support.MemberReader;
import com.yogimangchi.domain.community.support.PostReader;
import com.yogimangchi.domain.community.support.ReplyReader;
import com.yogimangchi.domain.community.validator.ReplyValidator;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.report.dto.response.ReportResponseDto;
import com.yogimangchi.domain.report.enums.ReportReasonType;
import com.yogimangchi.domain.report.repository.PostReportRepository;
import com.yogimangchi.domain.report.repository.ReplyReportRepository;
import com.yogimangchi.global.dto.CursorResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final PostReportRepository postReportRepository;
    private final ReplyReportRepository replyReportRepository;
    private final MemberReader memberReader;
    private final PostReader postReader;
    private final ReplyReader replyReader;
    private final ReplyValidator replyValidator;

    /**
     * 게시글 신고
     */
    @Transactional
    public ReportResponseDto reportPost(Long loginMemberId, Long postId, ReportReasonType reasonType) {
        // 로그인한 사용자인지 확인하고 회원 정보를 가져옵니다.
        Member member = memberReader.getAuthenticated(loginMemberId);
        // 삭제되지 않은 활성 게시글인지 확인합니다.
        Post post = postReader.getActive(postId);

        // 본인 게시글은 신고할 수 없습니다.
        validateNotSelfReport(member.getId(), post.getMember().getId());

        // 중복 신고 방지: 이미 신고했으면 insert되지 않고 0을 반환합니다. (멱등 처리)
        int insertedCount = postReportRepository.insertIgnore(loginMemberId, postId, reasonType.name());
        // 새로 신고가 등록된 경우에만 게시글의 신고 수를 1 증가시킵니다.
        if (insertedCount > 0) {
            postRepository.increaseReportCount(postId);
        }

        // 최신 신고 수를 DB에서 조회하여 응답합니다.
        return new ReportResponseDto(postId, postRepository.findReportCountById(postId), true);
    }

    /**
     * 게시글 신고 취소
     */
    @Transactional
    public ReportResponseDto unreportPost(Long loginMemberId, Long postId) {
        memberReader.getAuthenticated(loginMemberId);
        postReader.getActive(postId);

        int deletedCount = postReportRepository.deleteByMemberIdAndPostId(loginMemberId, postId);
        if (deletedCount > 0) {
            postRepository.decreaseReportCount(postId);
        }

        return new ReportResponseDto(postId, postRepository.findReportCountById(postId), false);
    }

    /**
     * 댓글 신고
     */
    @Transactional
    public ReportResponseDto reportReply(Long loginMemberId, Long postId, Long replyId, ReportReasonType reasonType) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글만 신고할 수 있습니다.");

        // 본인 댓글은 신고할 수 없습니다.
        validateNotSelfReport(member.getId(), reply.getMember().getId());

        int insertedCount = replyReportRepository.insertIgnore(loginMemberId, replyId, reasonType.name());
        if (insertedCount > 0) {
            replyRepository.increaseReportCount(replyId);
        }

        return new ReportResponseDto(replyId, replyRepository.findReportCountById(replyId), true);
    }

    /**
     * 댓글 신고 취소
     */
    @Transactional
    public ReportResponseDto unreportReply(Long loginMemberId, Long postId, Long replyId) {
        memberReader.getAuthenticated(loginMemberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글만 신고 취소할 수 있습니다.");

        int deletedCount = replyReportRepository.deleteByMemberIdAndReplyId(loginMemberId, replyId);
        if (deletedCount > 0) {
            replyRepository.decreaseReportCount(replyId);
        }

        return new ReportResponseDto(replyId, replyRepository.findReportCountById(replyId), false);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<PostAndMemberDto> getReportedPosts(Long loginMemberId, PostSearchDto request) {
        memberReader.getAuthenticated(loginMemberId);

        String q = (request.keyword() == null) ? null : request.keyword().trim();
        int limitSize = request.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<PostQueryDto> posts = (q == null || q.isBlank())
                ? postReportRepository.findReportedPostsByCursor(loginMemberId, request.cursorId(), pageable)
                : postReportRepository.findReportedPostsByKeywordByCursor(loginMemberId, request.cursorId(), q, pageable);

        if (posts.isEmpty()) return new CursorResponseDto<>(List.of(), null, false);

        boolean hasNext = posts.size() > limitSize;
        if (hasNext) {
            posts = new ArrayList<>(posts.subList(0, limitSize));
        }

        Long nextCursorId = posts.get(posts.size() - 1).cursorId();
        List<PostAndMemberDto> content = posts.stream().map(PostQueryDto::toPostAndMemberDto).toList();
        return new CursorResponseDto<>(content, hasNext ? nextCursorId : null, hasNext);
    }

    @Transactional(readOnly = true)
    public CursorResponseDto<ReplyDetailDto> getReportedReplys(Long loginMemberId, ReplySearchDto request) {
        memberReader.getAuthenticated(loginMemberId);
        int limitSize = request.getOrDefaultSize();
        Pageable pageable = PageRequest.ofSize(limitSize + 1);

        List<ReplyQueryDto> replys = replyReportRepository.getReportedReplysByCursor(loginMemberId, request.cursorId(), pageable);

        if (replys.isEmpty()) return new CursorResponseDto<>(List.of(), null, false);

        boolean hasNext = replys.size() > limitSize;
        if (hasNext) {
            replys = new ArrayList<>(replys.subList(0, limitSize));
        }

        Long nextCursorId = replys.get(replys.size() - 1).cursorId();
        List<ReplyDetailDto> content = replys.stream().map(ReplyQueryDto::toReplyDetailDto).toList();
        return new CursorResponseDto<>(content, hasNext ? nextCursorId : null, hasNext);
    }

    private void validateNotSelfReport(Long reporterId, Long authorId) {
        if (reporterId.equals(authorId)) {
            throw new IllegalArgumentException("본인의 글/댓글은 신고할 수 없습니다.");
        }
    }
}
