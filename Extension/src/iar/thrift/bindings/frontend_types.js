//
// Autogenerated by Thrift Compiler (0.14.0)
//
// DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
//
"use strict";

var thrift = require('thrift');
var Thrift = thrift.Thrift;
var Q = thrift.Q;
var Int64 = require('node-int64');

var shared_ttypes = require('./shared_types');


var ttypes = module.exports = {};
ttypes.MsgIcon = {
  '0' : 'kMsgIconInfo',
  'kMsgIconInfo' : 0,
  '1' : 'kMsgIconQuestion',
  'kMsgIconQuestion' : 1,
  '2' : 'kMsgIconExclaim',
  'kMsgIconExclaim' : 2,
  '3' : 'kMsgIconStop',
  'kMsgIconStop' : 3
};
ttypes.MsgKind = {
  '0' : 'kMsgOk',
  'kMsgOk' : 0,
  '1' : 'kMsgOkCancel',
  'kMsgOkCancel' : 1,
  '2' : 'kMsgYesNo',
  'kMsgYesNo' : 2,
  '3' : 'kMsgYesNoCancel',
  'kMsgYesNoCancel' : 3
};
ttypes.MsgResult = {
  '0' : 'kMsgResOk',
  'kMsgResOk' : 0,
  '1' : 'kMsgResCancel',
  'kMsgResCancel' : 1,
  '2' : 'kMsgResYes',
  'kMsgResYes' : 2,
  '3' : 'kMsgResNo',
  'kMsgResNo' : 3
};
ttypes.FRONTEND_SERVICE = 'frontend';