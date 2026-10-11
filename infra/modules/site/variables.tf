variable "environment" {
  description = "Environment name, used in resource names (staging or prod)."
  type        = string
}

variable "github_repository" {
  description = "owner/repo allowed to deploy through the GitHub OIDC role."
  type        = string
  default     = "jhar/personal-site"
}

variable "github_environment" {
  description = "GitHub Actions environment whose jobs may assume the deploy role."
  type        = string
}

variable "protect_data" {
  description = "Turn on deletion protection and point-in-time recovery for the visits table."
  type        = bool
  default     = true
}

variable "force_destroy" {
  description = "Allow `terraform destroy` to delete the site bucket while it still has files."
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "How long Lambda logs are kept."
  type        = number
  default     = 14
}
