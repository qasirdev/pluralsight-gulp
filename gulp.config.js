module.exports=function(){
    var client='./src/client/';
    var clientApp= client + 'app/';
    var report = './report/';
    var server='./src/server/';
    var temp='./tmp/';
    var wiredep = require('wiredep');
    var bowerFiles = wiredep({devDependencies: true})['js']; //get all js dependencies like angular, jquery

    var config={
        /**
         * Files Paths
         */
        //all js for vet
        alljs:[
            './src/**/*.js',
            './*.js'
        ],
        build: './build/',
        client:client,
        css:temp + 'styles.css',
        fonts: './bower_components/font-awesome/fonts/**/*.*',
        html: clientApp + '**/*.html',
        htmltemplates: clientApp + '**/*.html',        
        images: client + 'images/**/*.*',
        index:client + 'index.html',
        js:[
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        less: client + 'styles/styles.less',
        report: report,
        server:server,
        temp:temp,

        /**
         * optimized files
         */
        optimized: {
            app: 'app.js',
            lib: 'lib.js'
        },
        /**
         * template cache
         */
        templateCache:{
            file:'templates.js',
            options:{
                module:'app.core',
                standAlone:false, //if true it will create new module
                root:'app/'  //strip off extra parametesrs form URL
            }
        },
        
        /**
         * bower and npm locations
         */
        bower:{
            json:require('./bower.json'),
            directory: './bower_components/',  //here it is _ NOT - in name
            ignorePath:'../..'
        },

        /**
         * Karma and testing settings
         */
        specHelpers: [client + 'test-helpers/*.js'],
        serverIntegrationSpecs:[client + 'tests/server-integration/**/*.spec.js'],

        /**
         * Node settings
         */
        defaultPort:7302,
        nodeServer:'src/server/app.js' //carefull about this path is with out dot(.)
        //nodeServer:'./src/server/app.js' //carefull about this path is with out dot(.)
    };
    
    config.getWiredepDefaultOptions = function() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };

    config.karma=getKarmaOptions();

    return config;

      ////////////////
/*jshint -W101 */
    function getKarmaOptions() {
        var options = {
            files: [].concat(
                bowerFiles,                         //third vendar parties files like angular and jquery
                config.specHelpers,                 //in folder client/test-helpers :use run time for test for stub and mock
                client + '**/*.module.js',          //first get all module js files for project
                client + '**/*.js',                 //second get all remaining js files
                temp + config.templateCache.file,   //get template file
                config.serverIntegrationSpecs
            ),
            exclude: [],
            coverage: {
                dir: report + 'coverage',
                reporters: [
                    {type: 'html', subdir: 'report-html'},
                    {type: 'lcov', subdir: 'report-lcov'},
                    {type: 'text-summary'}
                ]
            },
            preprocessors: {}
        };
        options.preprocessors[clientApp + '**/!(*.spec)+(.js)'] = ['coverage']; //don't set coverage on SPEC files.
        return options;
    }
};