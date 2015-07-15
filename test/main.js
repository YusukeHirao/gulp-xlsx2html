var fs = require('fs');
var gutil = require('gulp-util');
var should = require('should');
var mocha = require('mocha');
var xlsx2html = require('../');

describe('gulp-xlsx2html', function () {
	
	this.timeout(20000);
	
	it('convert html', function (done) {
		
		var _xlsx = fs.readFileSync('./test/pages.xlsx');
		var xlsx = new gutil.File({
			cwd: './',
			base: './test/',
			path: './test/pages.xlsx',
			contents: _xlsx
		});

		var stream = xlsx2html('./test/tmpl.hbs');
		
		var counter = 0;
		var results = [
			'AMon Mar 02 2015 09:00:00 GMT+0900 (JST)あ',
			'ITue Mar 03 2015 09:00:00 GMT+0900 (JST)い',
			'UWed Mar 04 2015 09:00:00 GMT+0900 (JST)う',
			'EThu Mar 05 2015 09:00:00 GMT+0900 (JST)え',
			'OThu Mar 05 2015 09:00:00 GMT+0900 (JST)お'
		];
		
		stream.on('data', function (newFile) {
			
			var html = newFile.contents.toString('utf-8');
			
			html.should.equal(results[counter]);
			
			counter++;
		});
		
		stream.once('end', done);
		
		stream.write(xlsx);
		stream.end();
		
	});
	
});