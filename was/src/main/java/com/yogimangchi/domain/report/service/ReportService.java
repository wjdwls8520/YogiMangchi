package com.yogimangchi.domain.report.service;

import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import com.yogimangchi.domain.community.support.CommunityMemberReader;
import com.yogimangchi.domain.community.support.PostReader;
import com.yogimangchi.domain.community.support.ReplyReader;
import com.yogimangchi.domain.community.validator.ReplyValidator;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.report.dto.response.ReportResponseDto;
import com.yogimangchi.domain.report.enums.ReportReasonType;
import com.yogimangchi.domain.report.repository.PostReportRepository;
import com.yogimangchi.domain.report.repository.ReplyReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final PostRepository postRepository;
    private final ReplyRepository replyRepository;
    private final PostReportRepository postReportRepository;
    private final ReplyReportRepository replyReportRepository;
    private final CommunityMemberReader communityMemberReader;
    private final PostReader postReader;
    private final ReplyReader replyReader;
    private final ReplyValidator replyValidator;

    /**
     * 게시글 신고
     */
    @Transactional
    public ReportResponseDto reportPost(Long memberId, Long postId, ReportReasonType reasonType) {
        // 로그인한 사용자인지 확인하고 회원 정보를 가져옵니다.
        Member member = communityMemberReader.getAuthenticated(memberId);
        // 삭제되지 않은 활성 게시글인지 확인합니다.
        Post post = postReader.getActive(postId);

        // 본인 게시글은 신고할 수 없습니다.
        validateNotSelfReport(member.getId(), post.getMember().getId());

        // 중복 신고 방지: 이미 신고했으면 insert되지 않고 0을 반환합니다. (멱등 처리)
        int insertedCount = postReportRepository.insertIgnore(memberId, postId, reasonType.name());
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
    public ReportResponseDto unreportPost(Long memberId, Long postId) {
        communityMemberReader.getAuthenticated(memberId);
        postReader.getActive(postId);

        int deletedCount = postReportRepository.deleteByMemberIdAndPostId(memberId, postId);
        if (deletedCount > 0) {
            postRepository.decreaseReportCount(postId);
        }

        return new ReportResponseDto(postId, postRepository.findReportCountById(postId), false);
    }

    /**
     * 댓글 신고
     */
    @Transactional
    public ReportResponseDto reportReply(Long memberId, Long postId, Long replyId, ReportReasonType reasonType) {
        Member member = communityMemberReader.getAuthenticated(memberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글만 신고할 수 있습니다.");

        // 본인 댓글은 신고할 수 없습니다.
        validateNotSelfReport(member.getId(), reply.getMember().getId());

        int insertedCount = replyReportRepository.insertIgnore(memberId, replyId, reasonType.name());
        if (insertedCount > 0) {
            replyRepository.increaseReportCount(replyId);
        }

        return new ReportResponseDto(replyId, replyRepository.findReportCountById(replyId), true);
    }

    /**
     * 댓글 신고 취소
     */
    @Transactional
    public ReportResponseDto unreportReply(Long memberId, Long postId, Long replyId) {
        communityMemberReader.getAuthenticated(memberId);
        Post post = postReader.getActive(postId);
        Reply reply = replyReader.getActive(replyId);
        replyValidator.validateReplyBelongsToPost(post, reply, "같은 게시글의 댓글만 신고 취소할 수 있습니다.");

        int deletedCount = replyReportRepository.deleteByMemberIdAndReplyId(memberId, replyId);
        if (deletedCount > 0) {
            replyRepository.decreaseReportCount(replyId);
        }

        return new ReportResponseDto(replyId, replyRepository.findReportCountById(replyId), false);
    }

    private void validateNotSelfReport(Long reporterId, Long authorId) {
        if (reporterId.equals(authorId)) {
            throw new IllegalArgumentException("본인의 글/댓글은 신고할 수 없습니다.");
        }
    }
}
