// @flow

import type { S3 } from 'aws-sdk';

interface DeleteKeyPrefixOptions {
  Bucket: string;
  Prefix: string;
}

export function deleteKeyPrefix(s3: S3, options: DeleteKeyPrefixOptions) {
  return new Promise((resolve, reject) => {
    s3.listObjectsV2(options, (err, data) => {
      if (err) {
        reject(err);
      } else if (data.KeyCount) {
        s3.deleteObjects(
          {
            Bucket: options.Bucket,
            Delete: { Objects: data.Contents.map(({ Key }) => ({ Key })) }
          },
          (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          }
        );
      } else {
        resolve();
      }
    });
  });
}
