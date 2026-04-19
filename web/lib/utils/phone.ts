export const formatPhoneNumber = (value: string) => {
  const numericValue = value.replace(/[^0-9]/g, "").slice(0, 11);

  if (numericValue.length <= 3) {
    return numericValue;
  }

  if (numericValue.length <= 7) {
    return `${numericValue.slice(0, 3)}-${numericValue.slice(3)}`;
  }

  return `${numericValue.slice(0, 3)}-${numericValue.slice(3, 7)}-${numericValue.slice(7)}`;
};

export const normalizePhoneNumber = (value: string) =>
  value.replace(/[^0-9]/g, "");
