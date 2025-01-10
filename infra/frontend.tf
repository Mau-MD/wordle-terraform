// Bucket will store react files. Cloudfront will serve them.
resource "aws_s3_bucket" "deployment_bucket" {
  bucket        = "wordle-frontend-bucket"
  force_destroy = true

  tags = {
    Name = "wordle-frontend-bucket"
  }
}

resource "aws_s3_bucket_website_configuration" "bucket_config" {
  bucket = aws_s3_bucket.deployment_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_bucket_ownership_controls" "ownership_controls" {
  bucket = aws_s3_bucket.deployment_bucket.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

// Bucket ACL is private
resource "aws_s3_bucket_acl" "bucket_acl" {
  depends_on = [aws_s3_bucket_ownership_controls.ownership_controls]
  bucket     = aws_s3_bucket.deployment_bucket.id
  acl        = "private"
}

// Bucket policy to allow CloudFront to access the bucket
resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.deployment_bucket.id
  policy = jsonencode({
    "Version" : "2012-10-17",
    "Statement" : [
      {
        "Sid" : "AllowCloudFrontServicePrincipalReadOnly",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "cloudfront.amazonaws.com"
        },
        "Action" : "s3:GetObject",
        "Resource" : "${aws_s3_bucket.deployment_bucket.arn}/*",
        "Condition" : {
          "StringEquals" : {
            "AWS:SourceArn" : "${aws_cloudfront_distribution.website_cdn.arn}"
          }
        }
      }
    ]
  })
}



// Cloudfront will serve the files from the bucket
resource "aws_cloudfront_origin_access_control" "cloudfront_oac" {
  name                              = "wordle-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "website_cdn" {
  enabled = true

  origin {
    domain_name              = aws_s3_bucket.deployment_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.cloudfront_oac.id
    origin_id                = "origin-bucket-${aws_s3_bucket.deployment_bucket.id}"
  }

  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "DELETE", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    min_ttl                = "0"
    default_ttl            = "300"
    max_ttl                = "1200"
    target_origin_id       = "origin-bucket-${aws_s3_bucket.deployment_bucket.id}"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  custom_error_response {
    error_caching_min_ttl = 300
    error_code            = 404
    response_code         = "200"
    response_page_path    = "/index.html"
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

output "bucket_url" {
  value = aws_s3_bucket.deployment_bucket.bucket_regional_domain_name
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.website_cdn.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.website_cdn.id
}
