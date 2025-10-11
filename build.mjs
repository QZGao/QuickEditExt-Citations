import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/main.js'],
  outfile: 'dist/bundled.js',
  bundle: true,
  format: 'iife',
  charset: 'utf8',
  target: ['es2017'],
  minify: false,
  sourcemap: false,
  banner: { js: `/* Documentation: [[User:SuperGrey/gadgets/QuickEditExt-Citations]] */

/* <nowiki> */` },
  footer: { js: '/* </nowiki> */' },
  logLevel: 'info'
};

(async () => {
  try {
    if (watch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('[QuickEditExt-Citations build] Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('[QuickEditExt-Citations build] Build complete');
    }
  } catch (e) {
    console.error('[QuickEditExt-Citations build] Build failed:', e);
    process.exit(1);
  }
})();