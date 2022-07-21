"use strict";
const aws = require("@pulumi/aws")
const cloudflare = require("@pulumi/cloudflare")
const pulumi = require("@pulumi/pulumi");
const siteDomain = "opswod.io"

// Create an S3 bucket
const siteBucket = new aws.s3.Bucket("opswod.io", {
  name: siteDomain,
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

// S3 bucket policy
const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
  bucket: siteBucket.bucket,
  policy: siteBucket.bucket.apply(publicReadPolicyForBucket)
})

// Cloudflare DNS
const cloudflareZone = await cloudflare.getZone({
  name: siteDomain
})

const rootDNS = new cloudflare.Record("rootDNS", {
  name: siteDomain,
  zoneId: cloudflareZone.id,
  type: "CNAME",
  value: siteBucket.websiteEndpoint,
  ttl: 1,
  proxied: true,
})

const wwwDNS = new cloudflare.Record("wwwDNS", {
  name: "www",
  zoneId: cloudflareZone.id,
  type: "CNAME",
  value: siteDomain,
  ttl: 1,
  proxied: true,
})

exports.websiteUrl = siteBucket.websiteEndpoint
exports.bucketName = siteBucket.bucket
