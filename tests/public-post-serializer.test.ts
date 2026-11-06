import assert from 'node:assert/strict';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));
const { publicPost } = await import('../src/lib/shared.ts');

const input = {
  id: 'post-1',
  author_id: 'user-internal',
  author_email: 'owner@example.invalid',
  avatar_key: 'avatar/user.webp?v=123',
  is_admin: true,
  cover_key: 'cover/user.webp',
  pen_name: 'pena',
  city: 'Nusantara',
  content: '<b>isi</b>',
};

const output = publicPost(input, 'owner@example.invalid');

assert.equal(output.id, 'post-1');
assert.equal(output.pen_name, 'pena');
assert.equal(output.avatar_url, '/media/avatar/user.webp?v=123');
assert.equal(Object.hasOwn(output, 'is_verified'), false);
for (const key of ['author_id', 'author_email', 'avatar_key', 'is_admin']) {
  assert.equal(Object.hasOwn(output, key), false, `field internal bocor: ${key}`);
}
assert.equal(input.avatar_key, 'avatar/user.webp?v=123', 'serializer tidak boleh memutasi row DB');
const user = (await import('../src/lib/shared.ts')).publicUser({ id: 'u1', email: 'x@example.invalid', avatar_key: 'avatar/u.webp', cover_key: 'cover/u.webp', is_admin: true, pen_name: 'pena' });
assert.equal(user.avatar_url, '/media/avatar/u.webp');
assert.equal(user.cover_url, '/media/cover/u.webp');
for (const key of ['id', 'email', 'avatar_key', 'cover_key', 'is_admin']) assert.equal(Object.hasOwn(user, key), false, `user field internal bocor: ${key}`);
const alreadyPublic = (await import('../src/lib/shared.ts')).publicUser({ pen_name: 'pena', avatar_url: '/media/avatar/u.webp?v=9', cover_url: '/media/cover/u.webp?v=9' });
assert.equal(alreadyPublic.avatar_url, '/media/avatar/u.webp?v=9');
assert.equal(alreadyPublic.cover_url, '/media/cover/u.webp?v=9');
console.log('OK — public post serializer strips internal fields and exposes final avatar URL');
