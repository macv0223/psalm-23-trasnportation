import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cms/oauth/worker.mjs';
const env={CMS_ORIGIN:'https://example.com',AUTH_ORIGIN:'https://psalm23.example.workers.dev',REPOSITORY:'owner/repo',PRIVATE_REPOSITORY:'false',GITHUB_CLIENT_ID:'client-id',GITHUB_CLIENT_SECRET:'client-secret',SESSION_SECRET:'a-32-or-more-character-random-secret-for-tests',ALLOWED_USERS:'editor1',ALLOWED_ADMIN_EMAILS:''};
test('auth endpoint denies unconfigured deployments',async()=>{
  const r=await worker.fetch(new Request(env.AUTH_ORIGIN+'/auth'),{...env,GITHUB_CLIENT_SECRET:''});
  assert.equal(r.status,503);
  assert.equal(r.headers.get('Cache-Control'),'no-store');
});
test('auth request sets a signed secure cookie and redirects to GitHub OAuth',async()=>{
  const r=await worker.fetch(new Request(env.AUTH_ORIGIN+'/auth?provider=github'),env);
  assert.equal(r.status,302);
  assert.ok(r.headers.get('Set-Cookie').includes('HttpOnly; Secure; SameSite=Lax'));
  const target=new URL(r.headers.get('Location'));
  assert.equal(target.hostname,'github.com');
  assert.equal(target.searchParams.get('redirect_uri'),env.AUTH_ORIGIN+'/callback');
  assert.equal(target.searchParams.get('code_challenge_method'),'S256');
  assert.equal(target.searchParams.get('scope'),'public_repo');
  assert.ok(target.searchParams.get('state'));
});
test('auth endpoint rejects unknown providers',async()=>{
  const r=await worker.fetch(new Request(env.AUTH_ORIGIN+'/auth?provider=unknown'),env);
  assert.equal(r.status,400);
});
test('callback rejects a session that has no matching state',async()=>{
  const start=await worker.fetch(new Request(env.AUTH_ORIGIN+'/auth'),env);
  const session=start.headers.get('Set-Cookie').split(';')[0];
  const r=await worker.fetch(new Request(env.AUTH_ORIGIN+'/callback?state=incorrect&code=abc',{headers:{Cookie:session}}),env);
  assert.equal(r.status,403);
  assert.match(await r.text(),/verification failed/i);
});
test('worker refuses authentication through an unexpected hostname or HTTP method',async()=>{
  const wrongHost=await worker.fetch(new Request('https://another.workers.dev/auth'),env);
  assert.equal(wrongHost.status,400);
  const post=await worker.fetch(new Request(env.AUTH_ORIGIN+'/auth',{method:'POST'}),env);
  assert.equal(post.status,405);
});
test('missing allowlist blocks all sign-ins',async()=>{
  const r=await worker.fetch(new Request(env.AUTH_ORIGIN+'/auth'),{...env,ALLOWED_USERS:'',ALLOWED_ADMIN_EMAILS:''});
  assert.equal(r.status,503);
});
