"use strict";
const aws = require("@pulumi/aws")
const pulumi = require("@pulumi/pulumi");

// Create an S3 bucket
let siteBucket = new aws.s3.Bucket("opswod.io", {
  name: "opswod.io",
  website: {
    indexDocument: "index.html"
  }
})

// S3 ACL
const bucketAcl = new aws.s3.BucketAclV2("bucketAcl", {
  bucket: siteBucket.id,
  acl: "public-read"
})

// S3 Bucket Policy
function publicReadPolicyForBucket(bucketName) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: "*",
      Action: [
        "s3:GetObject"
      ],
      Resource: [
        `arn:aws:s3:::${bucketName}`,
        `arn:aws:s3:::${bucketName}/*`
      ]
    }]
  })
}

let bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
  bucket: siteBucket.bucket,
  policy: siteBucket.bucket.apply(publicReadPolicyForBucket)
})

exports.websiteUrl = siteBucket.websiteEndpoint
