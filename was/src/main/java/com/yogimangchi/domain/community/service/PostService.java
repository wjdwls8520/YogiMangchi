package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.response.PostDto;
import com.yogimangchi.domain.community.dto.response.PostListDto;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.global.file.dto.response.FileDto;
import com.yogimangchi.global.file.repository.FileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final FileRepository fileRepository;

    public Page<PostListDto> getPosts(Integer page, Integer size, String keyword) {

        String q = (keyword == null) ? null : keyword.trim(); // 입력 앞뒤 공백 제거(사용자 입력 노이즈 대응)

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostDto> posts = (q == null || q.isBlank()) // 공백만 입력된 경우도 전체 조회로 처리
                ? postRepository.findAllPosts(pageable)
                : postRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(q, pageable);

        if (posts.isEmpty()) return Page.empty(pageable); // 게시글이하나도없을때 빈값 리턴

        List<Long> postIds = posts.getContent().stream()
            .map(PostDto::id)
            .toList();

        Map<Long, List<FileDto>> filesByPostId = fileRepository.findAllByPostIds(postIds)
                .stream().collect(Collectors.groupingBy(FileDto::postId));

        Page<PostListDto> postListDto = posts.map(post -> new PostListDto(
                post.id(),
                post.title(),
                post.content(),
                post.createdAt(),
                post.updatedAt(),
                post.memberId(),
                post.nickname(),
                post.profileImg(),
                filesByPostId.getOrDefault(post.id(), List.of())
        ));

        return postListDto;
    }
}
