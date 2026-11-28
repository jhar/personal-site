# www.justinharrison.dev -> https://justinharrison.dev, 301, keeping the path
# and query string. Prod only: staging has no www.
#
# The record is a placeholder: proxied through Cloudflare, so the redirect rule
# answers before anything tries to reach an origin. 100:: is the discard prefix
# Cloudflare recommends for redirect-only hostnames.
#
# The Terraform token needs Zone → DNS → Edit and Zone → Single Redirect → Edit
# on justinharrison.dev, on top of the permissions in the README.

variable "domain" {
  type    = string
  default = "justinharrison.dev"
}

data "cloudflare_zone" "site" {
  filter = {
    name = var.domain
  }
}

resource "cloudflare_dns_record" "www" {
  zone_id = data.cloudflare_zone.site.id
  name    = "www.${var.domain}"
  type    = "AAAA"
  content = "100::"
  proxied = true
  ttl     = 1 # automatic; required for proxied records
  comment = "Redirect-only, see infra/envs/prod/www.tf"
}

# A zone has one ruleset per phase. If the dashboard already has a Single
# Redirect rule, delete it (or import the ruleset) before applying.
resource "cloudflare_ruleset" "redirects" {
  zone_id     = data.cloudflare_zone.site.id
  name        = "Single redirects"
  description = "Managed by infra/envs/prod"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules = [
    {
      ref         = "www_to_apex"
      description = "www -> apex"
      expression  = "(http.host eq \"www.${var.domain}\")"
      action      = "redirect"
      enabled     = true
      action_parameters = {
        from_value = {
          status_code           = 301
          preserve_query_string = true
          target_url = {
            expression = "concat(\"https://${var.domain}\", http.request.uri.path)"
          }
        }
      }
    },
  ]
}
