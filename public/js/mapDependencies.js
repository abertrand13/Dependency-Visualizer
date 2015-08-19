function submitFiles(files) {
  console.log(files);

  var fileReader = new FileReader();
  
  fileReader.onload = function(event) {
    var fileData = fileReader.result;

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

  fileReader.readAsText(files[0]);
}