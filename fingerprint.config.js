const { SourceSkips } = require('@expo/fingerprint');

/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  sourceSkips:
    SourceSkips.ExpoConfigVersions |
    SourceSkips.PackageJsonScriptsAll |
    SourceSkips.ExpoConfigExtraSection |
    SourceSkips.ExpoConfigNames |
    SourceSkips.ExpoConfigAndroidPackage |
    SourceSkips.ExpoConfigIosBundleIdentifier |
    SourceSkips.ExpoConfigSchemes,
  ignorePaths: [
    '**/update-version.json',
  ],
};
