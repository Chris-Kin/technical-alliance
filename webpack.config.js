var ExtractTextPlugin = require("extract-text-webpack-plugin");
var WebpackMd5Hash = require('webpack-md5-hash');

var fs = require('fs');
var rd = require("rd");
var path = require('path');
/**
 * 生成入口映射配置
 * @return {[type]} [entry map]
 */
function createEntry() {
    var tempEntry = {};
    rd.eachFileFilterSync(__dirname + '/static/scripts/pages/', /entry\.js$/, function(file) {

        // 将file中的反斜杠\转换为/
        var OSFile = file.split(path.sep).join('/');

        var fileIndex = OSFile.indexOf('/static/');
        var fileUrl = '.' + OSFile.substring(fileIndex);
        console.log('file---', OSFile)
        console.log('fileIndex---', fileIndex)
        console.log('fileUrl---', fileUrl)
        var entryUrl = OSFile.split('/scripts/')[1].split('.')[0];
        console.log('entryUrl---', entryUrl)
        tempEntry[entryUrl] = fileUrl;
    });
    return tempEntry;
}

var config = {
    //页面入口文件配置
    entry: createEntry(),
    // entry: __dirname + '/static/scripts/pages/entry.js',
    //输出配置
    output: {
        path: 'static/dist',
        // filename: 'src/[name].[chunkhash:8].js',
        filename: 'scripts/[name].js',
        chunkFilename: "[chunkhash].chunk.js"
    },
    //加载器配置
    module: {
        loaders: [{
            test: /\.css|.scss$/,
            loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass")
        }, {
            test: /\.html|\.string|\.tpl$/,
            loader: "string"
        }]
    },
    // babel 编译器
    babel: {
        presets: ['es2015']
    },
    // 其他配置项
    resolve: {
        // 自动扩展文件后缀名，意味着我们require模块可以省略不写后缀名
        extensions: ['', '.js', '.html', '.css', '.scss', '.less'],
        alias: {
            styles: __dirname + "/static/styles",
            scripts: __dirname + "/static/scripts",

            libs: __dirname + "/static/src/libs",
            vue: __dirname + "/static/src/libs/vue2.0/vue.js",
            jquery: __dirname + "/static/src/libs/jquery/jquery.js",
            highcharts: __dirname + "/static/src/libs/highcharts/highcharts.js",

            common: __dirname + "/static/src/common",
            commonApi: __dirname + "/static/src/common/api",
            ajax: __dirname + "/static/src/common/service/ajax.js",
            error: __dirname + "/static/src/common/service/error.js",
            utils: __dirname + "/static/src/common/utils",
            generateChart: __dirname + "/static/src/common/utils/generateChart.js",
            
            components: __dirname + "/static/src/components"
        }
    },
    //插件项
    plugins: [
        // new ExtractTextPlugin("src/[name].[contenthash:8].css"),
        new ExtractTextPlugin("src/[name].css"),
        new WebpackMd5Hash(),

        function() {

            this.plugin('done', function(stats) {
                
                var arr = [];
                for(var key in stats.compilation.assets) {
                    arr.push(key);
                }
                console.log(arr);
                console.log("==========" + Date() + "==========");

                // rd.eachFileFilterSync(__dirname + '/output/views/', /index\.html$/, function(file) {
                //     console.log(file, file.length);
                //     MD5(file);
                // });

                function MD5(dir) {
                    fs.readFile(dir,'utf-8',function(err,data){
                        if (err) {
                            console.log(err);
                        } else {
                            var htmlLine = data.split('\n');
                            htmlLine.map(function(item,index){
                                if(item.indexOf("src=") !== -1){
                                    htmlLine[index] = replaceJs(item);
                                }else if(item.indexOf("href=") !== -1){
                                    htmlLine[index] =  replaceCss(item);
                                }
                                return item;
                            });
                            fs.writeFile(dir, htmlLine.join('\n'),function(err,data){
                                console.log(data);
                            })
                        }

                    })

                    var cssReg = /<link.*href=["']\S*["'][^>]*>/ig;
                    var jsReg = /<script.*src=["']\S*["'][^>]*>\S*<\/script>/ig;
                    var content =/\"([^\"]*)\"/g;

                    function replaceCss(data){
                        var cssRes = data.match(cssReg)
                        var result = cssRes[0].match(content);
                        var newHref;
                        result.map(function(item,index){
                            if(item.indexOf('.css')!==-1){
                                for(var i=0; i<arr.length; i++){
                                    if(arr[i].indexOf(item.split('dist/')[1].split('.')[0]) !== -1 && arr[i].indexOf('.js')==-1){
                                        newHref = data.replace(item, item.split('dist/')[0]+ "dist/" +arr[i]+"\"");
                                    }
                                }
                            }
                        });
                        return newHref;
                    }
                    function replaceJs(data){
                        var jsRes = data.match(jsReg)
                        var result = jsRes[0].match(content);
                        var newSrc;
                        result.map(function(item,index){
                            if(item.indexOf('.js')!==-1){
                                for(var i=0; i<arr.length; i++){
                                    if(arr[i].indexOf(item.split('dist/')[1].split('.')[0]) !== -1 && arr[i].indexOf('.css')==-1){
                                        newSrc = data.replace(item, item.split('dist/')[0]+ "dist/" +arr[i]+"\"");
                                    }
                                }
                            }
                        });
                        return newSrc;
                    }
                }
            });

        }
    ],
    // 本地系统
    devtool: '#eval-source-map'
};

// 线上环境 压缩代码
var arg = process.argv;
if (arg[arg.length - 1] == "--prod") {
    config.devtool = "";
}

module.exports = config;