/*global top: true, jasmine: true */

var fs = require('fs')
  , path = require('path');

function convertToAbsolutePaths(paths) {
  var rootPath = fs.realpathSync('.')
    , i;
  for (i = 0; i < paths.length; i++) {
    paths[i] = rootPath + '/' + paths[i];
  }
}

var dir = {
    reports:'reports',
    spec:'spec'
  },
  verifyFiles = [
    'app.js',
    'calendars.js',
    'grunt.js',
    'lib/**/*.js',
    'routes/*/*.js'
  ];

module.exports = function (grunt) {
  var gruntConfig;
  convertToAbsolutePaths(verifyFiles);
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-jslint');
  grunt.loadNpmTasks('grunt-jasmine-node-cover');
  grunt.registerTask('verify', 'jslint');
  if ((fs.existsSync ? fs : path).existsSync(dir.spec)) {
    grunt.registerTask('test', 'jasmine_node_cover');
  } else {
    grunt.registerTask('test', function () {
      grunt.log.writeln('no test found');
    });
  }
  grunt.registerTask('default', 'verify test');
  gruntConfig = {
    pkg:'<json:package.json>',
    clean:{
      'default':[dir.reports]
    },
    jslint:{
      files:verifyFiles,
      directives:{
        require:false,
        node:true,
        sloppy:true,
        white:true,
        nomen:true,
        stupid:true,
        regexp:true,
        unparam:true,
        plusplus:true,
        vars:true
      },
      options:{
        errorsOnly:true,
        jslintXml:dir.reports + '/jslint.xml',
        failOnError:false
      }
    },
    jasmine_node_cover:{
      jasmine:{
        specFolder:dir.spec,
        isVerbose:false,
        showColors:true,
        teamcity:false,
        useRequireJs:false,
        regExpSpec:new RegExp('..*Spec\\.(js)$', 'i'),
        junitreport:{
          report:true,
          savePath:dir.reports + '/',
          useDotNotation:true,
          consolidate:true
        }
      }
    }
  };
  var testOption = grunt.option('test');
  if (testOption) {
    gruntConfig.jasmine_node_cover.jasmine.specNameMatcher = testOption;
  }
  grunt.initConfig(gruntConfig);
};