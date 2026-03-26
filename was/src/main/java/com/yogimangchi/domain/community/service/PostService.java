package com.yogimangchi.domain.community.service;

import com.yogimangchi.domain.community.dto.request.PostCreateDto;
import com.yogimangchi.domain.community.dto.request.PostUpdateDto;
import com.yogimangchi.domain.community.dto.response.PostAndMemberDto;
import com.yogimangchi.domain.community.dto.response.PostDetailDto;
import com.yogimangchi.domain.community.entity.Post;
import com.yogimangchi.domain.community.repository.PostLikeRepository;
import com.yogimangchi.domain.community.repository.PostRepository;
import com.yogimangchi.domain.community.support.CommunityMemberReader;
import com.yogimangchi.domain.community.support.PostReader;
import com.yogimangchi.domain.community.validator.CommunityPermissionValidator;
import com.yogimangchi.domain.member.entity.Member;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final FileRepository fileRepository;
    private final CommunityMemberReader communityMemberReader;
    private final PostReader postReader;
    private final CommunityPermissionValidator communityPermissionValidator;
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
    public Page<PostDetailDto> getPosts(Long memberId, Integer page, Integer size, String keyword) {

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
        Set<Long> likedPostIds = getLikedPostIds(memberId, postIds);

        return posts.map(post -> new PostDetailDto(
                post.id(),
                post.title(),
                post.content(),
                post.likeCount(),
                likedPostIds.contains(post.id()),
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
     * 단건 게시글 조회 (게시글 + 작성자 + 첨부파일)
     */
    @Transactional(readOnly = true)
    public PostDetailDto getPost(Long memberId, Long postId) {

        // ── 1. 활성 게시글을 조회합니다. ──
        Post post = postReader.getActive(postId);

        // ── 2. 첨부파일 조회 ──
        List<FileDto> files = fileRepository.findAllByPostIds(List.of(postId));

        // ── 3. 응답 DTO 조립 ──
        Member author = post.getMember();
        return new PostDetailDto(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getLikeCount(),
                isPostLikedByMember(memberId, postId),
                post.getReplyCount(),
                post.getReportCount(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                author.getId(),
                author.getNickname(),
                author.getProfileImgUrl(),
                files
        );
    }

    /**
     * 게시글 생성 (제목, 내용, 첨부 이미지)
     */
    @Transactional
    public PostDetailDto createPost(Long memberId, PostCreateDto request) {

        // ── 1. 입력값 정제 (앞뒤 공백 제거 + 빈 값 방어) ──
        String title = normalizeText(request.title(), "제목");
        String content = normalizeText(request.content(), "내용");

        // ── 2. 길이 제한 검증 ──
        if (title.length() > MAX_TITLE_LENGTH) {
            throw new IllegalArgumentException("제목은 최대 50자까지 입력 가능합니다.");
        }

        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("내용은 최대 1000자까지 입력 가능합니다.");
        }

        // ── 3. 요청자를 확인합니다. ──
        Member member = communityMemberReader.getAuthenticated(memberId);

        // ── 4. 첨부 이미지 필터링 (null·빈 파일 제거) ──
        List<MultipartFile> images = request.files().stream()
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
                false,
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

    /**
     * 게시글 수정 (제목, 내용, 첨부 이미지 추가·삭제)
     */
    @Transactional
    public PostDetailDto updatePost(Long memberId, Long postId, PostUpdateDto request) {

        // ── 1. 수정 대상과 요청자의 권한을 확인합니다. ──
        Post post = postReader.getActive(postId);
        Member requester = communityMemberReader.getAuthenticated(memberId);
        communityPermissionValidator.validatePostAuthorOrAdmin(post, requester, "게시글 수정 권한이 없습니다.");

        // ── 3. 입력값 정제 + 길이 검증 ──
        String title = normalizeText(request.title(), "제목");
        String content = normalizeText(request.content(), "내용");

        if (title.length() > MAX_TITLE_LENGTH) {
            throw new IllegalArgumentException("제목은 최대 50자까지 입력 가능합니다.");
        }

        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException("내용은 최대 1000자까지 입력 가능합니다.");
        }

        // ── 4. 기존 파일 삭제 처리 (deleteFileIds) ──
        List<File> existingFiles = fileRepository.findAllByPostId(postId);
        List<Long> deleteFileIds = request.deleteFileIds();

        if (!deleteFileIds.isEmpty()) {
            List<File> filesToDelete = existingFiles.stream()
                    .filter(f -> deleteFileIds.contains(f.getId()))
                    .toList();

            // DB에서 파일 삭제 (트랜잭션 롤백 시 함께 롤백됨)
            fileRepository.deleteAll(filesToDelete);

            // S3 물리 파일 삭제는 트랜잭션 커밋 성공 후 실행 (롤백 시 S3 파일 보존)
            List<String> pathsToDelete = filesToDelete.stream()
                    .map(File::getPath)
                    .toList();
            registerDeletedFileCleanup(pathsToDelete);

            // 삭제된 파일을 기존 목록에서 제거
            existingFiles = existingFiles.stream()
                    .filter(f -> !deleteFileIds.contains(f.getId()))
                    .toList();
        }

        // ── 5. 새 이미지 필터링 (null·빈 파일 제거) ──
        List<MultipartFile> newImages = request.files().stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();

        // ── 6. 총 파일 수 검증 (기존 잔여 + 신규) ──
        int totalFileCount = existingFiles.size() + newImages.size();
        if (totalFileCount > MAX_POST_IMAGE_COUNT) {
            throw new IllegalArgumentException(
                    "첨부 파일은 최대 " + MAX_POST_IMAGE_COUNT + "개까지 가능합니다. " +
                    "(현재 " + existingFiles.size() + "개 + 신규 " + newImages.size() + "개)");
        }

        // ── 7. 새 이미지 S3 업로드 (트랜잭션 실패 시 자동 롤백 등록) ──
        List<S3UploadResult> uploadedImages = new ArrayList<>();
        registerUploadedFileRollback(uploadedImages);
        uploadPostImages(newImages, uploadedImages);

        // ── 8. 새 파일 메타데이터 DB 저장 ──
        List<File> newFilesToSave = new ArrayList<>();
        for (int i = 0; i < newImages.size(); i++) {
            MultipartFile image = newImages.get(i);
            S3UploadResult uploaded = uploadedImages.get(i);
            String contentType = image.getContentType() == null
                    ? "application/octet-stream" : image.getContentType();

            newFilesToSave.add(File.create(
                    image.getOriginalFilename(),
                    image.getSize(),
                    uploaded.url(),
                    contentType,
                    post
            ));
        }
        List<File> persistedNewFiles = fileRepository.saveAll(newFilesToSave);

        // ── 9. 게시글 제목·내용 업데이트 ──
        post.update(title, content);

        // ── 10. 응답 DTO 조립 (잔여 기존 파일 + 신규 파일) ──
        List<FileDto> responseFiles = new ArrayList<>();

        existingFiles.forEach(file -> responseFiles.add(new FileDto(
                file.getId(), file.getOriginalname(), file.getSize(),
                file.getPath(), file.getContentType(), file.getCreatedAt(),
                post.getId()
        )));

        persistedNewFiles.forEach(file -> responseFiles.add(new FileDto(
                file.getId(), file.getOriginalname(), file.getSize(),
                file.getPath(), file.getContentType(), file.getCreatedAt(),
                post.getId()
        )));

        Member author = post.getMember();
        return new PostDetailDto(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getLikeCount(),
                postLikeRepository.existsByMember_IdAndPost_Id(memberId, postId),
                post.getReplyCount(),
                post.getReportCount(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                author.getId(),
                author.getNickname(),
                author.getProfileImgUrl(),
                responseFiles
        );
    }

    @Transactional
    public void deletePost(Long memberId, Long postId) {
        // ── 1. 삭제 대상과 요청자의 권한을 확인합니다. ──
        Post post = postReader.getActive(postId);
        Member requester = communityMemberReader.getAuthenticated(memberId);
        communityPermissionValidator.validatePostAuthorOrAdmin(post, requester, "게시글 삭제 권한이 없습니다.");

        // 소프트삭제 deleteYN = Y
        post.delete();
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

    /**
     * 트랜잭션 커밋 성공 후에만 S3 물리 파일을 삭제하는 콜백을 등록합니다.
     * 롤백 시에는 S3 파일이 보존되어 데이터 정합성을 유지합니다.
     */
    private void registerDeletedFileCleanup(List<String> filePaths) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) {
                    filePaths.forEach(path -> {
                        try {
                            s3Service.deleteByUrlIfManaged(path, POST_IMAGE_DIRECTORY);
                        } catch (Exception e) {
                            log.error("커밋 후 S3 파일 삭제에 실패했습니다. path={}", path, e);
                        }
                    });
                }
            }
        });
    }

    private Set<Long> getLikedPostIds(Long memberId, List<Long> postIds) {
        if (memberId == null || postIds.isEmpty()) {
            return Set.of();
        }

        return new HashSet<>(postLikeRepository.findLikedPostIds(memberId, postIds));
    }

    private boolean isPostLikedByMember(Long memberId, Long postId) {
        if (memberId == null) {
            return false;
        }

        return postLikeRepository.existsByMember_IdAndPost_Id(memberId, postId);
    }
}
