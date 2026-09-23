try {
  const pkgPath = require.resolve('react-native-document-picker/package.json');
  const pkg = require(pkgPath);
  console.log('RESOLVED:', pkgPath);
  console.log('VERSION:', pkg.version);
  const mod = require('react-native-document-picker');
  const def = mod && mod.default ? mod.default : mod;
  console.log('NAMED_EXPORTS:', Object.keys(mod).join(','));
  console.log('DEFAULT_METHODS:', def ? Object.keys(def).join(',') : 'none');
} catch (e) {
  console.log('ERROR:', e.message);
}
