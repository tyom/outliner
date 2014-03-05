var request = require('request');
var fs = require('fs');
var util = require('util');
var cheerio = require('cheerio');
var colors = require('colors');
var sugar = require('sugar');
var parser = require('./parser');

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

  fromUrl: function(url, cssSelector) {
    var self = this;
    request(url, function(err, resp, body){
      if(err) {
        console.log(err);
        return;
      }

      var source = cheerio.load(body, {
        ignoreWhiteSpace: true
      })(cssSelector);

      self.toConsole(source);
    });
  },

  toConsole: function(source) {
    if(source) {
      if(source.length < 1) {
        console.log('Nothing found. Check your CSS selector');
        return;
      }

      parser.findAll(source).each(function(item) {
        var prefix = Array(item.depth+1).join("│ ");
        var elName = util.format('• %s'.white, item.el && item.el.cyan || '');
        var componentName = (item.type === 'component' ? item.name.join(' ').yellow : item.name.join(' ').white);
        var modifiers = !!item.modifiers.length && item.modifiers.join(' ').blue || '';
        var states = !!item.states.length && item.states.join(' ').green || '';
        var id = item.id && ('#' + item.id).red || '';

        console.log(prefix.grey + elName + id, componentName, modifiers, states);
      });
    } else {
      cli.help();
    }
  }
}