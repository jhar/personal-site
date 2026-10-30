# One environment's storage and secrets. The Worker itself (code, static
# assets, bindings) is deployed by GitHub Actions with wrangler, from
# wrangler.jsonc, so code changes never need a Terraform run.

terraform {
  required_version = ">= 1.10"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.14"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

variable "account_id" {
  type = string
}

variable "environment" {
  description = "staging or prod."
  type        = string
}

# Visits (kept forever) and the shared Letterboxd cache. Tables come from
# api/migrations, applied by the deploy workflow.
resource "cloudflare_d1_database" "site" {
  account_id = var.account_id
  name       = "personal-site-${var.environment}"

  read_replication = {
    mode = "disabled"
  }

  lifecycle {
    prevent_destroy = true
  }
}

# For /admin/visits?token=...
resource "random_password" "admin_token" {
  length  = 32
  special = false
}

output "database_id" {
  value = cloudflare_d1_database.site.uuid
}

output "database_name" {
  value = cloudflare_d1_database.site.name
}

output "admin_token" {
  value     = random_password.admin_token.result
  sensitive = true
}
