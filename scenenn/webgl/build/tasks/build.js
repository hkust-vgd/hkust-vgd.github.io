var gulp = require("gulp");
var sourceMaps = require("gulp-sourcemaps");
var babel = require("gulp-babel");
var compress = require('gulp-yuicompressor');
var inject = require('gulp-inject');
var uglify = require('gulp-uglify');
var gulpSequence = require('gulp-sequence');

gulp.task("build-js", function () {
return gulp.src("js/**/*.js") //.jsget all js files under the src
    .pipe(sourceMaps.init()) //initialize source mapping
    .pipe(babel()) //transpile
    .pipe(sourceMaps.write(".")) //write source maps
    .pipe(gulp.dest("dist/js")) //pipe to the destination folder
});

gulp.task("compress-js", function () {
    return gulp.src("dist/js/**/*.js")
        .pipe(uglify().on('error', function(e){
        console.log(e);
        }))
        .pipe(gulp.dest("dist/js")) //pipe to the destination folder
});

gulp.task("build-app-js", function () {
    return gulp.src("js/webgl/WebGLApp.js") //.jsget all js files under the src
        .pipe(sourceMaps.init()) //initialize source mapping
        .pipe(babel()) //transpile
        .pipe(sourceMaps.write(".")) //write source maps
        .pipe(gulp.dest("dist/js/webgl")) //pipe to the destination folder
});

gulp.task("build-mainmenu-js", function () {
    return gulp.src("js/mainmenu.js") //.jsget all js files under the src
        .pipe(sourceMaps.init()) //initialize source mapping
        .pipe(babel()) //transpile
        .pipe(sourceMaps.write(".")) //write source maps
        .pipe(gulp.dest("dist/js/")) //pipe to the destination folder
});

gulp.task("build-helper-js", function () {
    return gulp.src("js/libs/helpers.js") //.jsget all js files under the src
        .pipe(sourceMaps.init()) //initialize source mapping
        .pipe(babel()) //transpile
        .pipe(sourceMaps.write(".")) //write source maps
        .pipe(gulp.dest("dist/js/libs")) //pipe to the destination folder
});

gulp.task("build-segmentation-js", function () {
    return gulp.src("js/segmentation/**/*.js") //.jsget all js files under the src
        .pipe(sourceMaps.init()) //initialize source mapping
        .pipe(babel()) //transpile
        .pipe(sourceMaps.write(".")) //write source maps
        .pipe(gulp.dest("dist/js/segmentation")) //pipe to the destination folder
});

gulp.task("compress-app-js", function () {
    return gulp.src("dist/js/webgl/WebGLApp.js") //.jsget all js files under the src
        .pipe(uglify())
        .pipe(gulp.dest("dist/js/webgl")) //pipe to the destination folder
});

gulp.task("copy-js", function () {
    return gulp.src("js/**/*.js") //.jsget all js files under the src
        .pipe(gulp.dest("dist/js")) //pipe to the destination folder
});


gulp.task('css-mini', function () {
    gulp.src('css/*')
        .pipe(compress({
            type: 'css'
        }))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('index', function () {
    var target = gulp.src('./index.html');
    // It's not necessary to read the files (will speed up things), we're only after their paths:
    var sources = gulp.src(['./**/*.js', './**/*.css'], {read: false});

    return target.pipe(inject(sources))
        .pipe(gulp.dest("dist"));
});

gulp.task('default', gulpSequence('copy-js', 'build-mainmenu-js', 'build-helper-js', 'build-segmentation-js', 'build-app-js', 'compress-js', 'css-mini', 'index'));
