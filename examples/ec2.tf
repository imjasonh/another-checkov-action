# Misconfigured EC2 instance
resource "aws_instance" "bad_instance" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"

  # No encryption on root volume
  # No monitoring enabled
  # No IMDSv2 required

  metadata_options {
    http_tokens = "optional" # Should be "required" for IMDSv2
  }

  # Public IP without proper security
  associate_public_ip_address = true

  tags = {
    Name = "insecure-instance"
  }
}

# Unencrypted EBS volume
resource "aws_ebs_volume" "bad_volume" {
  availability_zone = "us-west-2a"
  size              = 40

  encrypted = false # Should be true

  tags = {
    Name = "unencrypted-volume"
  }
}
