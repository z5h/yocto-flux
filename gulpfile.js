var gulp = require('gulp');
var uglify = require('gulp-uglify');
var header = require('gulp-header');
var footer = require('gulp-footer');
var rename = require('gulp-rename');

var reactify = require('reactify');
var browserify = require('browserify');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var del = require('del');
var pkg = require('./package.json');


var foot = ';yoctoFlux.version = "<%= pkg.version %>";';

var banner = ['/*!',
    ' * <%= pkg.name %> v<%= pkg.version %>',
    ' * Url: <%= pkg.homepage %>',
    ' * Copyright (c) <%= pkg.author %>',
    ' * License: <%= pkg.license %>',
    ' */',
    ''].join('\n');

gulp.task('browserify', function() {
    return browserify('./index.js', {standalone: pkg.name})
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('yocto-flux.js'))
        .pipe(header(banner, { pkg: pkg }))
        .pipe(buffer())
        .pipe(footer(foot, { pkg: pkg }))
        // Start piping stream to tasks!
        .pipe(gulp.dest('dist'))
        .pipe(rename({ suffix: '.min' }))
        .pipe(uglify({ preserveComments: 'some' }))
        .pipe(gulp.dest('dist'));
});

gulp.task('browserify-example', function() {
    return browserify('./example/src/index.js', {standalone: pkg.name})
        .transform(reactify)
        .bundle()
        //Pass desired output filename to vinyl-source-stream
        .pipe(source('browser.js'))
        .pipe(gulp.dest('example/lib'));
});

// Clean
gulp.task('clean', function(cb) {
  del(['dist/*.js'], cb);
});

//default
gulp.task('default', ['browserify', 'browserify-example']);

// Watch
gulp.task('watch', function() {
  gulp.watch(config.src, ['default']);
});
