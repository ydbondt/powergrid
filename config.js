System.config({
  baseURL: "/",
  defaultJSExtensions: true,
  transpiler: "none",
  paths: {
    "github:*": "bower_components/github/*"
  },

  map: {
    "israelidanny/veinjs": "github:israelidanny/veinjs@master",
    "jquery": "github:components/jquery@2.1.4",
    "qunit": "github:jquery/qunit@1.19.0"
  }
});
