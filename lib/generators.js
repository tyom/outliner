var request = require('request');
var fs = require('fs');
var path = require('path');
var util = require('util');
var cheerio = require('cheerio');
var html = require('html');
var colors = require('colors');
var sugar = require('sugar');
var settings = require('../settings.json');
var parser = require('./parser');
var mkdirp = require('mkdirp');

function processSource(source, cb) {
  if(!source) {
    cli.help();
    return;
  }

  if(source.length < 1) {
    console.log('Nothing found. Check your CSS selector.');
    return;
  }

  return parser.augment(source).each(function(item) {
    cb(item);
  });

  // parser.findAll(source).each(function(item) {
  //   cb(item);
  // });
}

function prepareFileForWrite(filename) {
  if(!fs.appendFile) {
    console.log(util.format('Node 0.10 or higher is needed. Running %s.', process.version));
    return;
  }

  var filePath = path.resolve(settings.outputDir, filename);
  mkdirp(path.dirname(filePath));

  return filePath;
}

function processItem(item) {
  return {
    prefix: Array(item.depth+1).join('│ '),
    elem: item.name || '',
    components: item.components.join(' '),
    parts: item.parts.join(' '),
    modifiers: !!item.modifiers.length && item.modifiers.join(' ') || '',
    states: !!item.states.length && item.states.join(' ') || '',
    id: item.id && ('#' + item.id) || ''
  }
}

module.exports = {
  // fromFile: function(filePath, cssSelector) {
  //   try {
  //     var source = cheerio.load(fs.readFileSync(filePath), {
  //       ignoreWhiteSpace: true
  //     })(cssSelector);

  //     this.toConsole(source);
  //   } catch(e) {
  //     console.log('Source not found. Check and try again.');
  //   }
  // },

  fromUrl: function(url, options) {
    var self = this;
    request(url, function(err, resp, body){
      if(err) {
        console.log(err);
        return;
      }

      var source = cheerio.load(body, {
        ignoreWhiteSpace: true
      })(options.css);

      if(options.output) {
        if(typeof options.output !== 'string') {
          console.log('\n  error: `-o, --output` option requires a filename\n');
          return;
        }
        if(options.format === 'text') {
          self.toFile(source, options.output);
        } else if(options.format === 'html') {
          self.toHtml(source, options.output);
        } else {
          console.log('\n  error: `' + options.format +'` is an unknown format. Use `text` or `html`.\n');
          options.help();
        }
      } else {
        self.toConsole(source);
      }
    });
  },

  toConsole: function(source) {
    processSource(source, function(item) {
      var i = processItem(item);

      console.log(
        i.prefix.grey + '•'.white,
        i.elem.cyan + i.id.red,
        i.components.yellow,
        i.parts.white,
        i.modifiers.blue,
        i.states.green
      );
    });
  },

  toFile: function(source, filename) {
    var filePath = prepareFileForWrite(filename);
    var output = [];

    processSource(source, function(item) {
      var i = processItem(item);

      output.push((i.prefix + i.elem + i.id + ' ' + i.components + ' ' + i.modifiers + ' ' + i.states).trim());
    });

    fs.writeFile(filePath, output.join('\n'));
  },

  toHtml: function(source, filename) {
    var filePath = prepareFileForWrite(filename);
    var htmlTemplatePath = path.resolve(settings.template.html);
    var $ = cheerio.load(fs.readFileSync(htmlTemplatePath));
    var $parent = $('#result');
    parentDepth = -1;

    function formatElement(element) {
      var $el = $($.parseHTML('<i>'));

      $el.text(util.format('%s%s %s', element.name, element.id && '#' + element.id || '', element.modifiers.join('.')));

      return $el;

      // $(element.parent).append($el);

      // if(element.depth > parentDepth) {
      //   $parent = $el;
      //   parentDepth = element.depth;
      // } else {
      //   // for (var i = 0; i < (parentDepth) - element.depth; i++) {
      //   //   $el = $el.parent();
      //   // };
      //   $parent = $el.parent();
      //   if(parentDepth - element.depth) {
      //     $parent = $el.parent();
      //   }
      // }
    }

    $('#result').append(processSource(source, formatElement));
    // $('#result').append(source);

    fs.writeFile(filePath, html.prettyPrint($.html(), { indent_size: 2 }));
  }
}
