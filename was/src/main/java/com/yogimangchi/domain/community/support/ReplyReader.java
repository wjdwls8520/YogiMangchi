package com.yogimangchi.domain.community.support;

import com.yogimangchi.domain.community.entity.Reply;
import com.yogimangchi.domain.community.repository.ReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReplyReader {

    private final ReplyRepository replyRepository;

    public Reply get(Long replyId) {
        return replyRepository.findById(replyId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));
    }

    public Reply getActive(Long replyId) {
        return replyRepository.findById(replyId)
                .filter(reply -> "N".equals(reply.getDeleteYn()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));
    }
}
