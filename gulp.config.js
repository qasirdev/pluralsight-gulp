module.exports=function(){
    var client='./src/client/';
    var clientApp= client + 'app/';
    var temp='./temp/';

    var config={
        temp:temp,
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
        /**
         * bower and npm locations
         */
        bower:{
            json:require('./bower.json'),
            directory: './bower_components/',  //here it is _ NOT - in name
            ignorePath:'../..'
        }
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