terraform {
  required_version = ">= 1.10"

  # State lives in the R2 bucket made by infra/bootstrap, through R2's S3 API.
  # Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (an R2 API token) and
  # AWS_ENDPOINT_URL_S3=https://<account-id>.r2.cloudflarestorage.com first.
  backend "s3" {
    bucket                      = "personal-site-tfstate"
    key                         = "prod/terraform.tfstate"
    region                      = "auto"
    use_path_style              = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_s3_checksum            = true
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.14"
    }
  }
}

provider "cloudflare" {
  # Reads CLOUDFLARE_API_TOKEN from the environment.
}

variable "account_id" {
  type = string
}

module "site" {
  source = "../../modules/site"

  account_id  = var.account_id
  environment = "prod"
}

output "database_id" {
  description = "database_id for env.production in wrangler.jsonc."
  value       = module.site.database_id
}

output "database_name" {
  value = module.site.database_name
}

output "admin_token" {
  description = "ADMIN_TOKEN secret on the GitHub environment."
  value       = module.site.admin_token
  sensitive   = true
}
