gulp-xlsx2html
===

gulp-xlsx2html is [Gulp](https://github.com/gulpjs/gulp) extension to convert XLSX file to HTML in the pipeline.
[Gulp is a streaming build system](https://github.com/gulpjs/gulp) utilizing [node.js](http://nodejs.org/).

```js
var xlsx2html = require('gulp-xlsx2html');
```

## Usage

```js
gulp.src('./data.xlsx')
	.pipe(xlsx2html('./tmpl/tmpl.hbs', {
		header: 0,
		type: 1,
		label: null
	}))
	.pipe(gulp.dest('./dist/');
```

## API

### xlsx2html(tmplFilePath, options)

#### tmplFilePath

Type: `string`
Default: none

The template file path of [handlebars](http://handlebarsjs.com/).

#### options

Type: `Object`
Default `undefined`

The optional parameters.

key|type|default|summary
---|---|---|---
**header**|`number`|`0`|the row number of field name header in XLSX file.
**type**|`number`|`1`|the row number of field type in XLSX file.
**label**|`number`|`null`|the row number of field label in XLSX file.
