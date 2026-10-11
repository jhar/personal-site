terraform {
  required_version = ">= 1.10"

  # Bucket is passed at init time, since it includes the AWS account id:
  #   terraform init -backend-config="bucket=personal-site-tfstate-<account-id>"
  backend "s3" {
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "personal-site"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

module "site" {
  source = "../../modules/site"

  environment        = "prod"
  github_environment = "production"
  protect_data       = true
  force_destroy      = false
}

output "site_url" {
  value = module.site.site_url
}

output "distribution_id" {
  value = module.site.distribution_id
}

output "site_bucket" {
  value = module.site.site_bucket
}

output "function_name" {
  value = module.site.function_name
}

output "visits_table" {
  value = module.site.visits_table
}

output "deploy_role_arn" {
  value = module.site.deploy_role_arn
}

output "admin_token" {
  value     = module.site.admin_token
  sensitive = true
}
