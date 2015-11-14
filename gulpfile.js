/*
* CoffeeBagel-Studio -- BagelBoat project
* Version: <%= version %>
* https://github.com/polymorphl
* https://github.com/TonyChG
*/

'use strict';

/*
** ## LOAD PLUGINS
*/

// * 1st, utils
var gulp = require('gulp');
var browserSync = require('browser-sync');
var spawn = require('child_process').spawn;
var fs = require('fs');
var argv = require('yargs').argv;
//var mainBowerFiles = require('gulp-main-bower-files');
var mainBowerFiles = require('main-bower-files');

// * 2nd, gulp plugins
var bump = require('gulp-bump');
var header = require("gulp-header");
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var uglify = require('gulp-uglify');
var filter = require('gulp-filter');
var ignore = require('gulp-ignore');
var rm = require('gulp-rimraf');
var exec = require('gulp-exec');
var nodemon = require('gulp-nodemon');

// * 3rd, project files
var conf = require('./config.json');
var pkg_version = require('./package.json').version;

/*
** ## TASKS
*/

var BROWSER_SYNC_RELOAD_DELAY = 500;

// Get copyright using NodeJs file system
var getCopyright = function () {
    return fs.readFileSync('Copyright');
};

// ** [Task] Concat .js files + Uglify
gulp.task('js', ['clean-js'], function() {
    return gulp.src(conf.path.js)
        .pipe(sourcemaps.init({loadMaps: true})) // init sourcemap
        .pipe(concat(conf.build_appname)) // concat files
        .pipe(uglify({mangle:false})) // uglify them
        .pipe(header(getCopyright(), {version: pkg_version})) //write copyright
        .pipe(sourcemaps.write(conf.path.sourcemap_js))// write sourcemap
        .pipe(gulp.dest(conf.path.dist_js)) // send files in directory
        .pipe(browserSync.stream()); // sync files ??
});

// ** [Task] Concat .js files + Uglify + JSHINT
gulp.task('js-jshint', function(){
    return gulp.src(conf.path.jshint_files)
        .pipe(jshint(conf.path.jshint))
        .pipe(jshint.reporter(stylish));
});

// ** [Task] Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src(conf.path.sass)
        .pipe(plumber()) // Don't stop on error
        .pipe(sourcemaps.init()) // init sourcemap
        .pipe(sass(conf.sass_opt)) // scss process + options
        .on('error', notify.onError(function (error) { return conf.sass_error + error })) // Notify on error
        .pipe(header(getCopyright(), {version: pkg_version})) // write copyright
        .pipe(sourcemaps.write(conf.path.sourcemap_css)) // write sourcemap
        .pipe(plumber.stop()) // plumber - stop before gulp.dest()
        .pipe(gulp.dest(conf.path.css)) // send files in directory
        .pipe(browserSync.stream()); // Sync devices
});

// ** [TASK] Watchers for SCSS + JS
// **   &&   browser-sync connected devices
gulp.task('browser-sync', ['nodemon-task', 'sass', 'clean-js', 'js'], function() {
    browserSync({
		proxy: conf.vhost,
        browser: browserSync.browser,
        port: 7000,
	});

    if (conf.enable_js_hint) {
        gulp.watch(conf.path.js, ['clean-js', 'js', 'js-jshint']);
    } else {
        gulp.watch(conf.path.js, ['clean-js', 'js']);
    }

    gulp.watch(conf.path.sass, ['sass']);
});

// ** [TASK] Nodemon for nodejs Server
gulp.task('nodemon-task', function(cb) {
    var called = false;
    return nodemon({
        watch: conf.array_nodemon,
        script: conf.file_start,
        ignore: [
          './bower_components/**',
          './node_modules/**',
          './build/**',
          './.git/**',
          './scss/**'
        ]
    }).on('start', function onStart() {
        if (!called) { cb(); }
        called = true;
	}).on('restart', function onRestart() {
      setTimeout(function reload() {
        browserSync.reload({
          stream: false
        });
      }, BROWSER_SYNC_RELOAD_DELAY);
    });
});

/*
** Main task
** Buil
*/
gulp.task('default', ['browser-sync']);

/*
** Build task
** Build the js and css files
*/
gulp.task('build', ['bower-lib', 'clean-js', 'js', 'sass']);


/*
** ## LOCAL UTILS
*/

// ** [Task] Clean css files in dist folder
gulp.task('clean-css', function() {
    return gulp.src((conf.path.dist_js+'/*'))
        .pipe(ignore('bundle.js', 'bundle.js.map')) // ignore js files
        .pipe(rm()); // clean dist folder
});

// ** [Task] Clean js files in dist folder
gulp.task('clean-js', function() {
    return gulp.src((conf.path.dist_js+'/*'),{read: false})
        .pipe(ignore('main.css')) // ignore css file
        .pipe(ignore('main.css.map')) // ignore css file
        .pipe(ignore('lib.js')) // ignore css file
        .pipe(rm()); // clean dist folder
});

// ** [Task] Create the real bundle!
// ** (bower_components js + bower_components css + code js + code css generate by scss)
gulp.task('bower-lib', function() {
    return gulp.src(mainBowerFiles(null), { base: 'bower_components' })
        .pipe(filter('**/*.js')) // Filter -- only Js files
        .pipe(concat(conf.build_libname)) // concat JS
        .pipe(uglify()) // uglify them
        .pipe(gulp.dest(conf.path.dist_lib)); // send files in directory
});

// ** Auto Reload the Gulpfile onChange
gulp.task('reload', function() {
    var p;

    gulp.watch('gulpfile.js', spawnChildren);
    spawnChildren();
    function spawnChildren(e) {
        if(p) { p.kill(); }
        console.log('DEBUG RELOAD:', argv.task);
        p = spawn('gulp', [argv.task], {stdio: 'inherit'});
    }
});

// ** Bump version on json files
gulp.task('v-patch', function(){
  gulp.src(["./bower.json", "./package.json"])
  .pipe(bump({type:'patch'}))
  .pipe(gulp.dest('./'));
});
gulp.task('v-minor', function(){
  gulp.src(["./bower.json", "./package.json"])
  .pipe(bump({type:'minor'}))
  .pipe(gulp.dest('./'));
});
gulp.task('v-major', function(){
  gulp.src(["./bower.json", "./package.json"])
  .pipe(bump({type:'major'}))
  .pipe(gulp.dest('./'));
});
