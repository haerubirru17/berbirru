// Hook pengembang test: (1) resolve relative import tanpa ekstensi → .ts,
// (2) tandai nama type yang diimpor dengan `type ` agar strip-types Node tidak
// gagal menemukan export runtime. Hanya untuk pengujian lokal; tidak menyentuh build.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const TYPE_NAMES = new Set([
  'Env', 'KlikQrisEnv', 'QrisResult', 'QrisStatusResult', 'SweepCursor', 'JenisDokumen',
]);

export async function resolve(specifier, context, next) {
  try { return await next(specifier, context); }
  catch (e) {
    if (context.parentURL && (specifier.startsWith('./') || specifier.startsWith('../')) && !/\.[a-z]+$/.test(specifier)) {
      return next(specifier + '.ts', context);
    }
    throw e;
  }
}

export async function load(url, context, next) {
  if (url.startsWith('file:') && url.endsWith('.ts') && url.includes('/src/')) {
    const file = fileURLToPath(url);
    let source = (await next(url, { ...context, format: undefined })).source;
    source = String(source).replace(
      /import\s*\{([^}]*)\}\s*from\s*(['"][^'"]+['"])/g,
      (m, names, from) => {
        const rewritten = names.split(',').map((raw) => {
          const t = raw.trim(); if (!t) return raw;
          const mm = t.match(/^(?:type\s+)?([A-Za-z_$][\w$]*)(.*)$/);
          if (mm && TYPE_NAMES.has(mm[1]) && !/^type\s/.test(t)) return 'type ' + t;
          return raw;
        }).join(', ');
        return `import {${rewritten}} from ${from}`;
      },
    );
    return { format: 'module-typescript', source, shortCircuit: true };
  }
  return next(url, context);
}
