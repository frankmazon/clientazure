export const normalizeDocumentList = (value: unknown): string[] => {
  if (typeof value === 'string') {
    try { return normalizeDocumentList(JSON.parse(value)); }
    catch { return value.split(/[,;\n]/).map(item => item.trim().toLowerCase().replace(/[_\s]+/g, '-')).filter(Boolean); }
  }
  return Array.isArray(value)
    ? value.flatMap(item => typeof item === 'string' ? item.trim().toLowerCase().replace(/[_\s]+/g, '-') : []).filter(Boolean)
    : [];
};

// Match the client portal: pending and rejected uploads remain outstanding.
export const getOutstandingDocuments = (
  required: string[], approved: string[], waived: string[],
): string[] => required.filter(document => !approved.includes(document) && !waived.includes(document));

export const normalizeChecklistStatus = (value: unknown): 'Approved' | 'Rejected' | 'Pending' | 'Missing' => {
  const status = String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
  if (['approved', 'verified', 'complete', 'completed'].includes(status)) return 'Approved';
  if (['rejected', 'declined', 'failed'].includes(status)) return 'Rejected';
  if (!status || ['missing', 'not-uploaded'].includes(status)) return 'Missing';
  return 'Pending';
};

// These are the client portal's answer-based requirements, shared by every view.
export const getRequiredDocumentValues = (client?: object | null): string[] => {
  if (!client) return [];
  const record = client as Record<string, unknown>;
  const field = (name: string): string => {
    const pascal = name[0].toUpperCase() + name.slice(1);
    const snake = name.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return String(record[name] ?? record[pascal] ?? record[snake] ?? '').trim().toLowerCase();
  };
  const transaction = field('transactionType').replace(/[^a-z0-9]/g, '');
  const full = ['full', 'fulldoc'].includes(transaction);
  const alt = ['alt', 'altdoc'].includes(transaction);
  const source = (field('source') || field('leadType')).replace(/[^a-z0-9]/g, '');
  const simplified = ['directclient', 'referral', 'referrer'].includes(source);
  const identity = ['id', 'passport'];
  const property = ['last-6-months-mortgage-statements', 'council-rates-notice'];
  const alternative = ['bas-from-ato-portal', 'business-banking-statements'];
  const financial = ['management-reports-financial-statements'];
  const employment = ['group-certificate-payment-summary'];
  const tax = ['company-tax-returns', 'individual-tax-returns'];
  const payslips = field('isSelfEmployed') === 'no' ? ['payslip'] : [];
  if (!simplified) return [...new Set([
    ...(full ? ['payslip', ...financial, ...employment, ...tax, ...identity, ...property]
      : alt ? [...alternative, ...identity, ...property] : []),
    ...payslips,
  ])];
  const documents = [...identity, ...payslips];
  if (field('hasProperty') === 'yes') documents.push(...property);
  if (full) {
    documents.push(...financial);
    if (field('isSelfEmployed') !== 'yes') documents.push(...employment);
  } else if (field('isSelfEmployed') === 'yes') documents.push(...alternative);
  if (field('hasTaxReturn') === 'yes') {
    const borrower = field('borrowerType');
    documents.push(...(borrower === 'business' ? [tax[0]] : borrower === 'personal' ? [tax[1]] : tax));
  }
  return [...new Set(documents)];
};
