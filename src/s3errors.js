// @flow

import type { AwsError } from 'aws-sdk';

class VerdaccioError extends Error {
  httpCode: number;
  code: string;
  constructor(message: string, httpCode: number, code: string) {
    super(message);
    this.httpCode = httpCode;
    this.code = code;
  }
}

export const error503 = new VerdaccioError('resource temporarily unavailable', 500, 'EAGAIN');
export const error404 = new VerdaccioError('no such package available', 404, 'ENOENT');
export const error409 = new VerdaccioError('file exists', 409, 'EEXISTS');

export function convertS3GetError(err: AwsError) {
  if (err.code === 'NoSuchKey') {
    return error404;
  }
  return err;
}
