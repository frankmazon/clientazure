import { readFileSync } from 'node:fs';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/portalSession.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } });
const { readPortalSession, savePortalSession, clearPortalSession } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
let values, tabValues;
beforeEach(() => {
  values = new Map();
  tabValues = new Map();
  const storage = map => ({ getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) });
  globalThis.localStorage = storage(values);
  globalThis.sessionStorage = storage(tabValues);
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
  assert.equal(values.get('sbr.portalSession.v1'), 'null');
});
test('updating password requirement does not extend session lifetime', () => {
  const expiration = Date.now() + 10000;
  savePortalSession(account, 'token', true, expiration);
  savePortalSession(account, 'token', false, readPortalSession().expiresAt);
  assert.equal(readPortalSession().expiresAt, expiration);
  assert.equal(readPortalSession().mustChangePassword, false);
});
test('disabled storage does not crash login', () => {
  globalThis.localStorage = globalThis.sessionStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => savePortalSession(account, '', false));
  assert.equal(readPortalSession(), null);
});

test('a new tab restores the shared login without tab storage', () => {
  savePortalSession(account, 'token', false);
  globalThis.sessionStorage = { getItem: () => null, removeItem: () => {} };
  assert.equal(readPortalSession().account.id, 7);
});
test('migrates an existing tab session without extending its expiry', () => {
  const expiry = Date.now() + 5000;
  tabValues.set('sbr.portalSession.v1', JSON.stringify({account,chatToken:'token',mustChangePassword:false,expiresAt:expiry}));
  assert.equal(readPortalSession().expiresAt, expiry);
  assert.ok(values.has('sbr.portalSession.v1'));
  assert.equal(tabValues.size, 0);
});
test('logout does not resurrect a legacy session from another tab', () => {
  savePortalSession(account, 'token', false);
  const old = values.get('sbr.portalSession.v1');
  clearPortalSession();
  tabValues.set('sbr.portalSession.v1', old);
  assert.equal(readPortalSession(), null);
});
