"use strict";
exports.__esModule = true;
var fs = require("fs-jetpack");
var Path = (function () {
    function Path() {
    }
    Path.prototype.dir = function (path) {
        var exists = fs.exists(path);
        switch (exists) {
            case 'file':
                var split = path.split('/');
                split.pop();
                return fs.path(split.join('/'));
            case 'dir':
                return fs.path(path);
            default:
                console.error("path does not exist \"" + path + "\"");
                return '';
        }
    };
    Path.prototype.fromSlug = function (slug) {
        slug = slug.replace(/\/index\//gi, '/').replace(/\/index$/gi, '/');
        slug = slug.replace(fs.cwd() + "/content", '');
        var path = fs.path("public/" + slug);
        if (fs.exists(path) == 'dir') {
            var filePath = fs.path(path, 'index.html');
            return filePath;
        }
        return path;
    };
    return Path;
}());
exports.Path = Path;
//# sourceMappingURL=path.js.map