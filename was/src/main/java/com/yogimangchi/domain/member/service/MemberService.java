package com.yogimangchi.domain.member.service;

import com.yogimangchi.domain.member.dto.request.UpdateMyProfileDto;
import com.yogimangchi.domain.member.dto.request.UpdateVerifiedInfoRequestDto;
import com.yogimangchi.domain.member.dto.response.MemberProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.MyProfileInfoDto;
import com.yogimangchi.domain.member.dto.response.NicknameDuplicationDto;
import com.yogimangchi.domain.member.dto.response.VerifiedInfoResponseDto;
import com.yogimangchi.domain.member.entity.Member;
import com.yogimangchi.domain.member.entity.WithdrawnOAuthAccount;
import com.yogimangchi.domain.member.enums.MemberRole;
import com.yogimangchi.global.exception.member.MemberException;
import com.yogimangchi.domain.member.repository.MemberFollowRepository;
import com.yogimangchi.domain.member.repository.MemberRepository;
import com.yogimangchi.domain.member.repository.OAuthAccountRepository;
import com.yogimangchi.domain.member.repository.WithdrawnOAuthAccountRepository;
import com.yogimangchi.global.auth.jwt.service.RefreshTokenService;
import com.yogimangchi.global.s3.service.S3Service;
import com.yogimangchi.global.s3.service.S3UploadResult;
import com.yogimangchi.global.support.MemberReader;
import com.yogimangchi.global.validator.NicknameValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class MemberService {

    private static final String MEMBER_PROFILE_IMAGE_DIRECTORY = "member/profile";
    private static final long PROFILE_IMAGE_MAX_FILE_SIZE = 5L * 1024L * 1024L;
    private static final int PROFILE_IMG_URL_MAX_LENGTH = 1000;
    private static final int PROFILE_MSG_MAX_LENGTH = 255;
    private static final String RESET_PROFILE_IMAGE_TYPE = "reset";
    private static final String WITHDRAWN_PROFILE_IMAGE_PATH = "/images/profile/widthdrawn_profile.png";
    private static final String[] DEFAULT_PROFILE_IMAGE_PATHS = {
            "/images/profile/defaultProfile-green.png",
            "/images/profile/defaultProfile-blue.png",
            "/images/profile/defaultProfile-gray.png"
    };

    private final OAuthAccountRepository oAuthAccountRepository;
    private final MemberFollowRepository memberFollowRepository;
    private final MemberRepository memberRepository;
    private final WithdrawnOAuthAccountRepository withdrawnOAuthAccountRepository;
    private final RefreshTokenService refreshTokenService;
    private final MemberReader memberReader;
    private final S3Service s3Service;
    private final EmailVerificationService emailVerificationService;

    @Transactional(readOnly = true)
    public NicknameDuplicationDto isAvailableNickname(String nickname) {
        // 닉네임이 존재하지 않으면 true 존재하면 false를 리턴
        return new NicknameDuplicationDto(!memberRepository.existsByNickname(nickname));
    }

    @Transactional(readOnly = true)
    public MyProfileInfoDto getMyProfile(Long loginMemberId) {
        memberReader.getAuthenticated(loginMemberId);

        MyProfileInfoDto myProfileInfo = oAuthAccountRepository.findMyProfileInfo(loginMemberId);

        return myProfileInfo;
    }

    @Transactional(readOnly = true)
    public MemberProfileInfoDto getMemberProfile(Long loginMemberId, Long memberId) {
        Member member = memberReader.getFindMember(memberId);
        MemberProfileInfoDto memberProfileInfo = new MemberProfileInfoDto(
                member.getId(),
                member.getNickname(),
                member.getProfileImgUrl(),
                member.getProfileMsg(),
                member.getBestCount(),
                member.getFollowerCount(),
                member.getFollowingCount(),
                isFollowedByLoginMember(loginMemberId, memberId),
                isFollowingLoginMember(loginMemberId, memberId)
        );

        return memberProfileInfo;
    }

    @Transactional
    public MyProfileInfoDto updateMyProfile(Long loginMemberId, UpdateMyProfileDto request) {
        if (loginMemberId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        if (request == null) {
            throw new IllegalArgumentException("수정할 프로필 정보가 필요합니다.");
        }

        Member member = memberReader.getAuthenticated(loginMemberId);

        String profileImageType = normalizeOptionalText(request.getType());
        boolean hasNicknameUpdate = request.getNickname() != null;
        boolean hasProfileImageUpdate = hasProfileImage(request.getProfileImage());
        boolean hasProfileImageReset = isResetProfileImageType(profileImageType);
        boolean hasProfileMsgUpdate = request.getProfileMsg() != null;

        validateProfileImageRequest(hasProfileImageUpdate, profileImageType, hasProfileImageReset);

        if (!hasNicknameUpdate && !hasProfileImageUpdate && !hasProfileImageReset && !hasProfileMsgUpdate) {
            throw new IllegalArgumentException("수정할 프로필 정보가 없습니다.");
        }

        String currentNickname = member.getNickname();
        String nextNickname = currentNickname;
        boolean nicknameChanged = false;
        if (hasNicknameUpdate) {
            nextNickname = request.getNickname();
            NicknameValidator.validate(nextNickname);
            nicknameChanged = !currentNickname.equals(nextNickname);
            validateAvailableNicknameForUpdate(loginMemberId, nextNickname, nicknameChanged);
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
        } else if (hasProfileImageReset) {
            nextProfileImgUrl = pickRandomDefaultProfileImageUrl();
            validateLength(nextProfileImgUrl, PROFILE_IMG_URL_MAX_LENGTH, "프로필 이미지 경로는 1000자 이하여야 합니다.");
        }

        member.updateBasicProfile(nextNickname, nextProfileImgUrl, nextProfileMsg);
        flushMemberProfileChangeIfNeeded(nicknameChanged);

        MyProfileInfoDto updatedProfile = oAuthAccountRepository.findMyProfileInfo(loginMemberId);

        if (hasProfileImageUpdate || hasProfileImageReset) {
            scheduleOldProfileImageDeletion(previousProfileImgUrl, nextProfileImgUrl);
        }

        return updatedProfile;
    }

    @Transactional
    public void updateVerifiedInfo(Long loginMemberId, UpdateVerifiedInfoRequestDto request) {
        Member member = memberReader.getAuthenticated(loginMemberId);

        if (member.getRole() != MemberRole.VERIFIED_USER) {
            throw MemberException.notVerifiedUser();
        }

        member.updateVerifiedInfo(
                request.phoneNumber(),
                request.addressCode(),
                request.address1(),
                request.address2()
        );
    }

    @Transactional
    public void withdrawMember(Long loginMemberId) {
        Member member = memberReader.getAuthenticated(loginMemberId);
        String profileImgUrl = member.getProfileImgUrl();
        archiveAndDeleteOAuthAccount(loginMemberId);

        memberRepository.decreaseFollowerCountForWithdraw(loginMemberId);
        memberRepository.decreaseFollowingCountForWithdraw(loginMemberId);
        memberFollowRepository.deleteAllByMemberId(loginMemberId);
        member.withdraw(createWithdrawnNickname(loginMemberId), getWithdrawnProfileImageUrl());
        scheduleRefreshTokenRemoval(loginMemberId);
        scheduleWithdrawnProfileImageDeletion(profileImgUrl);
        emailVerificationService.deleteEmailVerificationKeys(loginMemberId);
    }

    private boolean hasProfileImage(MultipartFile profileImage) {
        return profileImage != null && !profileImage.isEmpty();
    }

    private boolean isResetProfileImageType(String type) {
        return RESET_PROFILE_IMAGE_TYPE.equalsIgnoreCase(type);
    }

    private void validateAvailableNicknameForUpdate(Long loginMemberId, String nickname, boolean nicknameChanged) {
        if (!nicknameChanged) {
            return;
        }

        memberRepository.lockNickname(nickname);
        if (memberRepository.existsByNicknameAndIdNot(nickname, loginMemberId)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
    }

    private void flushMemberProfileChangeIfNeeded(boolean nicknameChanged) {
        if (!nicknameChanged) {
            return;
        }

        try {
            memberRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }
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

    private void validateProfileImageRequest(boolean hasProfileImageUpdate, String profileImageType, boolean hasProfileImageReset) {
        if (hasProfileImageUpdate && profileImageType != null) {
            throw new IllegalArgumentException("프로필 이미지 파일과 type은 동시에 요청할 수 없습니다.");
        }

        if (profileImageType != null && !hasProfileImageReset) {
            throw new IllegalArgumentException("type 은 reset 또는 null 만 가능합니다.");
        }
    }

    private boolean isFollowedByLoginMember(Long loginMemberId, Long memberId) {
        if (loginMemberId == null) {
            return false;
        }

        return memberFollowRepository.existsByFollower_IdAndFollowing_Id(loginMemberId, memberId);
    }

    private boolean isFollowingLoginMember(Long loginMemberId, Long memberId) {
        if (loginMemberId == null) {
            return false;
        }

        return memberFollowRepository.existsByFollower_IdAndFollowing_Id(memberId, loginMemberId);
    }

    private String pickRandomDefaultProfileImageUrl() {
        String path = DEFAULT_PROFILE_IMAGE_PATHS[ThreadLocalRandom.current().nextInt(DEFAULT_PROFILE_IMAGE_PATHS.length)];

        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(path)
                    .toUriString();
        } catch (IllegalStateException e) {
            return path;
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

    private void scheduleRefreshTokenRemoval(Long memberId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            refreshTokenService.removeRefreshToken(memberId);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                refreshTokenService.removeRefreshToken(memberId);
            }
        });
    }

    private void scheduleWithdrawnProfileImageDeletion(String profileImgUrl) {
        if (profileImgUrl == null || profileImgUrl.isBlank()) {
            return;
        }

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            s3Service.deleteByUrlIfManaged(profileImgUrl, MEMBER_PROFILE_IMAGE_DIRECTORY);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                s3Service.deleteByUrlIfManaged(profileImgUrl, MEMBER_PROFILE_IMAGE_DIRECTORY);
            }
        });
    }

    private void archiveAndDeleteOAuthAccount(Long memberId) {
        oAuthAccountRepository.findByMember_Id(memberId)
                .ifPresent(oAuthAccount -> {
                    WithdrawnOAuthAccount withdrawnOAuthAccount = WithdrawnOAuthAccount.from(oAuthAccount);
                    withdrawnOAuthAccountRepository.save(withdrawnOAuthAccount);
                    oAuthAccountRepository.delete(oAuthAccount);
                });
    }

    private String createWithdrawnNickname(Long memberId) {
        return "withdrawn_" + memberId;
    }

    private String getWithdrawnProfileImageUrl() {
        try {
            return ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path(WITHDRAWN_PROFILE_IMAGE_PATH)
                    .toUriString();
        } catch (IllegalStateException e) {
            return WITHDRAWN_PROFILE_IMAGE_PATH;
        }
    }

    @Transactional(readOnly = true)
    public VerifiedInfoResponseDto getVerifiedInfo(Long loginMemberId) {
        Member member = memberReader.getAuthenticated(loginMemberId);

        if (!MemberRole.VERIFIED_USER.equals(member.getRole()) && !MemberRole.ADMIN.equals(member.getRole())) {
            throw MemberException.notVerifiedUser();
        }

        return new VerifiedInfoResponseDto(
                member.getPhoneNumber(),
                member.getAddressCode(),
                member.getAddress1(),
                member.getAddress2()
        );
    }
}
