module.exports = ({gulp, del, config}) => {
    gulp.task("clean", () => {
        return del([/*config.scripts.dest, */config.styles.dest, config.markup.dest, config.fonts.dest]);
    });
};