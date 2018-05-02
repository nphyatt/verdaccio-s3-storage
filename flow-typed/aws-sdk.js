import type { PassThrough } from "stream";

declare module 'aws-sdk' {
  declare class Endpoint {
    constructor(endpoint: string): Endpoint;
    host: string;
    hostname: string;
    href: string;
    port: number;
    protocol: string;
  }

  declare class Request {
    abort(): Request;
    createReadStream(): PassThrough;
    on(name: string, callback: Function): Request;
  }

  declare interface Params {
    Bucket: string;
  }

  declare interface AwsError {
    code: string;
  }

  declare type Callback<D> = (err: ?AwsError, data: D) => void;

  declare type ManagedUpload = any;

  declare class S3 {
    constructor(options: any): S3;

    endpoint: Endpoint;

    // Aborts a multipart upload.To verify that all parts have been removed, so you don't get charged for the part storage, you should call the List Parts operation and ensure the parts list is empty.
    abortMultipartUpload(params: any, callback?: Callback<any>): Request;
    // Completes a multipart upload by assembling previously uploaded parts.
    completeMultipartUpload(params: any, callback?: Callback<any>): Request;
    // Creates a copy of an object that is already stored in Amazon S3.
    copyObject(params: any, callback?: Callback<any>): Request;
    // Creates a new bucket.
    createBucket(params: any, callback?: Callback<any>): Request;
    // Initiates a multipart upload and returns an upload ID.Note: After you initiate multipart upload and upload one or more parts, you must either complete or abort multipart upload in order to stop getting charged for storage of the uploaded parts.
    createMultipartUpload(params: any, callback?: Callback<any>): Request;
    // Get a pre-signed POST policy to support uploading to S3 directly from an HTML form.
    createPresignedPost(params: any, callback?: Callback<any>): ?any;
    // Deletes the bucket.
    deleteBucket(params: any, callback?: Callback<any>): Request;
    // Deletes an analytics configuration for the bucket (specified by the analytics configuration ID).
    deleteBucketAnalyticsConfiguration(params: any, callback?: Callback<any>): Request;
    // Deletes the cors configuration information set for the bucket.
    deleteBucketCors(params: any, callback?: Callback<any>): Request;
    // Deletes the server-side encryption configuration from the bucket.
    deleteBucketEncryption(params: any, callback?: Callback<any>): Request;
    // Deletes an inventory configuration (identified by the inventory ID) from the bucket.
    deleteBucketInventoryConfiguration(params: any, callback?: Callback<any>): Request;
    // Deletes the lifecycle configuration from the bucket.
    deleteBucketLifecycle(params: any, callback?: Callback<any>): Request;
    // Deletes a metrics configuration (specified by the metrics configuration ID) from the bucket.
    deleteBucketMetricsConfiguration(params: any, callback?: Callback<any>): Request;
    // Deletes the policy from the bucket.
    deleteBucketPolicy(params: any, callback?: Callback<any>): Request;
    // Deletes the replication configuration from the bucket.
    deleteBucketReplication(params: any, callback?: Callback<any>): Request;
    // Deletes the tags from the bucket.
    deleteBucketTagging(params: any, callback?: Callback<any>): Request;
    // This operation removes the website configuration from the bucket.
    deleteBucketWebsite(params: any, callback?: Callback<any>): Request;
    // Removes the null version (if there is one) of an object and inserts a delete marker, which becomes the latest version of the object.
    deleteObject(params: any, callback?: Callback<any>): Request;
    // This operation enables you to delete multiple objects from a bucket using a single HTTP request.
    deleteObjects(params: any, callback?: Callback<any>): Request;
    // Removes the tag-set from an existing object.
    deleteObjectTagging(params: any, callback?: Callback<any>): Request;
    // Returns the accelerate configuration of a bucket.
    getBucketAccelerateConfiguration(params: any, callback?: Callback<any>): Request;
    // Gets the access control policy for the bucket.
    getBucketAcl(params: any, callback?: Callback<any>): Request;
    // Gets an analytics configuration for the bucket (specified by the analytics configuration ID).
    getBucketAnalyticsConfiguration(params: any, callback?: Callback<any>): Request;
    // Returns the cors configuration for the bucket.
    getBucketCors(params: any, callback?: Callback<any>): Request;
    // Returns the server-side encryption configuration of a bucket.
    getBucketEncryption(params: any, callback?: Callback<any>): Request;
    // Returns an inventory configuration (identified by the inventory ID) from the bucket.
    getBucketInventoryConfiguration(params: any, callback?: Callback<any>): Request;
    // Returns the lifecycle configuration information set on the bucket.
    getBucketLifecycleConfiguration(params: any, callback?: Callback<any>): Request;
    // Returns the region the bucket resides in.
    getBucketLocation(params: any, callback?: Callback<any>): Request;
    // Returns the logging status of a bucket and the permissions users have to view and modify that status.
    getBucketLogging(params: any, callback?: Callback<any>): Request;
    // Gets a metrics configuration (specified by the metrics configuration ID) from the bucket.
    getBucketMetricsConfiguration(params: any, callback?: Callback<any>): Request;
    // Returns the notification configuration of a bucket.
    getBucketNotificationConfiguration(params: any, callback?: Callback<any>): Request;
    // Returns the policy of a specified bucket.
    getBucketPolicy(params: any, callback?: Callback<any>): Request;
    // Returns the replication configuration of a bucket.
    getBucketReplication(params: any, callback?: Callback<any>): Request;
    // Returns the request payment configuration of a bucket.
    getBucketRequestPayment(params: any, callback?: Callback<any>): Request;
    // Returns the tag set associated with the bucket.
    getBucketTagging(params: any, callback?: Callback<any>): Request;
    // Returns the versioning state of a bucket.
    getBucketVersioning(params: any, callback?: Callback<any>): Request;
    // Returns the website configuration for a bucket.
    getBucketWebsite(params: any, callback?: Callback<any>): Request;
    // Retrieves objects from Amazon S3.
    getObject(params: any, callback?: Callback<any>): Request;
    // Returns the access control list (ACL) of an object.
    getObjectAcl(params: any, callback?: Callback<any>): Request;
    // Returns the tag-set of an object.
    getObjectTagging(params: any, callback?: Callback<any>): Request;
    // Return torrent files from a bucket.
    getObjectTorrent(params: any, callback?: Callback<any>): Request;
    // Get a pre-signed URL for a given operation name.
    getSignedUrl(operation: any, params: any, callback?: Callback<any>): ?string;
    // This operation is useful to determine if a bucket exists and you have permission to access it.
    headBucket(params: any, callback?: Callback<any>): Request;
    // The HEAD operation retrieves metadata from an object without returning the object itself.
    headObject(params: any, callback?: Callback<any>): Request;
    // Lists the analytics configurations for the bucket.
    listBucketAnalyticsConfigurations(params: any, callback?: Callback<any>): Request;
    // Returns a list of inventory configurations for the bucket.
    listBucketInventoryConfigurations(params: any, callback?: Callback<any>): Request;
    // Lists the metrics configurations for the bucket.
    listBucketMetricsConfigurations(params: any, callback?: Callback<any>): Request;
    // Returns a list of all buckets owned by the authenticated sender of the request.
    listBuckets(params: any, callback?: Callback<any>): Request;
    // This operation lists in-progress multipart uploads.
    listMultipartUploads(params: any, callback?: Callback<any>): Request;
    // Returns some or all (up to 1000) of the objects in a bucket.
    listObjects(params: any, callback?: Callback<any>): Request;
    // Returns some or all (up to 1000) of the objects in a bucket.
    listObjectsV2(params: any, callback?: Callback<any>): Request;
    // Returns metadata about all of the versions of objects in a bucket.
    listObjectVersions(params: any, callback?: Callback<any>): Request;
    // Lists the parts that have been uploaded for a specific multipart upload.
    listParts(params: any, callback?: Callback<any>): Request;
    // Sets the accelerate configuration of an existing bucket.
    putBucketAccelerateConfiguration(params: any, callback?: Callback<any>): Request;
    // Sets the permissions on a bucket using access control lists (ACL).
    putBucketAcl(params: any, callback?: Callback<any>): Request;
    // Sets an analytics configuration for the bucket (specified by the analytics configuration ID).
    putBucketAnalyticsConfiguration(params: any, callback?: Callback<any>): Request;
    // Sets the cors configuration for a bucket.
    putBucketCors(params: any, callback?: Callback<any>): Request;
    // Creates a new server-side encryption configuration (or replaces an existing one, if present).
    putBucketEncryption(params: any, callback?: Callback<any>): Request;
    // Adds an inventory configuration (identified by the inventory ID) from the bucket.
    putBucketInventoryConfiguration(params: any, callback?: Callback<any>): Request;
    // Sets lifecycle configuration for your bucket.
    putBucketLifecycleConfiguration(params: any, callback?: Callback<any>): Request;
    // Set the logging parameters for a bucket and to specify permissions for who can view and modify the logging parameters.
    putBucketLogging(params: any, callback?: Callback<any>): Request;
    // Sets a metrics configuration (specified by the metrics configuration ID) for the bucket.
    putBucketMetricsConfiguration(params: any, callback?: Callback<any>): Request;
    // Enables notifications of specified events for a bucket.
    putBucketNotificationConfiguration(params: any, callback?: Callback<any>): Request;
    // Replaces a policy on a bucket.
    putBucketPolicy(params: any, callback?: Callback<any>): Request;
    // Creates a new replication configuration (or replaces an existing one, if present).
    putBucketReplication(params: any, callback?: Callback<any>): Request;
    // Sets the request payment configuration for a bucket.
    putBucketRequestPayment(params: any, callback?: Callback<any>): Request;
    // Sets the tags for a bucket.
    putBucketTagging(params: any, callback?: Callback<any>): Request;
    // Sets the versioning state of an existing bucket.
    putBucketVersioning(params: any, callback?: Callback<any>): Request;
    // Set the website configuration for a bucket.
    putBucketWebsite(params: any, callback?: Callback<any>): Request;
    // Adds an object to a bucket.
    putObject(params: any, callback?: Callback<any>): Request;
    // uses the acl subresource to set the access control list (ACL) permissions for an object that already exists in a bucket.
    putObjectAcl(params: any, callback?: Callback<any>): Request;
    // Sets the supplied tag-set to an object that already exists in a bucket.
    putObjectTagging(params: any, callback?: Callback<any>): Request;
    // Restores an archived copy of an object back into Amazon S3.
    restoreObject(params: any, callback?: Callback<any>): Request;
    // Uploads an arbitrarily sized buffer, blob, or stream, using intelligent concurrent handling of parts if the payload is large enough.
    upload(params: any, options: any, callback?: Callback<any>): ManagedUpload;
    upload(params: any, callback?: Callback<any>): ManagedUpload;
    // Uploads a part in a multipart upload.Note: After you initiate multipart upload and upload one or more parts, you must either complete or abort multipart upload in order to stop getting charged for storage of the uploaded parts.
    uploadPart(params: any, callback?: Callback<any>): Request;
    // Uploads a part by copying data from an existing object as data source.
    uploadPartCopy(params: any, callback?: Callback<any>): Request;
    // Waits for a given S3 resource.
    waitFor(state: any, params: any, callback?: Callback<any>): Request;
  }
}
