'use strict';

var fs = require('fs');
var path = require('path');
var merge = require('merge');
var gutil = require('gulp-util');
var through = require('through2');
var handlebars = require('handlebars');
var typedtable = require('typed-table');

var pkg = require('./package.json');

module.exports = function (tmplFilePath, options) {
	
	var pluginName = pkg.name;
	
	var tmpl = fs.readFileSync(tmplFilePath, 'utf8');
	var cmpl = handlebars.compile(tmpl);
	var fileBase = path.dirname(tmplFilePath.path);
	
	var data = [];
	
	var config = merge(true, {
		header: 0,
		type: 1,
		label: null
	}, options)

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
		} else {
			data.push(json);
		}

		callback();
	}
	
	var flush = function (callback) {

		var self = this;
		
		data.forEach(function (record, i) {
			var newPath = path.join(fileBase, i + '.html');
			var html = cmpl(record);
			var newFile = new gutil.File({
				cwd: fileBase,
				base: fileBase,
				path: newPath,
				contents: new Buffer(html)
			});
			self.push(newFile);
		});
		
		callback();
		
	};
	
	return through.obj(transform, flush);
};