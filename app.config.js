const appJson = require("./app.json");

const baseUrl = process.env.EXPO_PUBLIC_BASE_URL ??
  (process.env.GITHUB_ACTIONS ? "/WordRush" : "");

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    experiments: {
      ...appJson.expo.experiments,
      baseUrl,
    },
  },
};
