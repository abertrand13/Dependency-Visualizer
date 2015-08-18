var testData = "define([\n  'ENV',\n  'framework/bmodel',\n  'bv/c2013/model/contentList',\n  'underscore',\n  'jquery'\n],crapcrapcrap";

var defineStatementRegex = new RegExp(/define\(\[\n(\s+\'[\w\/]+\',\n)+(\s+\'[\w\/]+\'\n)\],/g);
var defineStatement = defineStatementRegex.exec(testData)[0]; //only get the matched string

var dependencyRegex = new RegExp(/\'([\w\/]+)\'/g);
var match, dependencies = [];

var blacklist = ["ENV", "underscore", "jquery"];

while(match = dependencyRegex.exec(defineStatement)) {
  // take the capturing group (without the single quotes) instead of the whole match
  var exactMatch = match[1];
  if(blacklist.indexOf(exactMatch) == -1) {
    dependencies.push(exactMatch);
  }
}

console.log(dependencies);