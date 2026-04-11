import type {
  ContestListCardType,
  ContestListItem,
  ContestMetricTone,
} from "./types";

type ContestListCardProps = {
  contest: ContestListItem;
  type: ContestListCardType;
  onAction?: (contest: ContestListItem) => void;
  isActionLoading?: boolean;
};

const getCardAccent = (type: ContestListCardType) => {
  if (type === "reject") {
    return "bg-rose-50 text-rose-500";
  }

  if (type === "past") {
    return "bg-amber-50 text-amber-600";
  }

  if (type === "approved") {
    return "bg-blue-50 text-blue-600";
  }

  return "bg-gray-50 text-gray-400";
};

const getCardAccentLabel = (type: ContestListCardType) => {
  if (type === "apply") {
    return "신청";
  }

  if (type === "wait") {
    return "대기";
  }

  if (type === "approved") {
    return "승인";
  }

  if (type === "past") {
    return "종료";
  }

  return "반려";
};

const getActionLabel = (type: ContestListCardType) => {
  if (type === "apply") {
    return "참가 신청하기";
  }

  if (type === "wait") {
    return "승인 완료 (대기중)";
  }

  if (type === "approved") {
    return "승인 완료";
  }

  if (type === "past") {
    return "결과 다시 보기";
  }

  return "사유 확인 및 재신청";
};

const getActionClassName = (type: ContestListCardType) => {
  if (type === "apply") {
    return "bg-gray-900 text-white hover:bg-black";
  }

  if (type === "wait") {
    return "bg-blue-50 text-blue-600";
  }

  if (type === "approved") {
    return "bg-blue-50 text-blue-600";
  }

  if (type === "past") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-rose-600 text-white";
};

export default function ContestListCard({
  contest,
  type,
  onAction,
  isActionLoading = false,
}: ContestListCardProps) {
  const primaryMetricLabel = contest.metricPrimaryLabel ?? "최종 순위";
  const primaryMetricValue =
    contest.metricPrimaryValue ??
    (typeof contest.myRank === "number" ? `${contest.myRank}위` : "-");

  const secondaryMetricLabel = contest.metricSecondaryLabel ?? "최종 수익률";
  const secondaryMetricValue =
    contest.metricSecondaryValue ??
    (typeof contest.myYield === "number" ? `${contest.myYield}%` : "-");

  const metricTone =
    contest.metricSecondaryTone ??
    (typeof contest.myYield === "number"
      ? contest.myYield > 0
        ? "positive"
        : contest.myYield < 0
          ? "negative"
          : "neutral"
      : "neutral");

  const secondaryMetricToneClass =
    ({
      positive: "text-red-500",
      negative: "text-blue-500",
      neutral: "text-gray-900",
    } satisfies Record<ContestMetricTone, string>)[metricTone];

  const actionLabel = isActionLoading
    ? "처리 중..."
    : contest.actionLabel ?? getActionLabel(type);
  const isActionDisabled =
    isActionLoading || contest.actionDisabled === true || !onAction;

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <h4 className="min-w-0 flex-1 truncate pr-4 font-black text-gray-800">
          {contest.title}
        </h4>
        <div
          className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-[11px] font-black tracking-tight ${getCardAccent(type)}`}
        >
          {contest.accentLabel ?? getCardAccentLabel(type)}
        </div>
      </div>

      <div className="mb-6 space-y-1">
        <p className="text-xs font-bold uppercase tracking-tighter text-gray-400">
          대회 기간
        </p>
        <p className="text-sm font-bold text-gray-600">{contest.period}</p>
      </div>

      {type === "reject" ? (
        <>
          <div className="mb-4 rounded-xl bg-rose-50 p-3">
            <p className="mb-1 text-[10px] font-black uppercase text-rose-400">
              반려 사유
            </p>
            <p className="text-xs font-bold text-rose-800">
              {contest.rejectReason ?? "-"}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-between text-xs font-bold text-gray-400">
            <span>{contest.summaryLeft ?? "-"}</span>
            <span>{contest.summaryRight ?? "-"}</span>
          </div>
        </>
      ) : type === "past" ? (
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-[10px] font-black uppercase text-gray-400">
              {primaryMetricLabel}
            </p>
            <p className="mt-1 text-xl font-black text-gray-900">{primaryMetricValue}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-[10px] font-black uppercase text-gray-400">
              {secondaryMetricLabel}
            </p>
            <p className={`mt-1 text-xl font-black ${secondaryMetricToneClass}`}>
              {secondaryMetricValue}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-center justify-between text-xs font-bold text-gray-400">
          <span>
            {contest.summaryLeft ??
              `참가자 ${
                typeof contest.participants === "number"
                  ? `${contest.participants}명`
                  : "-"
              }`}
          </span>
          <span>{contest.summaryRight ?? (contest.reward ? `상금 ${contest.reward}` : "-")}</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => onAction?.(contest)}
        disabled={isActionDisabled}
        className={`w-full rounded-xl py-3 text-xs font-black transition-all disabled:cursor-not-allowed disabled:opacity-60 ${getActionClassName(
          type
        )}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
