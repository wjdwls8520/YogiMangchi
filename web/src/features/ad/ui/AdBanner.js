import React from 'react';
import Button from '../../../shared/ui/Button';
import './AdBanner.css';

const AdBanner = () => {
    return (
        <div className="adBanner">
            <div className="adContent">
                <div className="adLabel">Sponsored</div>
                <h2 className="adTitle">프리미엄 멤버십으로<br />더 스마트하게 투자하세요</h2>
                <p className="adDescription">
                    실시간 시세 무제한 조회와<br />
                    전문가 리포트를 지금 경험해보세요.
                </p>
                <Button variant="primary" size="md">자세히 보기</Button>
            </div>
            <div className="adImageContainer">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 2 9 12 21 22 9 18 3 6 3"></polygon><path d="M11 3 L7 9 L12 21 L17 9 L13 3"></path></svg>
            </div>
        </div>
    );
};

export default AdBanner;
