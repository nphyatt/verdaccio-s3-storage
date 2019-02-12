'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.is404Error = is404Error;
exports.create404Error = create404Error;
exports.is409Error = is409Error;
exports.create409Error = create409Error;
exports.is503Error = is503Error;
exports.create503Error = create503Error;
exports.convertS3Error = convertS3Error;


class VerdaccioError extends Error {
  constructor(message, httpCode, code) {
    super(message);
    this.httpCode = httpCode;
    this.code = code;
  }
}

const error404Code = 'ENOENT';

function is404Error(err) {
  return err.code === error404Code;
}

function create404Error() {
  return new VerdaccioError('no such package available', 404, error404Code);
}

const error409Code = 'EEXISTS';

function is409Error(err) {
  return err.code === error409Code;
}

function create409Error() {
  return new VerdaccioError('file exists', 409, error409Code);
}

const error503Code = 'EAGAIN';

function is503Error(err) {
  return err.code === error503Code;
}

function create503Error() {
  return new VerdaccioError('resource temporarily unavailable', 500, error503Code);
}

function convertS3Error(err) {
  switch (err.code) {
    case 'NoSuchKey':
    case 'NotFound':
      return create404Error();
    case 'RequestAbortedError':
      return new VerdaccioError('request aborted', 0, 'ABORTED');
    default:
      return err;
  }
}