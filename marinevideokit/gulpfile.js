const gulp = require('gulp');
const copy = require('copy');
const minify = require('gulp-minify');
const cleanCSS = require('gulp-clean-css');
 
gulp.task('default', function (cb) {
  copy('./node_modules/leaflet.markercluster/dist/*.js', 'MarineData_files/leaflet.markercluster/', cb);
  copy('./node_modules/leaflet.markercluster/dist/*.css', 'MarineData_files/leaflet.markercluster/', cb);
  
  gulp.src(['MarineData_files/mapApp.js'])
  .pipe(minify())
  .pipe(gulp.dest('MarineData_files/'))
  
  gulp.src(['MarineData_files/screen.css'])
      .pipe(cleanCSS({compatibility: 'ie8'}))
      .pipe(gulp.dest('MarineData_files/screen-min.css'));
  

});
