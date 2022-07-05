module.exports = ({gulp, config}) => {
  gulp.task("set-prod", () => {
    return Promise.resolve(config.isDev = false)
  });
};