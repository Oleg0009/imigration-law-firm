
module.exports = ({gulp, config, webpack, webpackStream, uglify, pluginError}) => {
  gulp.task("script-dev", function() {
    return gulp.src(config.scripts.src + config.default_js_file)
      .pipe(webpackStream({
        output: {
          filename: "global.js"
        },
        module: {
          rules: [
            {
              test: /\.js$/,
              exclude: /node_modules/,
              use: [
                {
                  loader: "babel-loader"
                }
              ]
            }
          ]
        },
        externals: {
          "jquery": "jQuery"
        },
        plugins: [
          new webpack.ProvidePlugin({
            "$": "jquery",
            "jQuery": "jquery",
            "window.jQuery": "jquery"
          })
        ],
        devtool: ""
      }))
      .on("error", function(error) {
        new pluginError("test", error);
        this.emit("end");
      })
      .pipe(gulp.dest(config.scripts.dest));
  });
};
