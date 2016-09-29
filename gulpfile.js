var gulp=require('gulp');
var args=require('yargs').argv;
var browserSync=require('browser-sync');
var del=require('del');
var config=require('./gulp.config')(); //gulp.config.js
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
        .pipe(gulp.dest(config.temp)) 
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
        .pipe(gulp.dest(config.client)) 
});

gulp.task('inject',['wiredep','styles','templatecache'],function(){ 
    // wiredep','styles will run in paralle
    log('Wire up the bower css into the html, and call wiredep');

    return gulp
        .src(config.index)  
        .pipe($.inject(gulp.src(config.css)))  
        .pipe(gulp.dest(config.client)) 
});
//working example of optimize
//https://github.com/johnpapa/pluralsight-gulp/issues/34

gulp.task('optimize',['inject'],function(){
    log('Optimizing the javascript, css, html');

    var assets = $.useref.assets({searchPath: '.tmp' });
    var templateCache = config.temp + config.templateCache.file;

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templateCache, {read: false}), {
            starttag: '<!--inject:templates.js-->'
        }))
        .pipe(assets)
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe(gulp.dest(config.build));
});

gulp.task('serve-dev',['inject'],function(){
    var isDev=true;     
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
            startBrowserSync();
        })
        .on('crash', function() {
            log('*** nodemon crashed: script crashed for some reason');
        })
        .on('exit', function() {
            log('*** nodemon exited cleanly');
        });

});
///////////////////////
function startBrowserSync(){
     if (args.nosync || browserSync.active) {
        return;
    }
    log('Starting brower-sync on port: ' + port);

    gulp.watch([config.less], ['styles'])
        .on('change', function(event) { changeEvent(event); });

    var options={
        proxy:'localhost:' + port,
        port:3000,
        files:[config.client + '**/*.*'], //all files HTML,CSS,JS
        goshtMode:{
            clicks: true,
            location: false,
            form: true,
            scroll:true
        },
        injectChanges:true, //only load changes if false then whole page re-load
        logFileChanges:true,
        logLevel:'debug',
        logPrefix:'gulp-patterns',
        notify:true,
        reloadDelay:1000
    };
    browserSync(options);
}
function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

function startBrowserSync() {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting browser-sync on port ' + port);

    gulp.watch([config.less], ['styles'])
        .on('change', function(event) { changeEvent(event); });

    var options = {
        proxy: 'localhost:' + port,
        port: 3000,
        files: [
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ],
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