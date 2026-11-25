// Pins the Android CMake version for every native module.
// Why: on Windows, React Native's C++ object paths exceed 260 characters. CMake 3.31.6 from the
// Android SDK bundles ninja 1.12, which supports long paths (needs Windows LongPathsEnabled=1).
// Hooked from settings.gradle (gradle.beforeProject) so it runs before AGP reads the version.
const { withSettingsGradle } = require('expo/config-plugins');

const MARKER = '// readwell:cmake-version';

module.exports = function withCmakeVersion(config, version = '3.31.6') {
  return withSettingsGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy' || cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents += `
${MARKER}
gradle.beforeProject { project ->
  ['com.android.application', 'com.android.library'].each { id ->
    project.plugins.withId(id) {
      project.android.externalNativeBuild.cmake.version = "${version}"
    }
  }
}
`;
    return cfg;
  });
};
