module.exports = ({gulp, del, config}) => {
    gulp.task("clean-images", () => {
        return del([config.images.dest]);
    });
};