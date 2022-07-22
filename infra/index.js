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
        `arn:aws:s3:::${siteBucket.id}`,
        `arn:aws:s3:::${siteBucket.id}/*`
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

const pageRule = new cloudflare.PageRule("will", {
  zoneId: getCfZoneId(),
  target: `${siteDomain}/will`,
  actions: {
    forwardingUrl: {
      statusCode: 302,
      url: "https://www.willbutton.com"
    }
  }
})

exports.websiteUrl = siteBucket.websiteEndpoint
exports.bucketName = siteBucket.bucket
