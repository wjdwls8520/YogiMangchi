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
  value?: number | null,
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

  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  const absoluteValue = Math.abs(value);
  const maximumFractionDigits =
    absoluteValue > 0 && absoluteValue < 1
      ? smallMaxFractionDigits
      : standardMaxFractionDigits;

  return value.toLocaleString(locale, {
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
