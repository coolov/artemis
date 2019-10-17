// this is only used for jest
module.exports = api => {
  const isTest = api.env("test");
  return {
    presets: ["@babel/preset-env", "@babel/preset-react"]
  };
};
