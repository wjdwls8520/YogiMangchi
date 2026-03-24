package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.member.dto.request.UpdateMyProfileDto;
import com.yogimangchi.domain.member.dto.response.MemberProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.MyProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.NicknameDuplicationDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.member.repository.OAuthAccountRepository;
import com.yogimangchi.global.s3.service.S3Service;
import com.yogimangchi.global.s3.service.S3UploadResult;
import com.yogimangchi.global.validator.NicknameValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MemberService {

    private static final String MEMBER_PROFILE_IMAGE_DIRECTORY = "member/profile";
    private static final long PROFILE_IMAGE_MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final int PROFILE_IMG_URL_MAX_LENGTH = 1000;
    private static final int PROFILE_MSG_MAX_LENGTH = 255;

    private final OAuthAccountRepository oAuthAccountRepository;
    private final MemberRepository memberRepository;
    private final S3Service s3Service;

    @Transactional(readOnly = true)
    public NicknameDuplicationDto isAvailableNickname(String nickname) {
        // 닉네임이 존재하지 않으면 true 존재하면 false를 리턴
        return new NicknameDuplicationDto(!memberRepository.existsByNickname(nickname));
    }

    @Transactional(readOnly = true)
    public MyProfileInfoDto getMyProfile(Long memberId) {

        MyProfileInfoDto myProfileInfo = oAuthAccountRepository.findMyProfileInfo(memberId);

        return myProfileInfo;
    }

    @Transactional(readOnly = true)
    public MemberProfileInfoDto getMemberProfile(Long memberId) {
        Member member = memberRepository.findById(memberId).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        MemberProfileInfoDto memberProfileInfo = new MemberProfileInfoDto(
                member.getId(),
                member.getNickname(),
                member.getProfileImgUrl(),
                member.getProfileMsg(),
                member.getBestCount(),
                member.getFollowerCount(),
                member.getFollowingCount()
        );

        return memberProfileInfo;
    }

    @Transactional
    public MyProfileInfoDto updateMyProfile(Long memberId, UpdateMyProfileDto request) {
        if (memberId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        if (request == null) {
            throw new IllegalArgumentException("수정할 프로필 정보가 필요합니다.");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        boolean hasNicknameUpdate = request.getNickname() != null;
        boolean hasProfileImageUpdate = hasProfileImage(request.getProfileImage());
        boolean hasProfileMsgUpdate = request.getProfileMsg() != null;

        if (!hasNicknameUpdate && !hasProfileImageUpdate && !hasProfileMsgUpdate) {
            throw new IllegalArgumentException("수정할 프로필 정보가 없습니다.");
        }

        String nextNickname = member.getNickname();
        if (hasNicknameUpdate) {
            nextNickname = request.getNickname();
            NicknameValidator.validate(nextNickname);

            if (memberRepository.existsByNicknameAndIdNot(nextNickname, memberId)) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
        }

        String nextProfileMsg = hasProfileMsgUpdate ? normalizeOptionalText(request.getProfileMsg()) : member.getProfileMsg();
        String previousProfileImgUrl = member.getProfileImgUrl();

        validateLength(nextProfileMsg, PROFILE_MSG_MAX_LENGTH, "프로필 메시지는 255자 이하여야 합니다.");

        String nextProfileImgUrl = previousProfileImgUrl;
        if (hasProfileImageUpdate) {
            S3UploadResult uploadedProfileImage = s3Service.uploadImage(
                    request.getProfileImage(),
                    MEMBER_PROFILE_IMAGE_DIRECTORY,
                    PROFILE_IMAGE_MAX_FILE_SIZE
            );
            scheduleUploadedImageRollbackCleanup(uploadedProfileImage.key());
            nextProfileImgUrl = uploadedProfileImage.url();
            validateLength(nextProfileImgUrl, PROFILE_IMG_URL_MAX_LENGTH, "프로필 이미지 경로는 1000자 이하여야 합니다.");
        }

        member.updateBasicProfile(nextNickname, nextProfileImgUrl, nextProfileMsg);

        MyProfileInfoDto updatedProfile = oAuthAccountRepository.findMyProfileInfo(memberId);

        if (hasProfileImageUpdate) {
            scheduleOldProfileImageDeletion(previousProfileImgUrl, nextProfileImgUrl);
        }

        return updatedProfile;
    }

    private boolean hasProfileImage(MultipartFile profileImage) {
        return profileImage != null && !profileImage.isEmpty();
    }

    private String normalizeOptionalText(String value) {
        if (value == null) {
            return null;
        }

        String trimmedValue = value.trim();
        return trimmedValue.isEmpty() ? null : trimmedValue;
    }

    private void validateLength(String value, int maxLength, String errorMessage) {
        if (value != null && value.length() > maxLength) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private void scheduleOldProfileImageDeletion(String previousProfileImgUrl, String nextProfileImgUrl) {
        if (previousProfileImgUrl == null || previousProfileImgUrl.equals(nextProfileImgUrl)) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                s3Service.deleteByUrlIfManaged(previousProfileImgUrl, MEMBER_PROFILE_IMAGE_DIRECTORY);
            }
        });
    }

    private void scheduleUploadedImageRollbackCleanup(String uploadedImageKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    s3Service.deleteByKey(uploadedImageKey);
                }
            }
        });
    }

}
