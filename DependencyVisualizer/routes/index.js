var fs = require('fs');

/*
 * GET home page.
 */

exports.index = function(req, res){
  //Recursively walk the file tree.
  var path = './';
  var fileData = 0;
  readFileTree(path);

  function readFileTree(path) {
    fs.readdir(path, function(err, files) {
      if(err) {
        console.log(err);
        return;
      } else {
        files.map(function(file) {
          if(fs.statSync(path + file).isFile()) {
            //If we've hit a file, perform some action
            console.log(path + file);
          } else {
            //If we've hit a directory, read through it
            readFileTree(path + file + '/');
          }
        });
      }
    });
  }

  res.render('index', { title: 'Express' });
};
