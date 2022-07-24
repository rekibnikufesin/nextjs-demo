"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws")
const cloudflare = require("@pulumi/cloudflare")
const siteDomain = "opswod.io"

// Create S3 bucket
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

// Site bucket policy
function publicReadPolicy(bucketName) {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: "*",
      Action: [
        "s3:GetObject",
      ],
      Resource: [
        `arn:aws:s3:::${bucketName}`,
        `arn:aws:s3:::${bucketName}/*`
      ]
    }]
  })
}

const bucketPolicy = new aws.s3.BucketPolicy("bucketPolicy", {
  bucket: siteBucket.bucket,
  policy: siteBucket.bucket.apply(publicReadPolicy)
})

// Cloudflare DNS
async function getCfZoneId() {
  const cloudflareZone = await cloudflare.getZone({
    name: siteDomain
  })
  return cloudflareZone.id
}

const rootDNS = new cloudflare.Record("rootDNS", {
  name: siteDomain,
  zoneId: getCfZoneId(),
  type: "CNAME",
  value: siteBucket.websiteEndpoint,
  ttl: 1,
  proxied: true,
})

const wwwDNS = new cloudflare.Record("wwwDNS", {
  name: "www",
  zoneId: getCfZoneId(),
  type: "CNAME",
  value: siteDomain,
  ttl: 1,
  proxied: true,
})

exports.websiteUrl = siteBucket.websiteEndpoint
exports.bucketName = siteBucket.bucket
