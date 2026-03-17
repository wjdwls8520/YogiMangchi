export default function TermsContent() {
  return (
    <div className="space-y-8 text-sm leading-relaxed text-gray-600 dark:text-gray-300 break-keep">
      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 1 조 (목적)</h3>
        <p>
          본 약관은 "여기망치"(이하 "회사")가 제공하는 모의투자 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 2 조 (가상 재화 및 모의투자)</h3>
        <ul className="list-inside list-disc space-y-1.5 ml-1">
          <li>본 서비스에서 지급되는 초기 투자금 및 거래를 통해 발생한 모든 수익금(사이버 머니)은 실제 화폐가 아닌 가상의 데이터입니다.</li>
          <li>가상의 투자금은 어떠한 경우에도 실제 현금으로 환전되거나 외부 계좌로 출금될 수 없습니다.</li>
          <li>본 서비스 내의 주식 시세는 실제 시장 데이터를 기반으로 제공되나, 시스템 처리 속도 및 네트워크 환경에 따라 실제 시장 시세와 오차 또는 지연이 발생할 수 있습니다.</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 3 조 (회사의 면책)</h3>
        <p>
          회사는 본 서비스에서 제공하는 정보, 시세, 또는 모의투자 결과를 바탕으로 회원이 실제 금융 시장에서 행한 투자 판단 및 결과에 대해 어떠한 법적 책임도 지지 않습니다. 모든 실제 투자의 최종 판단과 손실에 대한 책임은 회원 본인에게 있습니다.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 4 조 (회원의 의무 및 부정이용 금지)</h3>
        <p>
          회원은 매크로 프로그램 사용, 시스템 버그 악용, 비정상적인 패킷 변조 등을 통해 모의투자 수익률을 부당하게 조작하거나 시스템에 과부하를 주는 행위를 하여서는 안 됩니다. 부정이용 적발 시 회사는 사전 통보 없이 해당 계정의 이용을 영구 정지하고 랭킹 기록을 삭제할 수 있습니다.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">제 5 조 (서비스의 변경 및 중지)</h3>
        <p>
          회사는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스를 변경하거나 중지할 수 있으며, 이 경우 사전에 공지합니다. 단, 사전에 통지할 수 없는 부득이한 사유가 있는 경우 사후에 통지할 수 있으며, 이로 인해 발생한 가상 재화의 손실에 대해서는 보상하지 않습니다.
        </p>
      </section>

      <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
        <p>공고일자: 2026년 3월 16일</p>
        <p>시행일자: 2026년 3월 16일</p>
      </div>
    </div>
  );
}