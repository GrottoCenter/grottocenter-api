variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "superset_secret_key" {
  description = "Secret key for Superset session encryption. Generate with: openssl rand -base64 42"
  type        = string
  sensitive   = true
}

variable "superset_database_uri" {
  description = "SQLAlchemy URI for Superset metadata DB (e.g., postgresql://user:pass@host:5432/superset_meta?sslmode=require)"
  type        = string
  sensitive   = true
}

variable "superset_custom_domain" {
  description = "Custom domain for Superset (e.g., bi.grottocenter.org)"
  type        = string
  default     = "bi.grottocenter.org"
}

variable "superset_image_tag" {
  description = "Docker image tag for the custom Superset image on ghcr.io/grottocenter/superset"
  type        = string
  default     = "4.1.1-pg-v2"
}

variable "ghcr_username" {
  description = "GitHub username for ghcr.io registry authentication"
  type        = string
}

variable "ghcr_token" {
  description = "GitHub personal access token with read:packages scope for ghcr.io"
  type        = string
  sensitive   = true
}

variable "superset_admin_username" {
  description = "Superset admin username (created on first boot)"
  type        = string
  default     = "admin"
}

variable "superset_admin_password" {
  description = "Superset admin password"
  type        = string
  sensitive   = true
}

variable "superset_admin_email" {
  description = "Superset admin email"
  type        = string
  default     = "admin@grottocenter.org"
}
