# Minimal placeholder deployed by Terraform on first apply.
# GitHub Actions replaces this with the real code via aws lambda update-function-code.
data "archive_file" "bootstrap" {
  type        = "zip"
  output_path = "${path.module}/bootstrap.zip"

  source {
    content  = "exports.handler = async () => ({ statusCode: 200, body: 'deploying' })"
    filename = "src/lambda.js"
  }
}

resource "aws_iam_role" "lambda_exec" {
  name = "montemp-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "app" {
  function_name    = "montemp-backend"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "src/lambda.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.bootstrap.output_path
  source_code_hash = data.archive_file.bootstrap.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      NODE_ENV     = "production"
      DATABASE_URL = var.database_url
      JWT_SECRET   = var.jwt_secret
      SALT_ROUNDS  = var.salt_rounds
      FRONTEND_URL = "https://${var.domain}"
    }
  }

  lifecycle {
    # Prevents Terraform from reverting to the bootstrap placeholder after
    # GitHub Actions has deployed real code.
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
