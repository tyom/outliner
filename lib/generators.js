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

  parser.findAll(source).each(function(item) {
    cb(item);
  });
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

module.exports = {
  fromFile: function(filePath, cssSelector) {
    try {
      var source = cheerio.load(fs.readFileSync(filePath), {
        ignoreWhiteSpace: true
      })(cssSelector);

      this.toConsole(source);
    } catch(e) {
      console.log('Source not found. Check and try again.');
    }
  },

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
      var prefix = Array(item.depth+1).join('│ ').grey;
      var elName = util.format('• %s'.white, item.el.cyan || '');
      var componentName = (item.type === 'component' ? item.name.join(' ').yellow : item.name.join(' ').white);
      var modifiers = !!item.modifiers.length && item.modifiers.join(' ').blue || '';
      var states = !!item.states.length && item.states.join(' ').green || '';
      var id = item.id && ('#' + item.id).red || '';

      console.log(prefix + elName + id, componentName, modifiers, states);
    });
  },

  toFile: function(source, filename) {
    var filePath = prepareFileForWrite(filename);
    var output = '';

    processSource(source, function(line) {
      var prefix = Array(line.depth+1).join('│ ');
      var elName = util.format('• %s', line.el || '');
      var componentName = (line.type === 'component' ? line.name.join(' ') : line.name.join(' '));
      var modifiers = !!line.modifiers.length && line.modifiers.join(' ') || '';
      var states = !!line.states.length && line.states.join(' ') || '';
      var id = line.id && ('#' + line.id) || '';

      output += (prefix + elName + id + ' ' + componentName + ' ' + modifiers + ' ' + states).trim() + '\n';
    });

    fs.writeFile(filePath, output);
  },

  toHtml: function(source, filename) {
    var filePath = prepareFileForWrite(filename);
    var htmlTemplatePath = path.resolve(settings.template.html);
    var $ = cheerio.load(fs.readFileSync(htmlTemplatePath));
    var $parent = $('#result');
    parentDepth = -1;

    function appendElement(element) {
      var $el = $($.parseHTML('<li>'));

      $el.text(element.el + ' : ' + element.depth + ' : ' + parentDepth);

      $parent.append($el);

      if(element.depth > parentDepth) {
        $parent = $el;
        parentDepth = element.depth;
      } else {
        // for (var i = 0; i < (parentDepth) - element.depth; i++) {
        //   $el = $el.parent();
        // };
        $parent = $el.parent();
        if(parentDepth - element.depth) {
          $parent = $el.parent();
        }
      }
    }

    processSource(source, appendElement);

    fs.writeFile(filePath, html.prettyPrint($.html(), { indent_size: 2 }));
  }
}
