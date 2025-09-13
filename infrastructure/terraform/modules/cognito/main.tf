resource "aws_cognito_user_pool" "main" {
  name = "${var.environment}-user-pool"

  alias_attributes = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Account Confirmation"
    email_message        = "Your confirmation code is {####}"
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "name"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.environment}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  generate_secret                      = false
  prevent_user_existence_errors        = "ENABLED"
  supported_identity_providers         = ["COGNITO"]

  read_attributes = [
    "email",
    "name",
    "email_verified"
  ]

  write_attributes = [
    "email",
    "name"
  ]

  access_token_validity  = 24
  id_token_validity     = 24
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  count       = var.domain_name != null ? 1 : 0
  domain      = "${var.environment}-auth"
  user_pool_id = aws_cognito_user_pool.main.id
} 