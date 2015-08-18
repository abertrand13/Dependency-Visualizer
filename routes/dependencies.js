var fs = require('fs');

exports.list = function(req, res) {
  //need to change how to get to directory
  fs.readFile('../firebird/static/dev/scripts/bv/c2013/model/searchContentList.js', function(err, data) {
    if(err) {
      console.log(err);
    } else {
      var fileData = data.toString();

      var defineStatementRegex = new RegExp(/define\(\[\n(\s+\'[\w\/]+\',\n)+(\s+\'[\w\/]+\'\n)\],/g);
      var defineStatement = defineStatementRegex.exec(fileData)[0]; //only get the matched string

      var dependencyRegex = new RegExp(/\'([\w\/]+)\'/g);
      var match, dependencies = [];

      // Blacklist common library dependencies that don't really tell us anything.
      var blacklist = ["ENV", "underscore", "jquery"];

      while(match = dependencyRegex.exec(defineStatement)) {
        // take the capturing group (without the single quotes) instead of the whole match
        var exactMatch = match[1];
        if(blacklist.indexOf(exactMatch) == -1) {
          dependencies.push(exactMatch);
        }
      }

      console.log(dependencies);
    }
  });
  
  res.render('index', { title: 'Express' });
}