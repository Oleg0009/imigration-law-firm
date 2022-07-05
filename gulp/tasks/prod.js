module.exports = ({gulp}) => {
    gulp.task("prod", gulp.series(
        "set-prod",
        "clean",
        gulp.parallel("fonts", "htmlimport", "scss", "images", "script-prod"),
        "script-dev"
    ));
};