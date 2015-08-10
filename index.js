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
        var pathList = {};
        var outputs = [];
        data.forEach(function (recordData, i) {
            var record = recordData;
            var newPath;
            var newDir;
            var newFileName;
            var isIndex = false;
            var tmpl;
            if (record.__AVAILABLED__ === false) {
                return;
            }
            /**
             * A value is removed line break when type is string.
             * Add new value that is converted line break code to "<br>" tag. And then key name is added "_br".
             */
            for (var prop in record) {
                if (record.hasOwnProperty(prop)) {
                    var val = record[prop];
                    if (typeof val === 'string') {
                        record[prop] = val.replace(/(?:\n\r|\r\n)/g, '').replace(/(?:\n|\r)/g, '');
                        record[prop + '_br'] = val.replace(/(?:\n\r|\r\n)/g, '<br>').replace(/(?:\n|\r)/g, '<br>');
                    }
                }
            }
            /**
             * A file name is convert to "index.html" when path is "dir_name/" or "dir_name/index".
             * Else add to ".html" if not has extension.
             */
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
            /**
             * A index page flag.
             */
            if (/index\.html$/i.test(newPath)) {
                isIndex = true;
            }
            /**
             * Set a template file.
             */
            if (record.__TMPL_TYPE__ && tmplSet[record.__TMPL_TYPE__]) {
                tmpl = tmplSet[record.__TMPL_TYPE__];
            }
            else {
                // TODO: `tmplSet.defaults` is null
                tmpl = tmplSet.defaults;
            }
            /**
             *
             */
            newFileName = newPath.match(/[^\/]+$/i)[0];
            newDir = newPath.replace(newFileName, '');
            /**
             *
             */
            record.__DIR__ = newDir;
            /**
             *
             */
            if (!pathList[newDir]) {
                pathList[newDir] = {
                    index: null,
                    details: []
                };
            }
            /**
             *
             */
            record._isDetail = false;
            /**
             *
             */
            if (isIndex) {
                pathList[newDir].index = record;
            }
            else if (!record.__NOT_BELONG__) {
                record._isDetail = true;
                record._index = pathList[newDir].details.length;
                record._indexHumanCountable = record._index + 1;
                pathList[newDir].details.push(record);
            }
            record._details = pathList[newDir].details;
            record._file = newFileName;
            record._tmpl = tmpl;
            record._path = newPath;
            outputs.push(record);
        });
        outputs.forEach(function (record, i) {
            var _tmp = null;
            record._parent = pathList[record.__DIR__].index;
            record._detailsLength = record._details.length;
            if (record._parent && record._isDetail) {
                _tmp = record._parent._details[record._index - 1];
                if (_tmp) {
                    record._prev = _tmp;
                }
                _tmp = record._parent._details[record._index + 1];
                if (_tmp) {
                    record._next = _tmp;
                }
            }
            if (!record._tmpl) {
                console.warn('A template "' + record.__TMPL_TYPE__ + '" type is not asigned a template file.');
                return;
            }
            var html = record._tmpl.cmpl(record);
            var newFile = new gutil.File({
                path: record._path,
                contents: new Buffer(html)
            });
            self.push(newFile);
        });
        callback();
    };
    return through.obj(transform, flush);
};
module.exports = gulpXlsx2html;
