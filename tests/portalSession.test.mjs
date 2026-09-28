import { readFileSync } from 'node:fs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/portalSession.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { readPortalSession, savePortalSession, clearPortalSession } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
let values;
beforeEach(() => {
  values = new Map();
  globalThis.sessionStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
});
const account = { id: 7, uniqueId: 'CL-7', role: 'client', name: 'Alice' };
test('restores identity, chat token and password-change requirement', () => {
  savePortalSession(account, 'signed-token', true);
  const saved = readPortalSession();
  assert.deepEqual(saved.account, account);
  assert.equal(saved.chatToken, 'signed-token');
  assert.equal(saved.mustChangePassword, true);
});
test('never saves password or uploaded data fields', () => {
  savePortalSession({ ...account, password: 'private', currentPassword: 'private', files: ['private'] }, '', false);
  assert.ok(![...values.values()][0].includes('private'));
});
test('logout removes saved session', () => {
  savePortalSession(account, '', false);
  clearPortalSession();
  assert.equal(readPortalSession(), null);
});
test('expired and malformed sessions are removed', () => {
  savePortalSession(account, '', false, Date.now() - 1);
  assert.equal(readPortalSession(), null);
  values.set('sbr.portalSession.v1', '{invalid');
  assert.equal(readPortalSession(), null);
  assert.equal(values.size, 0);
});
test('updating password requirement does not extend session lifetime', () => {
  const expiration = Date.now() + 10000;
  savePortalSession(account, 'token', true, expiration);
  savePortalSession(account, 'token', false, readPortalSession().expiresAt);
  assert.equal(readPortalSession().expiresAt, expiration);
  assert.equal(readPortalSession().mustChangePassword, false);
});
test('disabled storage does not crash login', () => {
  globalThis.sessionStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => savePortalSession(account, '', false));
  assert.equal(readPortalSession(), null);
});
