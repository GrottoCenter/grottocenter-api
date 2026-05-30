output "superset_default_hostname" {
  description = "Default Azure hostname for the Superset App Service"
  value       = azurerm_linux_web_app.superset.default_hostname
}

output "superset_custom_domain" {
  description = "Custom domain for Superset"
  value       = var.superset_custom_domain
}

output "dns_cname_record" {
  description = "CNAME record to create in your DNS provider"
  value       = "${var.superset_custom_domain} → ${azurerm_linux_web_app.superset.default_hostname}"
}
