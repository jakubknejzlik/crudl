const gulp = require('gulp');

const assign = require('lodash.assign');
const autoprefixer = require('gulp-autoprefixer');
const babelify = require('babelify');
const browserify = require('browserify');
const gutil = require('gulp-util');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const watch = require('gulp-watch');
const watchify = require('watchify');
const buffer = require('vinyl-buffer')
const rename = require('gulp-rename')
const uglify = require('gulp-uglify')
const notifier = require('node-notifier');
const envify = require('loose-envify/custom');
const concat = require('gulp-concat-util');

const packageJSON = require('./package.json')

const dist = './dist';

// Browserify Options
const browersifyOptions = {
    entries: ['./src/index.js'],
    extensions: ['.jsx'],
    output: 'crudl.js',
    standalone: 'crudl',
};

// Babelify Options
const babelifyOptions = {
    presets: ['es2015', 'react'],
    plugins: [
        'syntax-class-properties',
        'transform-class-properties',
        'transform-object-rest-spread',
        ['react-intl', {
            messagesDir: `${dist}/messages`,
        }],
    ],
}

// Bundle task for the development (continuous watch)
function bundleDevelopment(bundler) {
    return bundler.bundle()
    .on('error', (err) => { // log errors if they happen
        notifier.notify({
            title: 'Browserify Error',
            message: err.message,
        });
        gutil.log('Browserify Error', err);
    })
    .pipe(source('crudl.js'))
    .pipe(gulp.dest(dist))
    .on('end', () => {
        notifier.notify({
            title: 'Browserify',
            message: 'OK',
        });
    })
}

const opts = assign({}, watchify.args, browersifyOptions, { debug: true });
const bundler = watchify(browserify(opts).transform(babelify.configure(babelifyOptions)));
bundler.on('update', () => bundleDevelopment(bundler)); // on any dep update, runs the bundler
bundler.on('log', gutil.log); // output build logs to terminal

// Bundle task for the production environment
function bundleProduction() {
    return browserify(browersifyOptions)
    .transform(babelify.configure(babelifyOptions))
    .transform(envify({ _: 'purge', NODE_ENV: 'production' }), { global: true })
    .on('log', gutil.log)
    .bundle()

    // minify
    .pipe(source('crudl.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(rename('crudl.min.js'))
    .on('error', gutil.log.bind(gutil, 'uglify:'))

    // Prepend the license
    .pipe(concat('crudl.min.js'))
    .pipe(concat.header(`/* LICENSE: ${packageJSON.license} */\n`))

    // Copy to dist
    .pipe(gulp.dest(dist))

    .on('end', () => {
        gutil.log(`Successfully build ${gutil.colors.magenta(`${dist}/crudl.min.js`)}`)
    })
}

//
// SASS (Watch & Compile) Tasks
//
const sassOptions = {
    errLogToConsole: true,
    outputStyle: 'expanded',
};

const autoprefixerOptions = {
    browsers: ['last 2 versions'],
};

const sassSrcFiles = './static/crudl-ui/scss/**/*';

// Watch sass files ...
function sassWatch() {
    return gulp
    // ... and compile if necessary
    .watch(sassSrcFiles, ['sass-compile'])
    .on('change', (event) => {
        gutil.log(`File ${event.path} was ${event.type}, running tasks...`);
    });
}

// Compile sass files (including sourcemaps and autoprefixer)
function sassCompile() {
    gulp.src(sassSrcFiles)
    .pipe(sourcemaps.init())
    .pipe(sass(sassOptions).on('error', sass.logError))
    .pipe(autoprefixer(autoprefixerOptions))
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./static/crudl-ui/stylesheets'))
}

// Copy Task for static files
function copyStaticFiles() {
    const srcFiles = ['./static/crudl-ui/**/*', '!./static/crudl-ui/scss', '!./static/crudl-ui/scss/**/*'];
    gulp.src(srcFiles)
    .pipe(watch(srcFiles))
    .pipe(gulp.dest(`${dist}/crudl-ui`))
}

gulp.task('dev', () => bundleDevelopment(bundler));
gulp.task('build', bundleProduction);

gulp.task('sass-watch', sassWatch);
gulp.task('sass-compile', sassCompile);
gulp.task('copy-static-files', copyStaticFiles);
gulp.task('sass', ['sass-watch', 'copy-static-files']);

gulp.task('default', ['dev', 'copy-static-files']);
