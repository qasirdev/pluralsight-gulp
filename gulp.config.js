module.exports=function(){
    var client='./src/client/';
    var config={
        temp:'./temp/',
        /**
         * Files Paths
         */
        //all js for vet
        alljs:[
            './src/**/*.js',
            './*.js'
        ],
        less: client + 'styles/styles.less'
    };

    return config;
};