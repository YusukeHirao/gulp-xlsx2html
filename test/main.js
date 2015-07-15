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
			'Aあ',
			'Iい',
			'Uう',
			'Eえ',
			'Oお'
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