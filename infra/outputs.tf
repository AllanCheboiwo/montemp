output "frontend_url" {
  value = "https://${var.domain}"
}

output "api_url" {
  value = "https://api.${var.domain}"
}

output "s3_bucket_name" {
  description = "Needed for GitHub Actions frontend deploy"
  value       = aws_s3_bucket.frontend.bucket
}

output "lambda_function_name" {
  description = "Needed for GitHub Actions backend deploy"
  value       = aws_lambda_function.app.function_name
}

output "cloudfront_distribution_id" {
  description = "Needed for GitHub Actions cache invalidation"
  value       = aws_cloudfront_distribution.frontend.id
}
