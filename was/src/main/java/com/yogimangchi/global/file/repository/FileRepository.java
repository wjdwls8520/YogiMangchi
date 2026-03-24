package com.yogimangchi.global.file.repository;

import com.yogimangchi.global.file.Entity.File;
import com.yogimangchi.global.file.dto.response.FileDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FileRepository extends JpaRepository<File, Long> {
    @Query("""
        SELECT new com.yogimangchi.global.file.dto.response.FileDto(
            f.id, f.originalname, f.size, f.path, f.contentType, f.createdAt, p.id
        )
        FROM File f
        JOIN f.post p
        WHERE f.post.id in :postIds
        """)
    List<FileDto> findAllByPostIds(@Param("postIds") List<Long> postIds);
}
