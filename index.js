/// <reference path="typings/bundle.d.ts" />
'use strict';
var fs = require('fs');
var merge = require('merge');
var gutil = require('gulp-util');
var through = require('through2');
var handlebars = require('handlebars');
var typedtable = require('typed-table');
var Tmpl = (function () {
    function Tmpl(tmplFilePath) {
        this.tmpl = fs.readFileSync(tmplFilePath, 'utf8');
        this.cmpl = handlebars.compile(this.tmpl);
    }
    return Tmpl;
})();
var pkg = require('./package.json');
var gulpXlsx2html = function (tmplFilePath, options) {
    var pluginName = pkg.name;
    var tmplSet = {
        defaults: null
    };
    if (typeof tmplFilePath === 'string') {
        tmplSet.defaults = new Tmpl(tmplFilePath);
    }
    else {
        var tmplType;
        for (tmplType in tmplFilePath) {
            if (tmplFilePath.hasOwnProperty(tmplType)) {
                tmplSet[tmplType] = new Tmpl(tmplFilePath[tmplType]);
            }
        }
    }
    var data = [];
    var config = merge(true, {
        header: 0,
        type: 1,
        label: null
    }, options);
    var transform = function (xlsxFile, encoding, callback) {
        if (xlsxFile.isNull()) {
            this.push(xlsxFile);
            return callback();
        }
        if (xlsxFile.isStream()) {
            this.emit('error', new gutil.PluginError(pluginName, 'Streaming not supported'));
            return callback();
        }
        var book = typedtable.readExcel(xlsxFile.path, config);
        var table = book[0];
        var json = table.toJSON();
        if (Array.isArray(json)) {
            data = data.concat(json);
        }
        else {
            data.push(json);
        }
        callback();
    };
    var flush = function (callback) {
        var self = this;
        data.forEach(function (record, i) {
            var newPath;
            var tmpl;
            if (record.__FILE_PATH__) {
                newPath = record.__FILE_PATH__;
                newPath = newPath.replace(/[^a-z0-9@_\/-]/ig, '_');
                if (/\/$/.test(newPath)) {
                    newPath += 'index';
                }
                if (!/\.html$/i.test(newPath)) {
                    newPath += '.html';
                }
            }
            else {
                newPath = i + '.html';
            }
            if (record.__TMPL_TYPE__ && tmplSet[record.__TMPL_TYPE__]) {
                tmpl = tmplSet[record.__TMPL_TYPE__];
            }
            else {
                tmpl = tmplSet.defaults;
            }
            var html = tmpl.cmpl(record);
            var newFile = new gutil.File({
                path: newPath,
                contents: new Buffer(html)
            });
            self.push(newFile);
        });
        callback();
    };
    return through.obj(transform, flush);
};
module.exports = gulpXlsx2html;
