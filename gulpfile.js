var gulp=require('gulp');
var args=require('yargs').argv;
var del=require('del');
var config=require('./gulp.config')(); //gulp.config.js

var $=require('gulp-load-plugins')({lazy:true});

// var jshint=require('gulp-jshint');
// var jscs=require('gulp-jscs');
// var util=require('gulp-util');
// var gulpprint=require('gulp-print');
// var gulpif=require('gulp-if');

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

gulp.task('clean-styles',function(done){
    var files=config.temp + '**/*.css';
    //del(files);
    clean(files,done);
});

gulp.task('less-watcher',function(){
    gulp.watch([config.less],['styles']);
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

gulp.task('inject',['wiredep','styles'],function(){ 
    // wiredep','styles will run in paralle
    log('Wire up the bower css into the html, and call wiredep');

    return gulp
        .src(config.index)  
        .pipe($.inject(gulp.src(config.css)))  
        .pipe(gulp.dest(config.client)) 
});
///////////////////////
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