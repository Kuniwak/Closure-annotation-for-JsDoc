JSDOC.PluginManager.registerPlugin(
  "JSDOC.closureLibraryBond",
  {
    onDocTag: function(tag) {
      var type = tag.type;
      // add Null to type if the type contains "?", such as: {?Array}
      type = type.replace(/\?([a-zA-Z_$][a-zA-Z0-9_$.]*[a-zA-Z0-9_$])/g,
                          '$1|Null');
      // remove "!" if the type contains "!", such as: {!Array}
      type = type.replace(/!/g, '');
      // set optional if the last character is "=", such as: {Array=}
      if (type.match(/=$/)) tag.isOptional = 'true';
      // add Undefined to type if the type contains "=", such as: {Array=}
      type = type.replace(/=/g, '|Undefined');
      // replace to capital cases
      type = type.replace(/string/g, 'String');
      type = type.replace(/boolean/g, 'Boolean');
      type = type.replace(/number/g, 'Number');
      // escapes "<" and ">", if the data type annotation has characters.
      type = type.replace(/</g, "&lt;");
      type = type.replace(/>/g, "&gt;");
      tag.type = type;
    },
    onDocCommentSrc: function(comment) {
      // @implements tag converts to @extends tag
      comment.src = comment.src.replace(/@implements/i, "@extends");
      comment.src = comment.src.replace(/@enum .*/i, "@namespace");
      // @const tag converts to @constant tag
      comment.src = comment.src.replace(/@const([^r]|$)/i, "@constant");
      // @extends tag and @type tag have type description on closure,
      // but each tags reqiure namepath on JsDoc.
      comment.src = comment.src.replace(/@extends \{([^\}]+)\}/i,
                                        "@extends $1");
      // if this object has @param or @return, it might be a function. But it
      // should not add @function, when the object has a @constructor tag.
      if (comment.src.match(/@(param|return)/) &&
          !comment.src.match(/@constructor/)) {
        comment.src += '@function\n';
      }
      if (comment.src.match(/^Base namespace for the Closure library/)) {
        LOG.warn('goog found');
        comment.src.replace(/@const/, '@namesoace');
      }
    },
    // adapt to "goog.provide" and "goog.addSingletonGetter"
    onFunctionCall: function(info) {
      if (info.name === 'goog.provide') {
        // TODO: Implements a goog.provide behavior.
        //       But now, it cannot get symbolSet,
        //       so it works when onFinishedParsing is called.
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
    },
    onSymbol: function(symbol) {
      var hierarchy = symbol.alias.split('.');
      symbol.parentSymbolAlias = hierarchy.slice(0, -1).join('.') || null;
    },
    onFinishedParsing: function(symbolSet) {
      var symbols = symbolSet.toArray();
      var addParentSymbolIfNeccesary = function(symbol) {
        var parentAlias = symbol.parentSymbolAlias;
        if (parentAlias) {
          if (!symbolSet.hasSymbol(parentAlias)) {
            var namepath = parentAlias.split('.');
            var name = namepath.pop();
            var newParentSymbol = new JSDOC.Symbol(
              /* String name              */ parentAlias,
              /* Array params             */ [],
              /* String isa               */ "OBJECT",
              /* JSDOC.DOcComment comment */ new JSDOC.DocComment([
                '/**',
                ' * @namespace',
                ' * @name ' + name,
                ' */'
              ].join('\n'))
            );
            symbolSet.addSymbol(newParentSymbol);
            addParentSymbolIfNeccesary(newParentSymbol);
          }
        }
      };

      var members = symbols.filter(function(symbol) {
        return !symbol.isNamespace && !symbol.is("FILE");
      });
      members.forEach(addParentSymbolIfNeccesary);
    }
  }
);
