// @flow

import { S3 } from 'aws-sdk';
import type { ILocalData } from '@verdaccio/local-storage';
import S3Database from '../';
import Config from './__mocks__/Config';
import logger from './__mocks__/Logger';
import { deleteKeyPrefix } from '../deleteKeyPrefix';

describe('Local Database', () => {
  let db: ILocalData;
  let config;
  // random key for testing
  const keyPrefix = `test/${Math.floor(Math.random() * Math.pow(10, 8))}`;

  const bucket = process.env.VERDACCIO_TEST_BUCKET;
  if (!bucket) {
    throw new Error('no bucket specified via VERDACCIO_TEST_BUCKET env var');
  }

  beforeEach(() => {
    config = Object.assign(new Config(), {
      store: {
        's3-storage': {
          bucket,
          keyPrefix
        }
      }
    });
    db = new S3Database(config, logger);
  });

  afterEach(async () =>
    deleteKeyPrefix(
      new S3(),
      {
        Bucket: bucket,
        Prefix: keyPrefix
      },
      () => {}
    ));

  test('should create an instance', () => {
    expect(db).toBeDefined();
  });

  describe('manages a secret', async () => {
    test('should create get secret', async () => {
      const secretKey = await db.getSecret();
      expect(secretKey).toBeDefined();
      expect(typeof secretKey === 'string').toBeTruthy();
    });

    test('should create set secret', async () => {
      await db.setSecret(config.checkSecretKey());
      expect(config.secret).toBeDefined();
      expect(typeof config.secret === 'string').toBeTruthy();
      const fetchedSecretKey = await db.getSecret();
      expect(config.secret).toBe(fetchedSecretKey);
    });
  });

  describe('Database CRUD', () => {
    test('should add an item to database', done => {
      const pgkName = 'jquery';
      db.get((err, data) => {
        expect(err).toBeNull();
        expect(data).toHaveLength(0);

        db.add(pgkName, err => {
          expect(err).toBeNull();
          db.get((err, data) => {
            expect(err).toBeNull();
            expect(data).toHaveLength(1);
            done();
          });
        });
      });
    });

    test('should remove an item to database', done => {
      const pgkName = 'jquery';
      db.get((err, data) => {
        expect(err).toBeNull();
        expect(data).toHaveLength(0);
        db.add(pgkName, err => {
          expect(err).toBeNull();
          db.remove(pgkName, err => {
            expect(err).toBeNull();
            db.get((err, data) => {
              expect(err).toBeNull();
              expect(data).toHaveLength(0);
              done();
            });
          });
        });
      });
    });
  });
});
