var fs = require('fs');
var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Dependency Visualizer' });
});

router.get('/map',  function(req, res, next) {
  //get root path from config file
  var root;
  console.log('checking config');
  if(fs.existsSync('config.txt')); {
    rootFolder = fs.readFileSync('config.txt', {encoding: 'ascii'});
    console.log(rootFolder);
    rootFolder = rootFolder.trim();
  }
  root = root || '';

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
      if(!fs.existsSync(newPath)) return; //fix for broken symlinks.  This should eventually be fixed

      if(fs.statSync(newPath).isFile()) {
        //If we've hit a file, read it for it's dependencies
        var data = fs.readFileSync(newPath);
        var fileData = data.toString();

        var filePathFilter = new RegExp(/\.\/([\w\/-]+)\.\w+/g);
        var match = filePathFilter.exec(newPath);
        if(!match) return;

        var processedPath = match[1]; //get matching string, (without initial ./ and ending .js)
        fileDependencies[processedPath] = {};

        var defineStatementRegex = new RegExp(/define\(\[\n(\s+\'[\w\/!$-]+\',\n)+(\s+\'[\w\/!$-]+\'\n)\],/g);
        var defineStatement = defineStatementRegex.exec(fileData);

        if(!defineStatement) return;
        defineStatement = defineStatement[0]; //only get the matched string

        var dependencyRegex = new RegExp(/\'([\w\/]+)\'/g);
        var match, dependencies = [];

        // Blacklist common library dependencies that don't really tell us anything.
        var blacklist = ["backbone", "jquery", "underscore", "require"];

        while(match = dependencyRegex.exec(defineStatement)) {
          // take the capturing group (without the single quotes) instead of the whole match
          var exactMatch = match[1];
          if(blacklist.indexOf(exactMatch) == -1) {
              //HACKY AF FIX.  Fix this.
              dependencies.push(rootFolder + exactMatch);
          }
        }
        
        if(dependencies.length != 0) {
          fileDependencies[processedPath]["dependencies"] = dependencies;
        }

      } else {
        //If we've hit a directory, read through it
        readFileTree(newPath + '/');
      }
    });
  }

  res.json(fileDependencies);
});

module.exports = router;
