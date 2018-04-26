// @flow

import type { LocalStorage, Logger, Config, Callback } from '@verdaccio/types';
import type { IPackageStorage, ILocalData } from '@verdaccio/local-storage';
import { S3 } from 'aws-sdk';
import type { S3Config } from './config';
import S3Fs from './local-fs';

export default class S3Database implements ILocalData {
  logger: Logger;
  config: S3Config;
  s3: S3;
  _localData: ?LocalStorage;

  constructor(config: Config, logger: Logger) {
    this.logger = logger;
    // copy so we don't mutate
    if (!config) {
      throw new Error('s3 storage missing config. Add `store.s3-storage` to your config file');
    }
    this.config = Object.assign({}, (config.store: any)['s3-storage']);
    if (!this.config.bucket) {
      throw new Error('s3 storage requires a bucket');
    }
    const configKeyPrefix = this.config.keyPrefix;
    this.config.keyPrefix = configKeyPrefix != null ? (configKeyPrefix.endsWith('/') ? configKeyPrefix : `${configKeyPrefix}/`) : '';
    this.s3 = new S3();
  }

  async getSecret(): Promise<any> {
    return Promise.resolve((await this._getData()).secret);
  }

  async setSecret(secret: string): Promise<any> {
    (await this._getData()).secret = secret;
    await this._sync();
  }

  /**
   * Add a new element.
   * @param {*} name
   * @return {Error|*}
   */
  add(name: string, cb: Callback) {
    this._getData().then(async data => {
      if (data.list.indexOf(name) === -1) {
        data.list.push(name);
        try {
          this._sync();
          cb();
        } catch (err) {
          cb(err);
        }
      } else {
        cb();
      }
    });
  }

  /**
   * Remove an element from the database.
   * @param {*} name
   * @return {Error|*}
   */
  remove(name: string, cb: Callback) {
    this.get(async (err, data) => {
      if (err) {
        cb(new Error('error on get'));
      }

      const pkgName = data.indexOf(name);
      if (pkgName !== -1) {
        const data = await this._getData();
        data.list.splice(pkgName, 1);
      }

      try {
        this._sync();
        cb();
      } catch (err) {
        cb(err);
      }
    });
  }

  /**
   * Return all database elements.
   */
  get(cb: Callback) {
    this._getData().then(data => cb(null, data.list));
  }

  /**
   * Create/write database
   */
  async _sync() {
    await new Promise((resolve, reject) => {
      this.s3.putObject(
        {
          Bucket: this.config.bucket,
          Key: `${this.config.keyPrefix}verdaccio-s3-db.json`,
          Body: JSON.stringify(this._localData)
        },
        (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        }
      );
    });
  }

  getPackageStorage(packageName: string): IPackageStorage {
    return new S3Fs(this.config, packageName, this.logger);
  }

  async _getData(): Promise<LocalStorage> {
    if (!this._localData) {
      this._localData = await new Promise((resolve, reject) => {
        this.s3.getObject(
          {
            Bucket: this.config.bucket,
            Key: `${this.config.keyPrefix}verdaccio-s3-db.json`
          },
          (err, response) => {
            if (err) {
              if (err.code === 'NoSuchKey') {
                resolve({ list: [], secret: '' });
              } else {
                reject(err);
              }
              return;
            }
            const data = JSON.parse(response.Body.toString());
            resolve(data);
          }
        );
      });
    }
    return this._localData;
  }
}
