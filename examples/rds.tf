# Misconfigured RDS database
resource "aws_db_instance" "bad_database" {
  identifier        = "insecure-db"
  engine            = "mysql"
  engine_version    = "5.7"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  username          = "admin"
  password          = "password123" # Hardcoded password

  # Security issues
  publicly_accessible = true  # Database is public
  storage_encrypted   = false # No encryption
  skip_final_snapshot = true  # No final snapshot
  deletion_protection = false # No deletion protection

  # No backup retention
  backup_retention_period = 0

  # No enhanced monitoring
  enabled_cloudwatch_logs_exports = []
}
