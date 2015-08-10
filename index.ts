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

interface IXLSXRecord {
	__AVAILABLED__?: boolean;
	__FILE_PATH__?: string;
	__TMPL_TYPE__?: string;
	__NOT_BELONG__?: boolean;
	__DIR__?: string;
	_isDetail?: boolean;
	_index: number;
	_indexHumanCountable: number;
	_detailsLength?: number;
	_file?: string;
	_path?: string;
	_details?: IXLSXRecord[];
	_parent?: IXLSXRecord;
	_prev: IXLSXRecord;
	_next: IXLSXRecord;
	_tmpl?: Tmpl;
	[ dataProp: string ]: any;
}

interface IPathRecord {
	index: IXLSXRecord;
	details: IXLSXRecord[];
}

interface IPathList {
	[ path: string ]: IPathRecord;
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
		var pathList: IPathList = {};
		var outputs: IXLSXRecord[] = [];
		
		data.forEach(function (recordData, i) {
			
			var record: IXLSXRecord = <IXLSXRecord> recordData;
			
			var newPath: string;
			var newDir: string;
			var newFileName: string;
			var isIndex: boolean = false;
			var tmpl: Tmpl;

			if (record.__AVAILABLED__ === false) {
				return;
			}

			/**
			 * A value is removed line break when type is string.
			 * Add new value that is converted line break code to "<br>" tag. And then key name is added "_br".
			 */
			for (let prop in record) {
				if (record.hasOwnProperty(prop)) {
					let val: any = record[prop];
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
			} else {
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
			} else {
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
			} else if (!record.__NOT_BELONG__) {
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

			var _tmp: IXLSXRecord = null;
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

			var html: string = record._tmpl.cmpl(record);
			var newFile: gutil.File = new gutil.File({
				path: record._path,
				contents: new Buffer(html)
			});
			self.push(newFile);
		});
		
		callback();
		
	};
	
	return through.obj(transform, <any> flush);
};

module.exports = gulpXlsx2html;