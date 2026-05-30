terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "grottocenter-api"
    storage_account_name = "grottocenterterraform"
    container_name       = "tfstate"
    key                  = "superset.tfstate"
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# ---------------------------------------------------------------------------
# Data sources — reference existing resources without managing them
# ---------------------------------------------------------------------------

data "azurerm_resource_group" "main" {
  name = "grottocenter-api"
}

data "azurerm_service_plan" "main" {
  name                = "grottocenter-api-plan"
  resource_group_name = data.azurerm_resource_group.main.name
}

# ---------------------------------------------------------------------------
# Superset App Service (Linux container from ghcr.io)
# ---------------------------------------------------------------------------

resource "azurerm_linux_web_app" "superset" {
  name                = "grottocenter-superset"
  location            = data.azurerm_resource_group.main.location
  resource_group_name = data.azurerm_resource_group.main.name
  service_plan_id     = data.azurerm_service_plan.main.id

  https_only = true

  site_config {
    always_on                         = true
    health_check_path                 = "/health"
    health_check_eviction_time_in_min = 5

    application_stack {
      docker_registry_url      = "https://ghcr.io"
      docker_image_name        = "grottocenter/superset:${var.superset_image_tag}"
      docker_registry_username = var.ghcr_username
      docker_registry_password = var.ghcr_token
    }
  }

  app_settings = {
    "SUPERSET__SQLALCHEMY_DATABASE_URI"    = var.superset_database_uri
    "SUPERSET_SECRET_KEY"                  = var.superset_secret_key
    "SUPERSET_LOAD_EXAMPLES"               = "no"
    "SUPERSET_ADMIN_USERNAME"              = var.superset_admin_username
    "SUPERSET_ADMIN_PASSWORD"              = var.superset_admin_password
    "SUPERSET_ADMIN_EMAIL"                 = var.superset_admin_email
    "WEBSITES_PORT"                        = "8088"
    "WEBSITES_CONTAINER_START_TIME_LIMIT"  = "300"
  }

  logs {
    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }
}

# ---------------------------------------------------------------------------
# Custom domain + managed SSL certificate
# ---------------------------------------------------------------------------

resource "azurerm_app_service_custom_hostname_binding" "superset" {
  hostname            = var.superset_custom_domain
  app_service_name    = azurerm_linux_web_app.superset.name
  resource_group_name = data.azurerm_resource_group.main.name
}

resource "azurerm_app_service_managed_certificate" "superset" {
  custom_hostname_binding_id = azurerm_app_service_custom_hostname_binding.superset.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "azurerm_app_service_certificate_binding" "superset" {
  hostname_binding_id = azurerm_app_service_custom_hostname_binding.superset.id
  certificate_id      = azurerm_app_service_managed_certificate.superset.id
  ssl_state           = "SniEnabled"
}
