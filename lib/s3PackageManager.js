'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _awsSdk = require('aws-sdk');

var _streams = require('@verdaccio/streams');

var _s3Errors = require('./s3Errors');

var _deleteKeyPrefix = require('./deleteKeyPrefix');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const pkgFileName = 'package.json';

class S3PackageManager {

  constructor(config, packageName, logger) {
    this.config = config;
    this.packageName = packageName;
    this.logger = logger;
    this.s3 = new _awsSdk.S3({
      endpoint: this.config.endpoint,
      region: this.config.region,
      s3ForcePathStyle: this.config.s3ForcePathStyle
    });
  }

  updatePackage(name, updateHandler, onWrite, transformPackage, onEnd) {
    var _this = this;

    _asyncToGenerator(function* () {
      try {
        const json = yield _this._getData();
        updateHandler(json, function (err) {
          if (err) {
            onEnd(err);
          } else {
            onWrite(name, transformPackage(json), onEnd);
          }
        });
      } catch (err) {
        return onEnd(err);
      }
    })();
  }

  _getData() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      return yield new Promise(function (resolve, reject) {
        _this2.s3.getObject({
          Bucket: _this2.config.bucket,
          Key: `${_this2.config.keyPrefix}${_this2.packageName}/${pkgFileName}`
        }, function (err, response) {
          if (err) {
            reject((0, _s3Errors.convertS3Error)(err));
            return;
          }
          let data;
          try {
            data = JSON.parse(response.Body.toString());
          } catch (e) {
            reject(e);
            return;
          }
          resolve(data);
        });
      });
    })();
  }

  deletePackage(fileName, callback) {
    this.s3.deleteObject({
      Bucket: this.config.bucket,
      Key: `${this.config.keyPrefix}${this.packageName}/${fileName}`
    }, (err, data) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    });
  }

  removePackage(callback) {
    (0, _deleteKeyPrefix.deleteKeyPrefix)(this.s3, {
      Bucket: this.config.bucket,
      Prefix: `${this.config.keyPrefix}${this.packageName}`
    }, callback);
  }

  createPackage(name, value, callback) {
    this.s3.headObject({
      Bucket: this.config.bucket,
      Key: `${this.config.keyPrefix}${this.packageName}/${pkgFileName}`
    }, (err, data) => {
      if (err) {
        const s3Err = (0, _s3Errors.convertS3Error)(err);
        // only allow saving if this file doesn't exist already
        if ((0, _s3Errors.is404Error)(s3Err)) {
          this.savePackage(name, value, callback);
        } else {
          callback(s3Err);
        }
      } else {
        callback((0, _s3Errors.create409Error)());
      }
    });
  }

  savePackage(name, value, callback) {
    this.s3.putObject({
      Body: JSON.stringify(value, null, '  '),
      Bucket: this.config.bucket,
      Key: `${this.config.keyPrefix}${this.packageName}/${pkgFileName}`
    }, callback);
  }

  readPackage(name, callback) {
    var _this3 = this;

    _asyncToGenerator(function* () {
      try {
        const data = yield _this3._getData();
        callback(null, data);
      } catch (err) {
        callback(err);
      }
    })();
  }

  writeTarball(name) {
    const uploadStream = new _streams.UploadTarball();

    let streamEnded = 0;
    uploadStream.on('end', () => {
      streamEnded = 1;
    });

    const baseS3Params = {
      Bucket: this.config.bucket,
      Key: `${this.config.keyPrefix}${this.packageName}/${name}`
    };

    // NOTE: I'm using listObjectVersions so I don't have to download the full object with getObject.
    // Preferably, I'd use getObjectMetadata or getDetails when it's available in the node sdk
    // TODO: convert to headObject
    this.s3.headObject({
      Bucket: this.config.bucket,
      Key: `${this.config.keyPrefix}${this.packageName}/${name}`
    }, (err, response) => {
      if (err) {
        const convertedErr = (0, _s3Errors.convertS3Error)(err);
        if (!(0, _s3Errors.is404Error)(convertedErr)) {
          uploadStream.emit('error', convertedErr);
        } else {
          const managedUpload = this.s3.upload(Object.assign({}, baseS3Params, { Body: uploadStream }));
          // NOTE: there's a managedUpload.promise, but it doesn't seem to work

          const promise = new Promise((resolve, reject) => {
            managedUpload.send((err, data) => {
              if (err) {
                uploadStream.emit('error', (0, _s3Errors.convertS3Error)(err));
              } else {
                resolve();
              }
            });
            uploadStream.emit('open');
          });

          uploadStream.done = () => {
            const onEnd = (() => {
              var _ref3 = _asyncToGenerator(function* () {
                try {
                  yield promise;
                  uploadStream.emit('success');
                } catch (err) {
                  // already emitted in the promise above, necessary because of some issues
                  // with promises in jest
                }
              });

              return function onEnd() {
                return _ref3.apply(this, arguments);
              };
            })();
            if (streamEnded) {
              onEnd();
            } else {
              uploadStream.on('end', onEnd);
            }
          };

          uploadStream.abort = () => {
            try {
              managedUpload.abort();
            } catch (err) {
              uploadStream.emit('error', (0, _s3Errors.convertS3Error)(err));
            } finally {
              this.s3.deleteObject(baseS3Params);
            }
          };
        }
      } else {
        uploadStream.emit('error', (0, _s3Errors.create409Error)());
      }
    });

    return uploadStream;
  }

  readTarball(name) {
    const readTarballStream = new _streams.ReadTarball();

    const request = this.s3.getObject({
      Bucket: this.config.bucket,
      Key: `${this.config.keyPrefix}${this.packageName}/${name}`
    });

    let headersSent = false;

    const readStream = request.on('httpHeaders', (statusCode, headers) => {
      // don't process status code errors here, we'll do that in readStream.on('error'
      // otherwise they'll be processed twice

      // verdaccio force garbage collects a stream on 404, so we can't emit more
      // than one error or it'll fail
      // https://github.com/verdaccio/verdaccio/blob/c1bc261/src/lib/storage.js#L178

      if (headers['content-length']) {
        const contentLength = parseInt(headers['content-length'], 10);

        // not sure this is necessary
        if (headersSent) {
          console.log('********* headers already sent');
          return;
        }

        headersSent = true;

        readTarballStream.emit('content-length', contentLength);
        // we know there's content, so open the stream
        readTarballStream.emit('open');
      }
    }).createReadStream();

    readStream.on('error', err => {
      readTarballStream.emit('error', (0, _s3Errors.convertS3Error)(err));
    });

    readStream.pipe(readTarballStream);

    readTarballStream.abort = () => {
      request.abort();
      readStream.destroy();
    };

    return readTarballStream;
  }
}
exports.default = S3PackageManager;