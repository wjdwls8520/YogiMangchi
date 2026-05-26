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

  if (!Number.isFinite(numValue)) {
    return fallback;
  }

  const absoluteValue = Math.abs(numValue);
  const maximumFractionDigits =
    absoluteValue > 0 && absoluteValue < 1
      ? smallMaxFractionDigits
      : standardMaxFractionDigits;

  if (absoluteValue > 0) {
    const minimumDisplayValue = 10 ** -maximumFractionDigits;

    if (absoluteValue < minimumDisplayValue) {
      const minimumDisplayText = minimumDisplayValue.toLocaleString(locale, {
        minimumFractionDigits: maximumFractionDigits,
        maximumFractionDigits,
      });

      return `${numValue < 0 ? "-" : ""}<${minimumDisplayText}`;
    }
  }

  return numValue.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};

export const formatSignedAssetNumber = (
  value?: number | null,
  options?: FormatAssetNumberOptions
) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return options?.fallback ?? DEFAULT_OPTIONS.fallback;
  }

  return `${value > 0 ? "+" : ""}${formatAssetNumber(value, options)}`;
};

export const formatNumber = formatAssetNumber;
export const formatSignedNumber = formatSignedAssetNumber;

export const formatSignedPercent = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "0%";
  }

  const absValue = Math.abs(value);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";

  if (absValue === 0) return "0%";

  if (absValue < 0.01) {
    return `${sign}<0.01%`;
  }

  return `${sign}${absValue.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};
