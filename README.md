gulp-xlsx2html [![npm version](https://badge.fury.io/js/gulp-xlsx2html.svg)](http://badge.fury.io/js/gulp-xlsx2html) [![Build Status](https://travis-ci.org/YusukeHirao/gulp-xlsx2html.svg?branch=master)](https://travis-ci.org/YusukeHirao/gulp-xlsx2html) [![Dependency Status](https://david-dm.org/yusukehirao/gulp-xlsx2html.svg)](https://david-dm.org/yusukehirao/gulp-xlsx2html) [![devDependency Status](https://david-dm.org/yusukehirao/gulp-xlsx2html/dev-status.svg)](https://david-dm.org/yusukehirao/gulp-xlsx2html#info=devDependencies)
===

gulp-xlsx2html is [Gulp](https://github.com/gulpjs/gulp) extension to convert XLSX file to HTML in the pipeline.
[Gulp is a streaming build system](https://github.com/gulpjs/gulp) utilizing [node.js](http://nodejs.org/).

```js
var xlsx2html = require('gulp-xlsx2html');
```

## Usage

```js
// single template
gulp.src('./data.xlsx')
	.pipe(xlsx2html('./tmpl/tmpl.hbs'))
	.pipe(gulp.dest('./dist/');

// multiple template
gulp.src('./data.xlsx')
	.pipe(xlsx2html({
		templateType1: './tmpl/type1.hbs',
		templateType2: './tmpl/type2.hbs'
	}, {
		header: 0,
		type: 1
	}))
	.pipe(gulp.dest('./dist/');
```

## API

### xlsx2html(tmplFilePath [, options])

#### tmplFilePath

##### 1. single template

- Type: `string`
- Required

The template file path of [handlebars](http://handlebarsjs.com/).

##### 2. multiple template

- Type: `[ tmplType: string ]: string`
- Required

Template files path of [handlebars](http://handlebarsjs.com/) in hash object.

**tmplType** is value of the field name `__TMPL_TYPE__` in XLSX file.

ex)

```js
xlsx2html({
	templateType1: './tmpl/type1.hbs',
	templateType2: './tmpl/type2.hbs'
})
```

#### options

- Type: `Object`
- Optional
- Default `undefined`

The optional parameters.

key|type|default|summary
---|---|---|---
**header**|`number`|`0`|the row number of field name header in XLSX file.
**type**|`number`|`1`|the row number of field type in XLSX file.
**label**|`number`|`null`|the row number of label in XLSX file.
**description**|`number`|`null`|the row number of description in XLSX file.

## Contribution

### Install

```sh
$ npm install
$ dtsm install
```

### Compile

```sh
$ tsc index.ts --module commonjs
```

### Test

```sh
$ npm test
```
