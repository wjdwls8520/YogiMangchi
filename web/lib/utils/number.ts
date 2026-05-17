type FormatAssetNumberOptions = {
  fallback?: string;
  standardMaxFractionDigits?: number;
  smallMaxFractionDigits?: number;
  locale?: string;
};

const DEFAULT_OPTIONS: Required<FormatAssetNumberOptions> = {
  fallback: "0",
  standardMaxFractionDigits: 2,
  smallMaxFractionDigits: 8,
  locale: "ko-KR",
};

export const formatAssetNumber = (
  value?: number | string | null,
  options?: FormatAssetNumberOptions
) => {
  const {
    fallback,
    standardMaxFractionDigits,
    smallMaxFractionDigits,
    locale,
  } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  if (value === null || value === undefined) {
    return fallback;
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (Number.isNaN(numValue)) {
    return fallback;
  }

  const absoluteValue = Math.abs(numValue);
  
  // 항상 더 높은 정밀도를 허용하도록 설정 (소수점 누락 방지)
  const maximumFractionDigits = Math.max(standardMaxFractionDigits, smallMaxFractionDigits);

  return numValue.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};

export const formatSignedAssetNumber = (
  value?: number | null,
  options?: FormatAssetNumberOptions
) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return options?.fallback ?? DEFAULT_OPTIONS.fallback;
  }

  return `${value > 0 ? "+" : ""}${formatAssetNumber(value, options)}`;
};

export const formatNumber = formatAssetNumber;
export const formatSignedNumber = formatSignedAssetNumber;

export const formatSignedPercent = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0.00%";
  }
  if (value === 0) {
    return "0.00%";
  }
  const absValue = Math.abs(value);
  if (absValue > 0 && absValue < 0.01) {
    return `${value > 0 ? "+" : ""}${value.toFixed(6)}%`;
  }
  if (absValue > 0 && absValue < 0.1) {
    return `${value > 0 ? "+" : ""}${value.toFixed(4)}%`;
  }
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};
