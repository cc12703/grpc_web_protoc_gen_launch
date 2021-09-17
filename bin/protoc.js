#!/usr/bin/env node


'use strict';

var path = require('path');
var execFile = require('child_process').execFile;

var exe_ext = process.platform === 'win32' ? '.exe' : '';

var protoc = path.resolve(__dirname, 'protoc' + exe_ext);

var plugin = path.resolve(__dirname, 'grpc_web_plugin' + exe_ext);

var args = ['--plugin=protoc-gen-grpc-web=' + plugin].concat(process.argv.slice(2));

var child_process = execFile(protoc, args, function(error, stdout, stderr) {
  if (error) {
    throw error;
  }
});

child_process.stdout.pipe(process.stdout);
child_process.stderr.pipe(process.stderr);