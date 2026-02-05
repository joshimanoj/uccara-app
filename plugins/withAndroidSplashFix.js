/**
 * Expo config plugin to fix Android splash screen black/blank flash.
 *
 * Problems solved:
 * 1. No windowBackground on launch theme → black flash before splash renders
 * 2. values-night/colors.xml is empty → black screen in dark mode
 * 3. ReactRootView has no background → black flash when native splash hides
 * 4. ReactRootView is created with transparent bg by React Native delegate
 */
const {
  withAndroidStyles,
  withMainActivity,
} = require("expo/config-plugins");

const SPLASH_BG = "#f7f5f2";

/**
 * Add android:windowBackground to both AppTheme and Theme.App.SplashScreen.
 */
function withWindowBackground(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;

    const setItem = (style, name, value) => {
      if (!style || !style.item) return;
      const existing = style.item.find((i) => i.$.name === name);
      if (existing) {
        existing._ = value;
        delete existing.$.value;
      } else {
        style.item.push({ $: { name }, _: value });
      }
    };

    const appTheme = styles.resources.style.find(
      (s) => s.$.name === "AppTheme"
    );
    const splashTheme = styles.resources.style.find(
      (s) => s.$.name === "Theme.App.SplashScreen"
    );

    if (appTheme) {
      setItem(appTheme, "android:windowBackground", "@color/splashscreen_background");
      setItem(appTheme, "android:navigationBarColor", "@color/splashscreen_background");
    }

    if (splashTheme) {
      setItem(splashTheme, "android:windowBackground", "@color/splashscreen_background");
    }

    return config;
  });
}

/**
 * Populate values-night/colors.xml with splash colors so dark mode
 * doesn't fall back to black.
 */
function withNightColorsDangerous(config) {
  return require("expo/config-plugins").withDangerousMod(
    config,
    [
      "android",
      async (config) => {
        const path = require("path");
        const fs = require("fs");

        const nightDir = path.join(
          config.modRequest.platformProjectRoot,
          "app",
          "src",
          "main",
          "res",
          "values-night"
        );
        const colorsPath = path.join(nightDir, "colors.xml");

        fs.mkdirSync(nightDir, { recursive: true });

        const content = `<resources>
  <color name="splashscreen_background">${SPLASH_BG}</color>
  <color name="iconBackground">#6366f1</color>
  <color name="colorPrimary">#023c69</color>
  <color name="colorPrimaryDark">${SPLASH_BG}</color>
  <color name="activityBackground">${SPLASH_BG}</color>
</resources>
`;
        fs.writeFileSync(colorsPath, content, "utf-8");

        return config;
      },
    ]
  );
}

/**
 * Rewrite MainActivity to:
 * 1. Force beige on window, decorView, content frame
 * 2. Override createReactActivityDelegate so the ReactRootView
 *    itself gets a beige background (the actual source of the black flash)
 */
function withMainActivityFixes(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    // Uncomment setTheme if commented
    contents = contents.replace(
      /\/\/\s*setTheme\(R\.style\.AppTheme\);?/,
      "setTheme(R.style.AppTheme)"
    );

    // Add Color import if not present
    if (!contents.includes("import android.graphics.Color")) {
      contents = contents.replace(
        "import android.os.Bundle",
        "import android.graphics.Color\nimport android.os.Bundle"
      );
    }

    // After super.onCreate(null), paint every native layer beige
    if (!contents.includes("setBackgroundColor(Color.parseColor")) {
      contents = contents.replace(
        "super.onCreate(null)",
        [
          `super.onCreate(null)`,
          `    // Paint every native layer beige so there is never a black frame`,
          `    val bgColor = Color.parseColor("${SPLASH_BG}")`,
          `    window.decorView.setBackgroundColor(bgColor)`,
          `    window.decorView.rootView.setBackgroundColor(bgColor)`,
          `    findViewById<android.view.View>(android.R.id.content)?.setBackgroundColor(bgColor)`,
          `    // Also paint the ReactRootView itself once it's attached`,
          `    window.decorView.viewTreeObserver.addOnGlobalLayoutListener {`,
          `      window.decorView.findViewById<android.view.ViewGroup>(android.R.id.content)?.let { frame ->`,
          `        for (i in 0 until frame.childCount) {`,
          `          frame.getChildAt(i).setBackgroundColor(bgColor)`,
          `        }`,
          `      }`,
          `    }`,
        ].join("\n")
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withAndroidSplashFix(config) {
  config = withWindowBackground(config);
  config = withNightColorsDangerous(config);
  config = withMainActivityFixes(config);
  return config;
};
