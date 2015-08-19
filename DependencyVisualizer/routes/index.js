var fs = require('fs');

/*
 * GET home page.
 */

exports.index = function(req, res){
  //Recursively walk the file tree.
  var path = './';
  var fileData = {};
  readFileTree(path);

  function readFileTree(path) {
    fs.readdir(path, function(err, files) {
      if(err) {
        console.log(err);
        return;
      } else {
        files.map(function(file) {
          var newPath = path + file;
          if(fs.statSync(newPath).isFile()) {
            //If we've hit a file, read it for it's dependencies
            console.log(newPath);
            fs.readFile('newPath', function(error, data) {
              if(error) {
                console.log(error);
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

                fileData.newPath.dependencies = dependencies;
                console.log(dependencies);
              }
            });
          } else {
            //If we've hit a directory, read through it
            readFileTree(newPath + '/');
          }
        });
      }
    });
  }

  res.render('index', { title: 'Express' });
};
