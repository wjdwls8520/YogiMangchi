package com.yogimangchi.domain.community.support;

import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PostReader {

    private final PostRepository postRepository;

    public Post getActive(Long postId) {
        return postRepository.findById(postId)
                .filter(post -> "N".equals(post.getDeleteYn()))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않거나 삭제된 게시글입니다."));
    }
}
