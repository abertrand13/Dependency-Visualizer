#! /usr/bin/env node

//module for running command line stuff
var exec = require('child_process').exec;
var execSync = require('exec-sync');

var userArgs = process.argv.slice(2);
var rootFile = userArgs[0] || '';

//save root file in a config file
var saveConfig = exec('echo ' + rootFile + ' > config.txt',
  function(err, stdout, stderr) {
    console.log(stdout);
    if(err) {
      console.log(err);
    }
    if(stderr) {
      console.log(stderr);
    }

    /*var serveSite = exec('npm start',
      function(err, stdout, stderr) {
        console.log(stdout);
        if(stderr) console.log(stderr);
        if(err) console.log(err);
      });*/
    var start = execSync('npm start');
    console.log(start);
  });
