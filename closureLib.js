var currentConstructor;

JSDOC.PluginManager.registerPlugin(
  "JSDOC.closureLibraryBond",
  {
    onDocCommentSrc: function(comment) {
      // implements tag convert to extends
      comment.src = comment.src.replace(/@implements/i, "@extends");
      // extends tag has type description in closure, but extends tag reqiures
      // namepath in JsDoc.
      comment.src = comment.src.replace(/@extends \{([^\}]+)\}/i,
                                        "@extends $1");
      // if this object has @param or @return, it might be function. But it
      // should not add @function, when the objects had @constructor.
      if (comment.src.match(/@(param|return)/) &&
          !comment.src.match(/@constructor/)) {
        comment.src += '@function\n';
      }
    },
    onFunctionCall: function(info) {
      if (info.name === 'goog.require') {
        var name = info.tokenStream[1].data;
      } else if (info.name === 'goog.provide') {
        var name = info.tokenStream[1].data.replace(/'/g, '');
        // if goog.provide is called, it provide namespace that has a name from
        // the argument.
        if (name.match(/(\.[a-z_$][a-zA-Z0-9_$]+$|^[a-z_$]+$)/)) {
          // it doesn't work, and the cause was unkwoun.
          // Namespace(name);
          LOG.warn(name);
          var text = [
            '/**',
            ' * @namespace',
            ' * @name ' + name,
            ' */'
          ].join('\n');
          info.doc = text;
        }
      } else if (info.name === 'goog.addSingletonGetter') {
        // if goog.addSingletonGetter is called, it adds a ".getInstance"
        // method to the object from argument.
        var name = info.tokenStream[1].data.replace(/'/g, '');
        var text = [
          '/**',
          ' * @function',
          ' * @name ' + name + '.getInstance',
          ' * @return {' + name + '} An unique instance.',
          ' */'
        ].join('\n');
        info.doc = text;
      }
    }
  }
);
