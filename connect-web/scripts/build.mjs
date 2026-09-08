import { mkdir, writeFile } from 'node:fs/promises';

const fingerprints = (process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (fingerprints.length === 0) {
  throw new Error('ANDROID_SHA256_CERT_FINGERPRINTS 환경변수가 필요합니다.');
}

const directory = new URL('../public/.well-known/', import.meta.url);
await mkdir(directory, { recursive: true });
await writeFile(
  new URL('assetlinks.json', directory),
  JSON.stringify([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.wishu.couplewish',
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ], null, 2),
);
