JSDOC.PluginManager.registerPlugin(
  "JSDOC.closureLibraryBond",
  {
    onDocCommentSrc: function(comment) {
      comment.src = comment.src.replace(/@implements/i, "@extends");
      comment.src = comment.src.replace(/@extends \{([^\}]+)\}/i, "@extends $1");
    },
    onFunctionCall: function(info) {
      if (info.name === 'goog.require') {
        var name = info.tokenStream[1].data;
      } else if (info.name === 'goog.provide') {
        var name = info.tokenStream[1].data.replace(/'/g, '');
        if (name.match(/\.[^a-z].*$/)) {
          var text = [
            '/**',
            ' * @namespace',
            ' * @name ' + name,
            ' */'
          ].join('\n');
          info.doc = text;
        }
      }
    }
  }
);
