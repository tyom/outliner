var walker = require('./tree-walker');
var sugar = require('sugar');
var settings = require('../settings.json');
var syntax = settings.syntax;

function classToRegex(string) {
  var regex = new RegExp();
  return new RegExp(('^' + string).replace('{class}', '[\\w-_]+', 'i'));
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
    return getClassNames(el)
      .exclude(PART)
      .exclude(MODIFIER)
      .exclude(STATE);
  },

  getPartName: function(el) {
    return getClassNames(el).findAll(PART);
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
    return this.getPartName(el) > 0;
  },

  hasModifiers: function(el) {
    return this.getModifiers(el).length > 0;
  },

  hasStates: function(el) {
    return this.getState.length > 0;
  },

  findAll: function(source) {
    var parser = this;
    var elements = [];

    source.each(function(i, item) {
      walker.walk(item, function(depth) {

        var element = parser.getElementName(this);

        if(!element || this.type === "script") {
          return;
        }

        var type = parser.isComponent(this) ? 'component' : parser.isPart(this) ? 'part' : null;
        var name = parser.getComponentName(this) || parser.getPartName(this);

        elements.push({
          depth: depth,
          el: element,
          name: name,
          type: type,
          id: this.attribs.id,
          modifiers: parser.getModifiers(this),
          states: parser.getStates(this),
          last: this.attribs['last-child']
        });
      });
    });
    return elements;
  }

  // findParts: function(source) {
  //   var parser = this;
  //   var parts = [];

  //   source.each(function(i, item) {
  //     walker.walk(item, function(depth) {
  //       if(parser.isPart(this)) {
  //         parts.push({
  //           depth: depth,
  //           el: parser.getElementName(this),
  //           name: parser.getPartName(this),
  //           modifiers: parser.getModifiers(this),
  //           states: parser.getStates(this)
  //         });
  //       }
  //     });
  //   });

  //   return parts;
  // },

  // findComponents: function(source) {
  //   var parser = this;
  //   var components = [];

  //   source.each(function(i, item) {
  //     walker.walk(item, function(depth) {
  //       if(parser.isComponent(this)) {
  //         components.push({
  //           depth: depth,
  //           el: parser.getElementName(this),
  //           name: parser.getComponentName(this),
  //           modifiers: parser.getModifiers(this),
  //           states: parser.getStates(this)
  //         });
  //       }
  //     });
  //   });

  //   return components;
  // },
};
