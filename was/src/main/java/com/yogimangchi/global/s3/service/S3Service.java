package com.yogimangchi.global.s3.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetUrlRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;

@Service
public class S3Service {

    private static final DateTimeFormatter DATE_FOLDER_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final S3Client s3Client;
    private final String bucket;

    public S3Service(
            S3Client s3Client,
            @Value("${spring.cloud.aws.s3.bucket}") String bucket
    ) {
        this.s3Client = s3Client;
        this.bucket = bucket;
    }

    public S3UploadResult uploadImage(MultipartFile imageFile, String rootDirectory, long maxFileSizeBytes) {
        validateImageFile(imageFile, maxFileSizeBytes);

        String key = buildKey(rootDirectory, imageFile.getOriginalFilename());

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(imageFile.getContentType())
                    .build();

            s3Client.putObject(
                    putObjectRequest,
                    RequestBody.fromInputStream(imageFile.getInputStream(), imageFile.getSize())
            );
        } catch (IOException e) {
            throw new IllegalStateException("S3 이미지 업로드에 실패했습니다.", e);
        }

        String url = s3Client.utilities()
                .getUrl(GetUrlRequest.builder().bucket(bucket).key(key).build())
                .toExternalForm();

        return new S3UploadResult(key, url);
    }

    public void deleteByKey(String key) {
        if (key == null || key.isBlank()) {
            return;
        }

        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
    }

    public void deleteByUrlIfManaged(@Nullable String fileUrl, String expectedRootDirectory) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        String key = extractManagedKey(fileUrl, expectedRootDirectory);
        if (key == null) {
            return;
        }

        deleteByKey(key);
    }

    private void validateImageFile(MultipartFile imageFile, long maxFileSizeBytes) {
        if (imageFile == null || imageFile.isEmpty()) {
            throw new IllegalArgumentException("이미지 파일이 필요합니다.");
        }

        if (imageFile.getSize() > maxFileSizeBytes) {
            throw new IllegalArgumentException("이미지는 5MB 이하여야 합니다.");
        }

        String contentType = imageFile.getContentType();
        if (contentType == null) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }

        String normalizedContentType = contentType.toLowerCase(Locale.ROOT);
        if (!normalizedContentType.startsWith("image/")) {
            throw new IllegalArgumentException("이미지 파일만 업로드할 수 있습니다.");
        }

        if ("image/gif".equals(normalizedContentType)) {
            throw new IllegalArgumentException("GIF 이미지는 업로드할 수 없습니다.");
        }
    }

    private String buildKey(String rootDirectory, @Nullable String originalFilename) {
        String normalizedDirectory = normalizeDirectory(rootDirectory);
        String dateFolder = LocalDate.now().format(DATE_FOLDER_FORMATTER);
        String extension = extractExtension(originalFilename);
        String randomFilename = UUID.randomUUID() + extension;

        return normalizedDirectory + "/" + dateFolder + "/" + randomFilename;
    }

    private String normalizeDirectory(String directory) {
        String normalized = directory.trim();

        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }

        while (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }

        if (normalized.isBlank()) {
            throw new IllegalArgumentException("S3 디렉터리 경로가 필요합니다.");
        }

        return normalized;
    }

    private String extractExtension(@Nullable String originalFilename) {
        if (originalFilename == null) {
            return "";
        }

        int extensionIndex = originalFilename.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == originalFilename.length() - 1) {
            return "";
        }

        return originalFilename.substring(extensionIndex);
    }

    private String extractManagedKey(String fileUrl, String expectedRootDirectory) {
        try {
            URI uri = URI.create(fileUrl);
            String path = uri.getPath();

            if (path == null || path.isBlank()) {
                return null;
            }

            String key = path.startsWith("/") ? path.substring(1) : path;
            String normalizedDirectory = normalizeDirectory(expectedRootDirectory);

            return key.startsWith(normalizedDirectory + "/") ? key : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
