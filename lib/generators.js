var request = require('request');
var fs = require('fs');
var util = require('util');
var cheerio = require('cheerio');
var colors = require('colors');
var sugar = require('sugar');
var parser = require('./parser');

function processSource(source, cb) {
  if(!source) {
    cli.help();
    return;
  }

  if(source.length < 1) {
    console.log('Nothing found. Check your CSS selector');
    return;
  }

  parser.findAll(source).each(function(item) {
    cb(item);
  });
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
        self.toFile(source, options.output);
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
    if(!fs.appendFile) {
      console.log('node 0.10 or higher is needed. Running ' + process.version);
      return;
    }

    fs.writeFile(filename, '');

    processSource(source, function(line) {
      var prefix = Array(line.depth+1).join('│ ');
      var elName = util.format('• %s', line.el || '');
      var componentName = (line.type === 'component' ? line.name.join(' ') : line.name.join(' '));
      var modifiers = !!line.modifiers.length && line.modifiers.join(' ') || '';
      var states = !!line.states.length && line.states.join(' ') || '';
      var id = line.id && ('#' + line.id) || '';

      fs.appendFile(filename, (prefix + elName + id + ' ' + componentName + ' ' + modifiers + ' ' + states).trim() + '\n');
    });
  }
}
