'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _awsSdk = require('aws-sdk');

var _s3PackageManager = require('./s3PackageManager');

var _s3PackageManager2 = _interopRequireDefault(_s3PackageManager);

var _s3Errors = require('./s3Errors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class S3Database {

  constructor(config, logger) {
    this.logger = logger;
    // copy so we don't mutate
    if (!config) {
      throw new Error('s3 storage missing config. Add `store.s3-storage` to your config file');
    }
    this.config = Object.assign({}, config.store['s3-storage']);
    if (!this.config.bucket) {
      throw new Error('s3 storage requires a bucket');
    }
    const configKeyPrefix = this.config.keyPrefix;
    this.config.keyPrefix = configKeyPrefix != null ? configKeyPrefix.endsWith('/') ? configKeyPrefix : `${configKeyPrefix}/` : '';
    this.s3 = new _awsSdk.S3({
      endpoint: this.config.endpoint,
      region: this.config.region,
      s3ForcePathStyle: this.config.s3ForcePathStyle
    });
  }

  getSecret() {
    var _this = this;

    return _asyncToGenerator(function* () {
      return Promise.resolve((yield _this._getData()).secret);
    })();
  }

  setSecret(secret) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      (yield _this2._getData()).secret = secret;
      yield _this2._sync();
    })();
  }

  add(name, callback) {
    var _this3 = this;

    this._getData().then((() => {
      var _ref = _asyncToGenerator(function* (data) {
        if (data.list.indexOf(name) === -1) {
          data.list.push(name);
          try {
            yield _this3._sync();
            callback(null);
          } catch (err) {
            callback(err);
          }
        } else {
          callback(null);
        }
      });

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    })());
  }

  remove(name, callback) {
    var _this4 = this;

    this.get((() => {
      var _ref2 = _asyncToGenerator(function* (err, data) {
        if (err) {
          callback(new Error('error on get'));
        }

        const pkgName = data.indexOf(name);
        if (pkgName !== -1) {
          const data = yield _this4._getData();
          data.list.splice(pkgName, 1);
        }

        try {
          yield _this4._sync();
          callback(null);
        } catch (err) {
          callback(err);
        }
      });

      return function (_x2, _x3) {
        return _ref2.apply(this, arguments);
      };
    })());
  }

  get(callback) {
    this._getData().then(data => callback(null, data.list));
  }

  // Create/write database file to s3
  _sync() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      yield new Promise(function (resolve, reject) {
        _this5.s3.putObject({
          Bucket: _this5.config.bucket,
          Key: `${_this5.config.keyPrefix}verdaccio-s3-db.json`,
          Body: JSON.stringify(_this5._localData)
        }, function (err, data) {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    })();
  }

  // returns an instance of a class managing the storage for a single package
  getPackageStorage(packageName) {
    return new _s3PackageManager2.default(this.config, packageName, this.logger);
  }

  search(onPackage, onEnd, validateName) {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      const storage = yield _this6._getData();
      const storageInfoMap = storage.list.map(_this6._fetchPackageInfo.bind(_this6, onPackage));
      yield Promise.all(storageInfoMap);
      onEnd();
    })();
  }

  _fetchPackageInfo(onPackage, packageName) {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      return new Promise(function (resolve) {
        _this7.s3.headObject({
          Bucket: _this7.config.bucket,
          Key: `${_this7.config.keyPrefix + packageName}/package.json`
        }, function (err, response) {
          if (err) {
            return resolve();
          }
          if (response.LastModified) {
            return onPackage({
              name: packageName,
              path: packageName,
              time: response.LastModified.getTime()
            }, resolve);
          }
          resolve();
        });
      });
    })();
  }

  _getData() {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      if (!_this8._localData) {
        _this8._localData = yield new Promise(function (resolve, reject) {
          _this8.s3.getObject({
            Bucket: _this8.config.bucket,
            Key: `${_this8.config.keyPrefix}verdaccio-s3-db.json`
          }, function (err, response) {
            if (err) {
              const s3Err = (0, _s3Errors.convertS3Error)(err);
              if ((0, _s3Errors.is404Error)(s3Err)) {
                resolve({ list: [], secret: '' });
              } else {
                reject(err);
              }
              return;
            }
            const data = JSON.parse(response.Body.toString());
            resolve(data);
          });
        });
      }
      return _this8._localData;
    })();
  }
}
exports.default = S3Database;