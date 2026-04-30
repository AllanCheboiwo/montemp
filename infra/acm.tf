resource "aws_acm_certificate" "cert" {
  provider = aws.us_east_1

  domain_name               = var.domain
  subject_alternative_names = ["*.${var.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Cert is validated via the CNAME record manually added to Cloudflare DNS.
# This resource just waits for the certificate status to become ISSUED.
resource "aws_acm_certificate_validation" "cert" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.cert.arn
}
