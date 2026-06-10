const packageJson = require('./package.json');

module.exports = ({ config }) => {
  const isProd = process.env.APP_ENV === 'production';

  const baseConfig = {
    ...config,
    name: "Ark Messenger",
    slug: "ark",
    version: packageJson.version,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.planeticlabs.ark",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.planeticlabs.ark",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      softwareKeyboardLayoutMode: "resize"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    updates: {
      url: "https://u.expo.dev/2f1240a1-b669-41d1-98b2-647a16cf399f",
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 3000
    },
    runtimeVersion: {
      policy: "fingerprint"
    },
    extra: {
      eas: {
        projectId: "2f1240a1-b669-41d1-98b2-647a16cf399f"
      },
      router: {}
    },
    scheme: "ark-messenger",
    plugins: [
      "expo-router",
      "expo-font",
      "expo-video",
      "expo-sharing",
      "expo-image",
      [
        "expo-splash-screen",
        {
          "image": "./assets/splash.png",
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#b78845",
          "sounds": [
            "./assets/sounds/siren_warrior.wav",
            "./assets/sounds/siren_satsang.wav"
          ]
        }
      ]
    ],
    owner: "planetic-labs"
  };

  if (!isProd) {
    baseConfig.name = `${baseConfig.name} (Dev)`;
    baseConfig.ios.bundleIdentifier = `${baseConfig.ios.bundleIdentifier}dev`;
    baseConfig.android.package = `${baseConfig.android.package}dev`;
    baseConfig.scheme = `${baseConfig.scheme}-dev`;
  }

  return baseConfig;
};
