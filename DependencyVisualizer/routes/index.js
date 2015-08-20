var fs = require('fs');

/*
 * GET home page.
 */

exports.index = function(req, res) {
  res.render('index', { title: 'Express' });
}

exports.map = function(req, res){
  //Recursively walk the file tree.
  var path = './';
  var fileDependencies = {};
  readFileTree(path);

  function readFileTree(path) {
    var files = fs.readdirSync(path);
    
    //Process each item in the directory.  If it's a file, try to get it's dependencies.
    //If it's a folder, process every item in it. 
    files.map(function(file) {
      var newPath = path + file;
      if(fs.statSync(newPath).isFile()) {
        //If we've hit a file, read it for it's dependencies
        console.log(newPath);
        var data = fs.readFileSync(newPath);
        var fileData = data.toString();

        var defineStatementRegex = new RegExp(/define\(\[\n(\s+\'[\w\/]+\',\n)+(\s+\'[\w\/]+\'\n)\],/g);
        var defineStatement = defineStatementRegex.exec(fileData);
        if(!defineStatement) return;
        defineStatement = defineStatement[0]; //only get the matched string

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

        fileDependencies[newPath] = {};
        fileDependencies[newPath]["dependencies"] = dependencies;
      } else {
        //If we've hit a directory, read through it
        readFileTree(newPath + '/');
      }
    });
  }

  res.json(fileDependencies);
};
