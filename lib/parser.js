var walker = require('./tree-walker');
var sugar = require('sugar');
var syntax = require('../settings.json').syntax;

function classToRegex(string) {
  var regex = new RegExp();
  return new RegExp(string.replace('{class}', '[\\w-]+', 'i'));
}

var PART = classToRegex(syntax.part);
var MODIFIER = classToRegex(syntax.modifier);
var STATE = classToRegex(syntax.state);

function getClassNames(el){
  return el.attribs && el.attribs.class && (el.attribs.class.replace(/\s+/g, " ").trim().split(/\s/)) || [];
}

module.exports = {
  getModifiers: function(el) {
    return getClassNames(el).findAll(MODIFIER);
  },

  getStates: function(el) {
    return getClassNames(el).findAll(STATE);
  },

  getComponentName: function(el) {
    var classes = getClassNames(el)
      .exclude(PART)
      .exclude(MODIFIER)
      .exclude(STATE);

    if(classes.length === 0) {
      return null;
    } else if (classes.length === 1) {
      return classes[0];
    }
    return classes;
  },

  getPartName: function(el) {
    return getClassNames(el).find(PART);
  },

  getElementName: function(el) {
    return el.name;
  },

  isComponent: function(el) {
    var classes = getClassNames(el)
      .exclude(PART)
      .exclude(MODIFIER)
      .exclude(STATE);
    return classes.length > 0;
  },

  isPart: function(el){
    return !!this.getPartName(el);
  },

  hasModifiers: function(el) {
    return this.getModifiers(el).length > 0;
  },

  hasStates: function(el) {
    return this.getState.length > 0;
  },

  findParts: function(root) {
    var parser = this;
    var parts = [];

    root.each(function(i, item) {
      walker.walk(item, function(depth) {
        if(parser.isPart(this)) {
          parts.push({
            depth: depth,
            el: parser.getElementName(this),
            name: parser.getPartName(this),
            modifiers: parser.getModifiers(this),
            states: parser.getStates(this)
          });
        }
      });
    });

    return parts;
  },

  findComponents: function(root) {
    var parser = this;
    var components = [];

    root.each(function(i, item) {
      walker.walk(item, function(depth) {
        if(parser.isComponent(this)) {
          components.push({
            depth: depth,
            el: parser.getElementName(this),
            name: parser.getComponentName(this),
            modifiers: parser.getModifiers(this),
            states: parser.getStates(this)
          });
        }
      });
    });

    return components;
  },

  findAll: function(root) {
    var parser = this;
    var allElements = [];

    root.each(function(i, item) {
      walker.walk(item, function(depth) {
        var type = parser.isComponent(this) && 'component' || parser.isPart && 'part';

        allElements.push({
          depth: depth,
          el: parser.getElementName(this),
          name: parser.getComponentName(this) || parser.getPartName(this) || '',
          type: type,
          modifiers: parser.getModifiers(this),
          states: parser.getStates(this)
        });
      });
    });

    return allElements;
  }
};