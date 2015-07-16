var fs = require('fs');
var gutil = require('gulp-util');
var should = require('should');
var mocha = require('mocha');
var xlsx2html = require('../');

describe('gulp-xlsx2html', function () {
	
	this.timeout(20000);
	
	it('convert data', function (done) {
		
		var _xlsx = fs.readFileSync('./test/data.xlsx');
		var xlsx = new gutil.File({
			cwd: './',
			base: './test/',
			path: './test/data.xlsx',
			contents: _xlsx
		});

		var stream = xlsx2html('./test/tmpl.hbs');
		
		var counter = 0;
		var pathes = [
			'0.html',
			'1.html',
			'2.html',
			'3.html',
			'4.html'
		];
		var results = [
			'Aあ',
			'Iい',
			'Uう',
			'Eえ',
			'Oお'
		];
		
		stream.on('data', function (newFile) {
			
			var html = newFile.contents.toString('utf-8');
			
			newFile.path.should.equal(pathes[counter]);
			html.should.equal(results[counter]);
			
			counter++;
		});
		
		stream.once('end', done);
		
		stream.write(xlsx);
		stream.end();
		
	});

	it('convert pages', function (done) {
		
		var _xlsx = fs.readFileSync('./test/pages.xlsx');
		var xlsx = new gutil.File({
			cwd: './',
			base: './test/',
			path: './test/pages.xlsx',
			contents: _xlsx
		});

		var stream = xlsx2html({
			a: './test/pages-a.hbs',
			b: './test/pages-b.hbs',
			c: './test/pages-c.hbs',
			d: './test/pages-d.hbs',
			0: './test/pages-a.hbs',
			'"': './test/pages-quote.hbs',
			'日本語': './test/pages-ja.hbs'
		});
		
		var counter = 0;
		var pathes = [
			'a/a/a.html',
			'b/b/b/index.html',
			'b/b/b/c.html',
			'b/b/b/d/index.html',
			'zero/index.html',
			'_.html',
			'___.html'
		];
		var results = [
			'Aa',
			'Bb',
			'Cc',
			'Dd',
			'A0',
			'"&quot;"',
			'ja日本語'
		];
		
		stream.on('data', function (newFile) {
			
			var html = newFile.contents.toString('utf-8');
			
			newFile.path.should.equal(pathes[counter]);
			html.should.equal(results[counter]);
			
			counter++;
		});
		
		stream.once('end', done);
		
		stream.write(xlsx);
		stream.end();
		
	});

});