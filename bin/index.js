"use strict";
exports.__esModule = true;
var cli_1 = require("./helper/cli");
var builder_1 = require("./helper/builder");
var fs = require("fs-jetpack");
var path_1 = require("./helper/path");
var promisify = require('util').promisify;
var glob = promisify(require('glob'));
var ora = require('ora');
var c = require('ansi-colors');
var templateEngine = require('handlebars');
var cli = new cli_1.CLI();
var path = new path_1.Path();
var spinner = ora();
var time = new Date();
spinner.start('Building');
var config = null;
var configPath = 'content/config.json';
if (fs.exists(configPath) == 'file') {
    config = JSON.parse(fs.read(configPath));
}
glob('content/**/*.json')
    .then(function (files) {
    console.log(files);
    files
        .filter(function (filePath) { return filePath != 'content/config.json'; })
        .map(function (filePath) {
        console.log('');
        var fileContent = fs.read(filePath);
        var fileData = JSON.parse(fileContent);
        fileData.source = filePath;
        if (fileData.slug == null) {
            fileData.slug = path.dir(filePath);
        }
        fileData.destination = path.fromSlug(fileData.slug);
        console.log(fileData.destination);
        var builder = new builder_1.Builder(templateEngine, fs, fileData, config);
        var generated = builder.generate();
        console.log('result:');
        console.log(generated);
        fs.writeAsync(fileData.destination, generated).then(function () {
            console.log('finished');
        });
    });
    spinner.succeed('Build complete');
})["catch"](function (error) {
    spinner.fail('Build failed');
    console.error(error);
});
//# sourceMappingURL=index.js.map