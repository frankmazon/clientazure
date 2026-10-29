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
