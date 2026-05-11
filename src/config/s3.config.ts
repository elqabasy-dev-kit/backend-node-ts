/**
 * @file src/config/s3.config.ts
 * @description S3 client configuration.
 * @author Mahros AL-Qabasy <mahros.dev>
 */

import { S3Client } from "@aws-sdk/client-s3";
import { config } from "./index";

const normalizedEndpointInput = config.storage.endpoint.trim();
const endpointWithScheme = /^https?:\/\//i.test(normalizedEndpointInput)
  ? normalizedEndpointInput
  : `https://${normalizedEndpointInput}`;

let endpointUrl: URL;

try {
  endpointUrl = new URL(endpointWithScheme);
} catch {
  throw new Error(
    "Invalid STORAGE_ENDPOINT. Use a valid host or URL, e.g.",
  );
}

const bucketFromEndpointPath = endpointUrl.pathname.replace(/^\/+|\/+$/g, "");
const configuredBucket = config.storage.bucket.trim();

const resolvedBucket = configuredBucket || bucketFromEndpointPath;

if (!resolvedBucket) {
  throw new Error(
    "Storage bucket is missing. Set STORAGE_BUCKET or include it as endpoint path, e.g.",
  );
}

if (
  configuredBucket &&
  bucketFromEndpointPath &&
  configuredBucket !== bucketFromEndpointPath
) {
  throw new Error(
    "STORAGE_BUCKET does not match endpoint path bucket. Keep only one source or make both identical.",
  );
}

endpointUrl.pathname = "/";
endpointUrl.search = "";
endpointUrl.hash = "";

export const storageClient = new S3Client({
  region: config.storage.region,
  endpoint: endpointUrl.toString(),
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
  forcePathStyle: true,
});

export const storageBucket = resolvedBucket;
export const storageEndpoint = endpointUrl.toString();
