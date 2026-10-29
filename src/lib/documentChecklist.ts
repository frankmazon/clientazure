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
