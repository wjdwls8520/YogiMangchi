export default function PrivacyContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300 break-keep">
      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 1 조 (수집하는 개인정보 항목)</h3>
        <p className="mb-2">회사는 회원가입, 원활한 고객상담, 서비스 제공을 위해 아래와 같은 최소한의 개인정보를 수집하고 있습니다.</p>
        <ul className="list-inside list-disc space-y-1.5 ml-1">
          <li><strong>필수항목:</strong> 소셜 로그인 식별값(카카오/구글 고유 ID), 서비스 내 닉네임, 투자 성향 데이터</li>
          <li><strong>자동수집항목:</strong> 서비스 이용기록, 접속 로그, 쿠키, 접속 IP 정보 등</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 2 조 (개인정보의 수집 및 이용 목적)</h3>
        <p className="mb-2">수집한 개인정보는 다음의 목적을 위해 활용됩니다.</p>
        <ul className="list-inside list-disc space-y-1.5 ml-1">
          <li><strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정이용 방지와 비인가 사용 방지</li>
          <li><strong>서비스 제공:</strong> 맞춤형 모의투자 환경 제공, 랭킹 시스템 운영, 포트폴리오 분석 결과 제공</li>
          <li><strong>서비스 개선:</strong> 신규 서비스 개발 및 통계학적 특성에 따른 맞춤형 기능 제공</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 3 조 (개인정보의 보유 및 이용 기간)</h3>
        <p>
          원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 회원 탈퇴 시 부정이용 방지를 위해 탈퇴일로부터 30일간 소셜 식별값을 보관하며, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 4 조 (이용자의 권리와 행사 방법)</h3>
        <p>
          이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 가입 해지(회원 탈퇴)를 요청할 수 있습니다. 개인정보 조회, 수정, 탈퇴는 '마이페이지' 기능 통하여 직접 진행하시거나 개인정보관리책임자에게 서면, 전화 또는 이메일로 연락하시면 지체 없이 조치하겠습니다.
        </p>
      </section>

      <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
        <p>공고일자: 2026년 3월 16일</p>
        <p>시행일자: 2026년 3월 16일</p>
      </div>
    </div>
  );
}