# Example Terraform Files

This directory contains intentionally misconfigured Terraform files for testing the Checkov action.

## Files

- **s3.tf** - S3 bucket without encryption, versioning, or proper access controls
- **security_group.tf** - Security group with overly permissive rules (SSH, RDP, all traffic from 0.0.0.0/0)
- **ec2.tf** - EC2 instance without encryption and EBS volume without encryption
- **rds.tf** - RDS database with hardcoded credentials, public access, and no encryption

