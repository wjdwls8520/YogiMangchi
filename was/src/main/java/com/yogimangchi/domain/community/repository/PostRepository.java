package com.yogimangchi.domain.community.repository;

import com.yogimangchi.domain.community.dto.response.PostDto;
import com.yogimangchi.domain.community.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {
    @Query("""
        SELECT new com.yogimangchi.domain.community.dto.response.PostDto(
            p.id,
            p.title,
            p.content,
            p.createdAt,
            p.updatedAt,
            m.id,
            m.nickname,
            m.profileImgUrl
        )
        FROM Post p
        JOIN p.member m
        WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
    """)
    Page<PostDto> findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(@Param("keyword") String keyword, Pageable pageable);

    @Query("""
        SELECT new com.yogimangchi.domain.community.dto.response.PostDto(
            p.id,
            p.title,
            p.content,
            p.createdAt,
            p.updatedAt,
            m.id,
            m.nickname,
            m.profileImgUrl
        )
        FROM Post p
        JOIN p.member m
    """)
    Page<PostDto> findAllPosts(Pageable pageable);
}
