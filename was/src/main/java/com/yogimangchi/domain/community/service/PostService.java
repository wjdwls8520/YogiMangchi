package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.request.PostCreateRequest;
import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.PostDetailDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.global.file.Entity.File;
import com.yogimangchi.global.file.dto.response.FileDto;
import com.yogimangchi.global.file.repository.FileRepository;
import com.yogimangchi.global.s3.service.S3Service;
import com.yogimangchi.global.s3.service.S3UploadResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final FileRepository fileRepository;
    private final MemberRepository memberRepository;
    private final S3Service s3Service;

    private static final int MAX_TITLE_LENGTH = 50;
    private static final int MAX_CONTENT_LENGTH = 1000;
    private static final int MAX_POST_IMAGE_COUNT = 10;
    private static final long POST_IMAGE_MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final String POST_IMAGE_DIRECTORY = "community/post";

    /**
     * 게시글 목록 조회 (페이징 + 키워드 검색)
     */
    @Transactional(readOnly = true)
    public Page<PostDetailDto> getPosts(Integer page, Integer size, String keyword) {

        String q = (keyword == null) ? null : keyword.trim();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PostAndMemberDto> posts = (q == null || q.isBlank())
                ? postRepository.findAllPosts(pageable)
                : postRepository.findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(q, pageable);

        if (posts.isEmpty()) return Page.empty(pageable);

        // 조회된 게시글 ID 목록으로 첨부파일을 한 번에 조회 (N+1 방지)
        List<Long> postIds = posts.getContent().stream()
            .map(PostAndMemberDto::id)
            .toList();

        Map<Long, List<FileDto>> filesByPostId = fileRepository.findAllByPostIds(postIds)
                .stream().collect(Collectors.groupingBy(FileDto::postId));

        return posts.map(post -> new PostDetailDto(
                post.id(),
                post.title(),
                post.content(),
                post.likeCount(),
                post.replyCount(),
                post.reportCount(),
                post.createdAt(),
                post.updatedAt(),
                post.memberId(),
                post.nickname(),
                post.profileImg(),
                filesByPostId.getOrDefault(post.id(), List.of())
        ));
    }

    /**
     * 게시글 생성 (제목, 내용, 첨부 이미지)
     */
    @Transactional
    public PostDetailDto createPost(Long memberId, PostCreateRequest request, List<MultipartFile> files) {

        // ── 1. 입력값 정제 (앞뒤 공백 제거 + 빈 값 방어) ──
        String title = normalizeText(request.getTitle(), "제목");
        String content = normalizeText(request.getContent(), "내용");

        // ── 2. 길이 제한 검증 ──
        if (title.length() > MAX_TITLE_LENGTH) {
            throw new IllegalArgumentException("제목은 최대 50자까지 입력 가능합니다.");
        }

        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("내용은 최대 1000자까지 입력 가능합니다.");
        }

        // ── 3. 작성자 조회 ──
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        // ── 4. 첨부 이미지 필터링 (null·빈 파일 제거) ──
        List<MultipartFile> images = files == null
                ? List.of()
                : files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();

        if (images.size() > MAX_POST_IMAGE_COUNT) {
            throw new IllegalArgumentException("첨부 파일은 최대 10개까지 가능합니다.");
        }

        // ── 5. S3 업로드 (트랜잭션 실패 시 자동 롤백 등록) ──
        List<S3UploadResult> uploadedImages = new ArrayList<>();
        registerUploadedFileRollback(uploadedImages);
        uploadPostImages(images, uploadedImages);

        // ── 6. 게시글 저장 ──
        Post post = Post.create(member, title, content);
        Post savedPost = postRepository.save(post);

        // ── 7. 파일 메타데이터 DB 저장 ──
        List<File> filesToSave = new ArrayList<>();
        for (int i = 0; i < images.size(); i++) {
            MultipartFile image = images.get(i);
            S3UploadResult uploaded = uploadedImages.get(i);
            String contentType = image.getContentType() == null
                    ? "application/octet-stream" : image.getContentType();

            filesToSave.add(File.create(
                    image.getOriginalFilename(),
                    image.getSize(),
                    uploaded.url(),
                    contentType,
                    savedPost
            ));
        }

        // ── 8. 응답 DTO 조립 ──
        List<File> persistedFiles = fileRepository.saveAll(filesToSave);
        List<FileDto> responseFiles = persistedFiles.stream()
                .map(file -> new FileDto(
                        file.getId(),
                        file.getOriginalname(),
                        file.getSize(),
                        file.getPath(),
                        file.getContentType(),
                        file.getCreatedAt(),
                        savedPost.getId()
                ))
                .toList();

        return new PostDetailDto(
                savedPost.getId(),
                savedPost.getTitle(),
                savedPost.getContent(),
                savedPost.getLikeCount(),
                savedPost.getReplyCount(),
                savedPost.getReportCount(),
                savedPost.getCreatedAt(),
                savedPost.getUpdatedAt(),
                member.getId(),
                member.getNickname(),
                member.getProfileImgUrl(),
                responseFiles
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

    private void uploadPostImages(List<MultipartFile> images, List<S3UploadResult> uploaded) {
        for (MultipartFile image : images) {
            uploaded.add(s3Service.uploadImage(image, POST_IMAGE_DIRECTORY, POST_IMAGE_MAX_FILE_SIZE));
        }
    }

    private void registerUploadedFileRollback(List<S3UploadResult> uploadedImages) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    uploadedImages.forEach(uploaded -> {
                        try {
                            s3Service.deleteByKey(uploaded.key());
                        } catch (Exception e) {
                            log.error("롤백 대상 업로드 파일 정리에 실패했습니다. key={}", uploaded.key(), e);
                        }
                    });
                }
            }
        });
    }
}
