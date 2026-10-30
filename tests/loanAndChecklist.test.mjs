import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
async function loadModule(name) {
  const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { formatCurrency, calculateLvr, formatLvr } = await loadModule('loanValues');
const { getOutstandingDocuments, normalizeDocumentList } = await loadModule('documentChecklist');

test('amounts display dollars, grouping and two decimal places', () => {
  assert.equal(formatCurrency('200000'), '$200,000.00');
  assert.equal(formatCurrency('$200,000.50'), '$200,000.50');
  assert.equal(formatCurrency(0), '$0.00');
  assert.equal(formatCurrency(null), '—');
  assert.equal(formatCurrency('invalid'), '—');
});
test('LVR derives from amounts, including zero loan and invalid security', () => {
  assert.equal(calculateLvr('200000', '250000'), '80.00');
  assert.equal(formatLvr('$200,000.00', '$250,000.00'), '80.00%');
  assert.equal(formatLvr(0, 250000), '0.00%');
  assert.equal(formatLvr(100000, 0), '—');
  assert.equal(formatLvr('', 250000), '—');
  assert.equal(formatLvr(-1, 250000), '—');
  assert.equal(formatLvr(1, 3), '33.33%');
});
test('pending, rejected and absent documents stay outstanding; approved or waived do not', () => {
  const required = ['id', 'passport', 'payslip', 'council-rates-notice', 'company-tax-returns'];
  assert.deepEqual(getOutstandingDocuments(required, ['id'], ['passport']), ['payslip', 'council-rates-notice', 'company-tax-returns']);
  assert.deepEqual(getOutstandingDocuments(required, required, ['passport']), []);
  assert.deepEqual(getOutstandingDocuments([], [], []), []);
});
test('waivers normalize both arrays and legacy JSON or comma-separated lists', () => {
  assert.deepEqual(normalizeDocumentList('["ID", "Council Rates Notice"]'), ['id', 'council-rates-notice']);
  assert.deepEqual(normalizeDocumentList('ID, Passport'), ['id', 'passport']);
  assert.deepEqual(normalizeDocumentList(undefined), []);
});

const { getRequiredDocumentValues, normalizeChecklistStatus } = await loadModule('documentChecklist');
test('direct-client and referral checklists depend on answers, not the legacy full-doc list', () => {
  for (const source of ['Direct Client', 'Referral']) {
    assert.deepEqual(getRequiredDocumentValues({source, transactionType: 'alt_doc', isSelfEmployed: 'No', hasProperty: 'No', hasTaxReturn: 'No'}), ['id', 'passport', 'payslip']);
    assert.deepEqual(getRequiredDocumentValues({source, transactionType: 'alt_doc', isSelfEmployed: 'Yes', hasProperty: 'Yes', hasTaxReturn: 'Yes', borrowerType: 'Business'}), ['id', 'passport', 'last-6-months-mortgage-statements', 'council-rates-notice', 'bas-from-ato-portal', 'business-banking-statements', 'company-tax-returns']);
    assert.deepEqual(getRequiredDocumentValues({source, transactionType: 'full_doc', isSelfEmployed: 'No', hasProperty: 'No', hasTaxReturn: 'Yes', borrowerType: 'Personal'}), ['id', 'passport', 'payslip', 'management-reports-financial-statements', 'group-certificate-payment-summary', 'individual-tax-returns']);
  }
});
test('legacy broker checklists remain available and aliases use the same rules', () => {
  assert.deepEqual(getRequiredDocumentValues({Source: 'Broker', TransactionType: 'alt doc'}), ['bas-from-ato-portal', 'business-banking-statements', 'id', 'passport', 'last-6-months-mortgage-statements', 'council-rates-notice']);
  assert.deepEqual(getRequiredDocumentValues({source: 'direct_client', transaction_type: 'alt_doc', is_self_employed: 'No'}), ['id', 'passport', 'payslip']);
});
test('all portals recognize approval and rejection aliases consistently', () => {
  for (const status of ['Verified', 'Approved', 'Complete', 'Completed']) assert.equal(normalizeChecklistStatus(status), 'Approved');
  for (const status of ['Rejected', 'Declined', 'Failed']) assert.equal(normalizeChecklistStatus(status), 'Rejected');
  assert.equal(normalizeChecklistStatus('Pending'), 'Pending');
  assert.equal(normalizeChecklistStatus(undefined), 'Missing');
});
test('submission email uses email login and contains no Client ID merge field', () => {
  const html = readFileSync(new URL('../docs/emails/ghl-client-submission.html', import.meta.url), 'utf8');
  assert.match(html, /{{contact\.email}}/);
  assert.doesNotMatch(html, /{{\s*contact\.(?:client_?id|unique_?id)\s*}}/i);
});
