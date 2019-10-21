// this is only used for jest
module.exports = api => {
  const isTest = api.env("test");
  return {
    presets: [
      [
        "@babel/preset-env",
        {
          targets: {
            node: "current"
          }
        }
      ],
      "@babel/preset-react"
    ]
  };
};
