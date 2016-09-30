var gulp=require('gulp');
var args=require('yargs').argv;
var browserSync=require('browser-sync');
var del=require('del');
var config=require('./gulp.config')(); //gulp.config.js
var lazypipe = require('lazypipe');
var $=require('gulp-load-plugins')({lazy:true});
var port=process.env.PORT || config.defaultPort;

// var jshint=require('gulp-jshint');
// var jscs=require('gulp-jscs');
// var util=require('gulp-util');
// var gulpprint=require('gulp-print');
// var gulpif=require('gulp-if');

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

gulp.task('vet',function(){
    log('Analyzing source with JSHint and JSCS');
   return gulp
    .src(config.alljs)
    .pipe($.if(args.verbose,$.print()))
    .pipe($.jscs())
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish',{verbose:true})) /* return error with W117 code*/
    .pipe($.jshint.reporter('fail'));

});

gulp.task('styles',['clean-styles'],function(){
//gulp.task('styles',function(){
    log('compiling less --> CSS');
    return gulp
        .src(config.less) 
        .pipe($.plumber())
        .pipe($.less())
        //.on('error',errorLogger)
        .pipe($.autoprefixer({browsers:['last 2 version','> 5%']})) //last two version and greater than 5% in market
        .pipe(gulp.dest(config.temp)); 
});

gulp.task('fonts',['clean-fonts'],  function() {
    log('Copying fonts');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function() {
    log('Copying and compressing the images');

    return gulp
        .src(config.images)
        .pipe($.imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.build + 'images'));
});

gulp.task('clean', function(done) {
    var delconfig = [].concat(config.build, config.temp);
    log('Cleaning: ' + $.util.colors.blue(delconfig));
    del(delconfig, done);
});

gulp.task('clean-fonts', function(done) {
    clean(config.build + 'fonts/**/*.*', done);
});

gulp.task('clean-images', function(done) {
    clean(config.build + 'images/**/*.*', done);
});

gulp.task('clean-styles', function(done) {
    clean(config.temp + '**/*.css', done);
});

gulp.task('clean-code', function(done) {
    var files = [].concat(
        config.temp + '**/*.js',
        config.build + '**/*.html',
        config.build + 'js/**/*.js'
    );
    clean(files, done);
});

gulp.task('less-watcher', function() {
    gulp.watch([config.less], ['styles']);
});


gulp.task('less-watcher',function(){
    gulp.watch([config.less],['styles']);
});

gulp.task('templatecache',function(){
     log('Creating AngularJS $templateCache');
     return gulp
        .src(config.htmltemplates)
        .pipe($.minifyHtml({empty:true})) //it will retun empty template as well
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        ))
        .pipe(gulp.dest(config.temp));
});

gulp.task('wiredep',function(){ 
    log('Wire up the bower css js and our app js into the html');
    var options=config.getWiredepDefaultOptions();
    var wiredep=require('wiredep').stream;

    return gulp
        .src(config.index)  
        .pipe(wiredep(options)) //get all bower dependencies in package.json
        .pipe($.inject(gulp.src(config.js)))  
        .pipe(gulp.dest(config.client)); 
});

gulp.task('inject',['wiredep','styles','templatecache'],function(){ 
    // wiredep','styles will run in paralle
    log('Wire up the bower css into the html, and call wiredep');

    return gulp
        .src(config.index)  
        .pipe($.inject(gulp.src(config.css)))  
        .pipe(gulp.dest(config.client)); 
});
//working example of optimize
//https://github.com/johnpapa/pluralsight-gulp/issues/34

gulp.task('optimize', ['inject', 'fonts', 'images'], function() {
    log('Optimizing the javascript, css, html');

    var templateCache = config.temp + config.templateCache.file;
    var cssFilter = $.filter('**/*.css', {restore: true});
    var jsLibFilter = $.filter('**/' + config.optimized.lib, {restore: true}); //in index file <!--build:js js/lib.js-->
    var jsAppFilter = $.filter('**/' + config.optimized.app, {restore: true}); //<!--build:js js/app.js-->
    var notIndexFilter = $.filter(['**/*', '!**/index.html'], {restore: true});

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templateCache, {read: false}), {
            starttag: '<!-- inject:templates:js -->'
        }))
        .pipe($.useref({searchPath: './'}))
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore)

        .pipe(jsLibFilter)
        .pipe($.uglify())
        .pipe(jsLibFilter.restore)

        .pipe(jsAppFilter)
        .pipe($.ngAnnotate({add:true})) //it safe us from Injection if not there,
                                        //TRUE means add inject ARRAY like in core:  /* @ngInject */ 
        .pipe($.uglify())     //mingle code only for app.js
        .pipe(jsAppFilter.restore)
         // Take inventory of the file names for future rev numbers
        .pipe(notIndexFilter)
        .pipe($.rev()) //app.js --> aap-1234js.js
        .pipe(notIndexFilter.restore)
    
        .pipe($.revReplace())  // put new version files in index.html
        .pipe($.if('*.html', $.htmlmin({removeComments: true, collapseWhitespace: true})))
        //.pipe($.rev.manifest()) //to get old value of js/css files
        .pipe(gulp.dest(config.build));
});

gulp.task('serve-build',['optimize'],  function() {
    serve(false /* isDev */);
});

gulp.task('serve-dev', ['inject'], function() {
    serve(true /* isDev */);
});

                        //Here in function call use done
gulp.task('test', ['vet', 'templatecache'], function(done) {
    startTests(true /* singleRun */, done);
});

///////////////////////
function serve(isDev){
    var nodeOptions={
        script:config.nodeServer,
        delayTime:1,
        env:{
            'PORT':port,        //in app.js check PORT and NODE_ENV
            'NODE_ENV': isDev? 'dev':'build'
        },
        watch:[config.server] 
    };

    return $.nodemon(nodeOptions)
        .on('restart',['vet'], function(ev) {
            log('*** nodemon restarted');
            log('files changed on restart:\n' + ev);
             setTimeout(function() {
                browserSync.notify('reloading now ...');
                browserSync.reload({stream: false});
            }, config.browserReloadDelay);
       })
        .on('start', function() {
            log('*** nodemon started');
            startBrowserSync(isDev);
        })
        .on('crash', function() {
            log('*** nodemon crashed: script crashed for some reason');
        })
        .on('exit', function() {
            log('*** nodemon exited cleanly');
        });
}

function startBrowserSync(isDev) {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting browser-sync on port ' + port);

    if (isDev) {
        gulp.watch([config.less], ['styles'])
            .on('change', function(event) { changeEvent(event); });
    } else {
        gulp.watch([config.less, config.js, config.html], ['optimize', browserSync.reload])
            .on('change', function(event) { changeEvent(event); });
    }

    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: isDev ? [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ] : [],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 0 //1000
    };

    browserSync(options);
}

function startTests(singleRun, done) {
    var karma=require('karma').server;
    var excludeFiles=[];
    var serverSpecs = config.serverIntegrationSpecs;

     excludeFiles = serverSpecs;

     karma.start({
         configFile:__dirname + '/karma.conf.js',
         exclude:excludeFiles,
         singleRun: !!singleRun
     },karmaCompleted);
     function karmaCompleted(karmaResult){
         log('Karma completed!');
         if(karmaResult===1){ // 1 means failure of test
             done('karma: tests failed with code' + karmaResult);   
         }
         else{
            done();
        }
     }

}

function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function errorLogger(error){
    log('*** Start of Error ***');
    log(error);
    log('*** End of Error ***');
    this.emit('end');
}

function clean(path,done){
    log('cleaning:' + $.util.colors.blue(path));
    del(path)
        .then(function(){
            done();
        }); //now it is promiss instead of call back  https://github.com/johnpapa/pluralsight-gulp/issues/24
    //del(path,done());  // call back function don is in dle function
}

function log(msg){
    if(typeof(msg)==='object'){
        for(var item in msg){
            if(msg.hasOwnProperty(item)){
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    }
    else{
        $.util.log($.util.colors.blue(msg));
    }
}