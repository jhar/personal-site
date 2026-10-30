# Once per Cloudflare account: the R2 bucket that holds the environments'
# Terraform state, and the API token GitHub Actions deploys with.
#
# Uses local state; keep terraform.tfstate somewhere safe.

terraform {
  required_version = ">= 1.10"

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
  description = "Cloudflare account id (dashboard → Workers & Pages → Account details)."
  type        = string
}

resource "cloudflare_r2_bucket" "tfstate" {
  account_id = var.account_id
  name       = "personal-site-tfstate"
  location   = "enam"
}

data "cloudflare_account_api_token_permission_groups_list" "all" {
  account_id = var.account_id
}

locals {
  permission_groups = {
    for group in data.cloudflare_account_api_token_permission_groups_list.all.result :
    group.name => group.id
  }

  # What `wrangler deploy` and `wrangler d1 migrations apply` need, and nothing else.
  deploy_permissions = ["Workers Scripts Write", "D1 Write", "Account Settings Read"]
}

resource "cloudflare_account_token" "github_deploy" {
  account_id = var.account_id
  name       = "personal-site GitHub Actions deploy"

  policies = [{
    effect            = "allow"
    permission_groups = [for name in local.deploy_permissions : { id = local.permission_groups[name] }]
    resources         = jsonencode({ "com.cloudflare.api.account.${var.account_id}" = "*" })
  }]

  lifecycle {
    precondition {
      condition     = alltrue([for name in local.deploy_permissions : contains(keys(local.permission_groups), name)])
      error_message = "A deploy permission group was not found. Available: ${join(", ", sort(keys(local.permission_groups)))}"
    }
  }
}

output "state_bucket" {
  value = cloudflare_r2_bucket.tfstate.name
}

output "github_deploy_token" {
  description = "Repository secret CLOUDFLARE_API_TOKEN."
  value       = cloudflare_account_token.github_deploy.value
  sensitive   = true
}
