// @flow

import stream from 'stream';

import { S3 } from 'aws-sdk';
import { UploadTarball, ReadTarball } from '@verdaccio/streams';
import type { IUploadTarball } from '@verdaccio/streams';
import type { Callback, Logger, Package } from '@verdaccio/types';
import type { ILocalPackageManager } from '@verdaccio/local-storage';
import { error409, error404, convertS3GetError } from './s3errors';
import type { S3Config } from './config';

const pkgFileName = 'package.json';

// This is initialized for a single package

export default class S3Fs implements ILocalPackageManager {
  config: S3Config;
  logger: Logger;
  packageName: string;
  s3: S3;
  _localData: any;

  constructor(config: S3Config, packageName: string, logger: Logger) {
    this.config = config;
    this.packageName = packageName;
    this.logger = logger;
    this.s3 = new S3();
  }

  updatePackage(name: string, updateHandler: Callback, onWrite: Callback, transformPackage: Function, onEnd: Callback) {
    (async () => {
      try {
        const json = await this._getData();
        updateHandler(json, err => {
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

  async _getData(): Promise<any> {
    return await new Promise((resolve, reject) => {
      this.s3.getObject(
        {
          Bucket: this.config.bucket,
          Key: `${this.config.keyPrefix}${this.packageName}/${pkgFileName}`
        },
        (err, response) => {
          if (err) {
            reject(convertS3GetError(err));
            return;
          }
          const data = JSON.parse(response.Body.toString());
          resolve(data);
        }
      );
    });
  }

  deletePackage(fileName: string, callback: Callback) {
    this.s3.deleteObject(
      {
        Bucket: this.config.bucket,
        Key: `${this.config.keyPrefix}${this.packageName}/${fileName}`
      },
      (err, data) => {
        if (err) {
          callback(err);
        } else {
          callback();
        }
      }
    );
  }

  removePackage(callback: Callback): void {
    this.s3.listObjectsV2(
      {
        Bucket: this.config.bucket,
        Prefix: `${this.config.keyPrefix}${this.packageName}`
      },
      (err, data) => {
        if (err) {
          callback(err);
        } else if (data.KeyCount) {
          this.s3.deleteObjects(
            {
              Bucket: this.config.bucket,
              Delete: { Objects: data.Contents }
            },
            (err, data) => {
              if (err) {
                callback(err);
              } else {
                callback();
              }
            }
          );
        } else {
          callback();
        }
      }
    );
  }

  createPackage(name: string, value: Package, cb: Function) {
    this.savePackage(name, value, cb);
  }

  savePackage(name: string, value: Package, cb: Function) {
    this.s3.putObject(
      {
        Body: JSON.stringify(value, null, '  '),
        Bucket: this.config.bucket,
        Key: `${this.config.keyPrefix}${this.packageName}/${pkgFileName}`
      },
      cb
    );
  }

  readPackage(name: string, cb: Function) {
    (async () => {
      try {
        const data = await this._getData();
        cb(null, data);
      } catch (err) {
        cb(err);
      }
    })();
  }

  writeTarball(name: string): IUploadTarball {
    const uploadStream = new UploadTarball();

    let streamEnded = 0;
    uploadStream.on('end', () => {
      streamEnded = 1;
    });

    const baseS3Params = {
      Bucket: this.config.bucket,
      Key: `${this.config.keyPrefix}${this.packageName}/${name}`
    };

    this.s3.getObject(baseS3Params, (err, response) => {
      if (err) {
        err = convertS3GetError(err);
        if (err !== error404) {
          throw err;
        } else {
          const s3upload = new Promise((resolve, reject) => {
            this.s3.upload(Object.assign({}, baseS3Params, { Body: uploadStream }), (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });

          uploadStream.done = () => {
            const onEnd = async () => {
              try {
                await s3upload;
                uploadStream.emit('success');
              } catch (err) {
                uploadStream.emit('error', err);
              }
            };
            if (streamEnded) {
              onEnd();
            } else {
              uploadStream.on('end', onEnd);
            }
          };

          uploadStream.abort = async () => {
            try {
              await s3upload;
            } finally {
              this.s3.deleteObject(baseS3Params);
            }
          };
        }
      } else {
        uploadStream.emit('error', error409);
      }
    });

    return uploadStream;
  }

  readTarball(name: string, readTarballStream: any) {
    readTarballStream = new ReadTarball();

    let aborted = false;

    readTarballStream.abort = () => {
      aborted = true;
    };

    this.s3.getObject(
      {
        Bucket: this.config.bucket,
        Key: `${this.config.keyPrefix}${this.packageName}/${name}`
      },
      (err, data) => {
        if (!aborted) {
          if (err) {
            readTarballStream.emit('error', convertS3GetError(err));
          } else {
            const bufferStream = new stream.PassThrough();
            // NOTE: no chunking is done here
            bufferStream.end(data.Body);

            readTarballStream.emit('content-length', data.ContentLength);
            readTarballStream.emit('open');
            bufferStream.pipe(readTarballStream);
          }
        }
      }
    );

    return readTarballStream;
  }
}
