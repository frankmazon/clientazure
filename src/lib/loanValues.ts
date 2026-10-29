export const parseAmount = (value: unknown): number | null => {
  if (value == null || String(value).trim() === '') return null;
  const amount = Number(String(value).replace(/[$,\s]/g, ''));
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

export const formatCurrency = (value: unknown): string => {
  const amount = parseAmount(value);
  return amount === null ? '—' : new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD', minimumFractionDigits: 2,
  }).format(amount);
};

export const calculateLvr = (loanAmount: unknown, securityValue: unknown): string => {
  const loan = parseAmount(loanAmount);
  const security = parseAmount(securityValue);
  return loan === null || security === null || security <= 0
    ? '' : ((loan / security) * 100).toFixed(2);
};

export const formatLvr = (loanAmount: unknown, securityValue: unknown): string => {
  const lvr = calculateLvr(loanAmount, securityValue);
  return lvr === '' ? '—' : `${lvr}%`;
};
