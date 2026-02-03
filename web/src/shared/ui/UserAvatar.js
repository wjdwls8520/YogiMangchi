import React, { useState } from 'react';
import DefaultProfileIcon from './DefaultProfileIcon';
import ModalOverlay from './ModalOverlay';
import './UserAvatar.css';

/**
 * 공통 사용자 아바타 컴포넌트
 * @param {string} username - 사용자 이름
 * @param {string} avatarUrl - 프로필 이미지 URL (선택)
 * @param {boolean} showFollowButton - 팔로우 버튼 표시 여부 (기본: false)
 * @param {function} onAvatarClick - 아바타 클릭 핸들러
 * @param {function} onFollowClick - 팔로우 버튼 클릭 핸들러 (커스텀)
 * @param {string} size - 아바타 크기 ('small': 32px, 'medium': 40px, 'large': 48px)
 */
const UserAvatar = ({
    username,
    avatarUrl,
    showFollowButton = false,
    onAvatarClick,
    onFollowClick,
    size = 'medium'
}) => {
    const [showFollowAlert, setShowFollowAlert] = useState(false);

    const handleAvatarClick = (e) => {
        e.stopPropagation();
        if (onAvatarClick) {
            onAvatarClick();
        } else {
            console.log('Go to profile:', username);
        }
    };

    const handleFollowButtonClick = (e) => {
        e.stopPropagation();
        if (onFollowClick) {
            onFollowClick();
        } else {
            // 기본 동작: 팔로우 얼럿 표시
            setShowFollowAlert(true);
        }
    };

    const handleFollow = () => {
        setShowFollowAlert(false);
        alert(`${username}님을 팔로우했습니다!`);
    };

    return (
        <>
            <div className={`userAvatarWrapper ${size}`}>
                <div className="userAvatar" onClick={handleAvatarClick}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={username} />
                    ) : (
                        <DefaultProfileIcon />
                    )}
                </div>

                {showFollowButton && (
                    <button
                        className="followBadge"
                        onClick={handleFollowButtonClick}
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                )}
            </div>

            {/* Follow Alert Modal */}
            {showFollowAlert && (
                <ModalOverlay isOpen={showFollowAlert} onClose={() => setShowFollowAlert(false)} high>
                    <div className="customAlertBox" onClick={e => e.stopPropagation()}>
                        <div className="alertAvatar">
                            <DefaultProfileIcon />
                        </div>
                        <h3 className="alertTitle">{username}님을 팔로우할까요?</h3>
                        <p className="alertMessage">
                            팔로우하면 이 유저의 활동 소식을<br />피드에서 바로 확인할 수 있어요.
                        </p>
                        <div className="alertButtons">
                            <button className="alertBtn cancel" onClick={() => setShowFollowAlert(false)}>
                                취소
                            </button>
                            <button className="alertBtn confirm" onClick={handleFollow}>
                                팔로우
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </>
    );
};

export default UserAvatar;
