module.exports=function(){
    var client='./src/client/';
    var clientApp= client + 'app/';
    var server='./src/server/';
    var temp='./temp/';

    var config={
        /**
         * Files Paths
         */
        //all js for vet
        alljs:[
            './src/**/*.js',
            './*.js'
        ],
        client:client,
        css:temp + 'styles.css',
        index:client + 'index.html',
        js:[
            clientApp + '**/*.module.js',
            clientApp + '**/*.js',
            '!' + clientApp + '**/*.spec.js'
        ],
        less: client + 'styles/styles.less',
        server:server,
        temp:temp,

        /**
         * bower and npm locations
         */
        bower:{
            json:require('./bower.json'),
            directory: './bower_components/',  //here it is _ NOT - in name
            ignorePath:'../..'
        },
        /**
         * Node settings
         */
        defaultPort:7302,
        nodeServer:'src/server/app.js' //carefull about this path with out dot(.)
    };
    
    config.getWiredepDefaultOptions = function() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };

    return config;
};