# Misconfigured S3 bucket - missing encryption, versioning, logging
resource "aws_s3_bucket" "bad_bucket" {
  bucket = "my-insecure-bucket"

  # No encryption configured
  # No versioning
  # No logging
  # Public access not blocked
}

resource "aws_s3_bucket_public_access_block" "bad_public_access" {
  bucket = aws_s3_bucket.bad_bucket.id

  # All set to false - allows public access
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "bad_acl" {
  bucket = aws_s3_bucket.bad_bucket.id
  acl    = "public-read" # Public read access
}
