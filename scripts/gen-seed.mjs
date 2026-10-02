/* يحزم src/lib/seedMain.ts عبر esbuild ثم يشغّله لإنتاج بذور الثيمات */
import * as esbuild from 'esbuild';
import { execSync } from 'node:child_process';

await esbuild.build({
  entryPoints: ['src/lib/seedMain.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'scripts/.seed-build.mjs',
  logLevel: 'warning',
});
execSync('node scripts/.seed-build.mjs', { stdio: 'inherit' });
