output "site_url" {
  description = "Public URL of the site."
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "site_bucket" {
  value = aws_s3_bucket.site.bucket
}

output "function_name" {
  value = aws_lambda_function.api.function_name
}

output "visits_table" {
  value = aws_dynamodb_table.visits.name
}

output "deploy_role_arn" {
  value = aws_iam_role.deploy.arn
}

output "admin_token" {
  description = "Token for /admin/visits?token=..."
  value       = random_password.admin_token.result
  sensitive   = true
}
