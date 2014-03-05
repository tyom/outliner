/*!
 * Small Walker - v0.1.1 - 5/5/2011
 * http://benalman.com/
 *
 * Copyright (c) 2011 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */

// Walk the DOM, depth-first (HTML order). Inside the callback, `this` is the
// element, and the only argument passed is the current depth. If the callback
// returns false, its children will be skipped.
//
// Based on https://gist.github.com/240274

exports.walk = function(node, callback) {
  var skip, tmp;
  // This depth value will be incremented as the depth increases and
  // decremented as the depth decreases. The depth of the initial node is 0.
  var depth = 0;

  node = node.length ? node[0] : node;

  // Always start with the initial element.
  do {
    if ( !skip && node.type !== "text") {
      // Call the passed callback in the context of node, passing in the
      // current depth as the only argument. If the callback returns false,
      // don't process any of the current node's children.
      skip = callback.call(node, depth) === false;
    }

    if ( !skip && (tmp = node.children && node.children[0]) ) {
      // If not skipping, get the first child. If there is a first child,
      // increment the depth since traversing downwards.
      depth++;
    } else if ( tmp = node.next ) {
      // If skipping or there is no first child, get the next sibling. If
      // there is a next sibling, reset the skip flag.
      skip = false;
    } else {
      // Skipped or no first child and no next sibling, so traverse upwards,
      tmp = node.parent;
      // and decrement the depth.
      depth--;
      // Enable skipping, so that in the next loop iteration, the children of
      // the now-current node (parent node) aren't processed again.
      skip = true;
    }

    // Instead of setting node explicitly in each conditional block, use the
    // tmp var and set it here.
    node = tmp;

  // Stop if depth comes back to 0 (or goes below zero, in conditions where
  // the passed node has neither children nore next siblings).
  } while ( depth > 0 );
};
