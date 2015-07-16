/// <reference path="typings/bundle.d.ts" />
'use strict';

import fs = require('fs');
import path = require('path');
import merge = require('merge');
import gutil = require('gulp-util');
import through = require('through2');
import handlebars = require('handlebars');
import typedtable = require('typed-table');

class Tmpl {
	public tmpl: string;
	public cmpl: HandlebarsTemplateDelegate;
	constructor (tmplFilePath: string) {
		this.tmpl = fs.readFileSync(tmplFilePath, 'utf8');
		this.cmpl = handlebars.compile(this.tmpl);
	}
}

interface ITmplSet {
	defaults: Tmpl;
	[ tmplType: string ]: Tmpl;
}

interface ITmplSetDifined {
	[ tmplType: string ]: string;
}

var pkg = require('./package.json');

var gulpXlsx2html = function (tmplFilePath: string | ITmplSetDifined, options: { [option: string]: any }): NodeJS.ReadWriteStream {
	
	var pluginName: string = <string> pkg.name;
	
	var tmplSet: ITmplSet = {
		defaults: null
	};
	
	if (typeof tmplFilePath === 'string') {
		
		tmplSet.defaults = new Tmpl(tmplFilePath);
	
	} else {
		
		var tmplType: string;
		for (tmplType in tmplFilePath) {
			if (tmplFilePath.hasOwnProperty(tmplType)) {
				tmplSet[tmplType] = new Tmpl(tmplFilePath[tmplType]);
			}
		}
	
	}
	
	var data: any[] = [];
	
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

		var book: typedtable.TypedTable[] = typedtable.readExcel(xlsxFile.path, config);
		var table: typedtable.TypedTable = book[0];
		var json: any = table.toJSON();

		if (Array.isArray(json)) {
			data = data.concat(json);
		} else {
			data.push(json);
		}

		callback();
	}
	
	var flush = function (callback: any): any {

		var self = this;
		
		data.forEach(function (record, i) {
			
			var newPath: string;
			var tmpl: Tmpl;
			
			if (record.__FILE_PATH__) {
				newPath = record.__FILE_PATH__;
			} else {
				newPath = i + '.html';
			}
			
			if (record.__TMPL_TYPE__ && tmplSet[record.__TMPL_TYPE__]) {
				tmpl = tmplSet[record.__TMPL_TYPE__];
			} else {
				tmpl = tmplSet.defaults;
			}
			
			var html: string = tmpl.cmpl(record);
			var newFile: gutil.File = new gutil.File({
				path: newPath,
				contents: new Buffer(html)
			});
			self.push(newFile);
		});
		
		callback();
		
	};
	
	return through.obj(transform, <any> flush);
};

module.exports = gulpXlsx2html;