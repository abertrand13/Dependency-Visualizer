var fs = require('fs');

exports.getDependencies = function(req, res) {
  fs.open('~/.code/firebird/static/dev/scripts/c2013/model/searchContentList.js', 'r', function(err, fd) {
    console.log('')
    console.log('success');
  }
}