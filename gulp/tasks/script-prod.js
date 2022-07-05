
module.exports = ({gulp, config, webpack, webpackStream, uglify, pluginError}) => {
    gulp.task("script-prod", function() {
        return gulp.src(config.scripts.src + config.default_js_file)
            .pipe(webpackStream({
                output: {
                    filename: "global.min.js"
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
                  }),
                  new uglify({
                    sourceMap: true,
                    uglifyOptions: {
                      // ecma: 8,
                      compress: {
                        drop_console: true
                      }
                    }
                  })
                ],
                devtool: "source-map"
            }))
            .on("error", function(error) {
                new pluginError("test", error);
                this.emit("end");
            })  
            .pipe(gulp.dest(config.scripts.dest));
    });
};
