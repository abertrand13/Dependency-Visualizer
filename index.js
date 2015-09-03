var fs = require('fs');

console.log("Hello World");

fs.readdir('.', function(err, files) {
  if(err) {
    console.log(err);
  } else {
    console.log(files);
  }
});

wrap();

function wrap() {
  i = 1;
  recurse();

  function recurse() {
    console.log(i);
    i++;
    if(i < 10)
      recurse();
  }
}

module.exports = {
  helloWorld : function() {
    console.log("Hello World!");
    return "Hello World";
  },

  goodbyeWorld : function() {
    console.log("Goodbye World!");
  }
}
