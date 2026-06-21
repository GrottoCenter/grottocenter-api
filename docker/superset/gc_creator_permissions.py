"""
GC_Creator role permissions (whitelist).

Defines the exact set of permissions for JIT-provisioned Superset users.
Run during startup to ensure the role exists with the correct permissions.
New Superset upgrades won't accidentally grant extra permissions — only
what's listed here is allowed.

Usage:
    python gc_creator_permissions.py
"""

# (permission_name, view_menu_name)
GC_CREATOR_PERMISSIONS = [
    # --- Dashboard & Chart CRUD ---
    ("can_read", "Dashboard"),
    ("can_write", "Dashboard"),
    ("can_read", "Chart"),
    ("can_write", "Chart"),
    ("can_export", "Chart"),
    ("can_export", "Dashboard"),
    ("can_dashboard", "Superset"),
    ("can_dashboard_permalink", "Superset"),
    ("can_drill", "Dashboard"),
    ("can_view_chart_as_table", "Dashboard"),
    ("can_view_query", "Dashboard"),
    ("can_put_chart_customizations", "Dashboard"),
    ("can_get_embedded", "Dashboard"),

    # --- Explore & Data interaction ---
    ("can_explore", "Superset"),
    ("can_explore_json", "Superset"),
    ("can_csv", "Superset"),
    ("can_slice", "Superset"),
    ("can_fetch_datasource_metadata", "Superset"),
    ("can_file_handler", "Superset"),
    ("can_language_pack", "Superset"),
    ("can_log", "Superset"),

    # --- Datasource access (read-only) ---
    ("can_read", "Dataset"),
    ("can_read", "Database"),
    ("can_get", "Datasource"),
    ("can_get_column_values", "Datasource"),
    ("can_get_drill_info", "Dataset"),
    ("can_external_metadata", "Datasource"),
    ("can_external_metadata_by_name", "Datasource"),
    ("can_samples", "Datasource"),
    ("can_validate_expression", "Datasource"),
    ("all_datasource_access", "all_datasource_access"),

    # --- Read-only supporting views ---
    ("can_read", "EmbeddedDashboard"),
    ("can_read", "Explore"),
    ("can_read", "ExploreFormDataRestApi"),
    ("can_read", "ExplorePermalinkRestApi"),
    ("can_read", "DashboardFilterStateRestApi"),
    ("can_read", "DashboardPermalinkRestApi"),
    ("can_read", "Annotation"),
    ("can_read", "AvailableDomains"),
    ("can_read", "CssTemplate"),
    ("can_read", "CurrentUserRestApi"),
    ("can_read", "Tag"),
    ("can_read", "Task"),
    ("can_read", "Theme"),
    ("can_read", "AdvancedDataType"),

    # --- Write permissions for filter/explore state persistence ---
    ("can_write", "DashboardFilterStateRestApi"),
    ("can_write", "DashboardPermalinkRestApi"),
    ("can_write", "ExploreFormDataRestApi"),
    ("can_write", "ExplorePermalinkRestApi"),
    ("can_write", "CurrentUserRestApi"),

    # --- API & menu access ---
    ("can_get", "MenuApi"),
    ("can_get", "OpenApi"),
    ("can_query", "Api"),
    ("can_query_form_data", "Api"),
    ("can_time_range", "Api"),
    ("can_list", "AsyncEventsRestApi"),
    ("can_list", "DynamicPlugin"),
    ("can_list", "SavedQuery"),
    ("can_list", "Tags"),
    ("can_show", "DynamicPlugin"),
    ("can_show", "SwaggerView"),
    ("can_recent_activity", "Log"),

    # --- Menu items ---
    ("menu_access", "Home"),
    ("menu_access", "Dashboards"),
    ("menu_access", "Charts"),
    ("menu_access", "Data"),
    ("menu_access", "Databases"),
    ("menu_access", "Datasets"),
]

ROLE_NAME = "GC_Creator"


def ensure_role_with_permissions():
    """Create or update the GC_Creator role with exactly the whitelisted permissions."""
    from superset.app import create_app

    app = create_app()
    with app.app_context():
        from superset import security_manager
        from superset.extensions import db

        # Ensure role exists
        role = security_manager.find_role(ROLE_NAME)
        if not role:
            role = security_manager.add_role(ROLE_NAME)
            print(f"Created role '{ROLE_NAME}'")

        # Clear existing permissions (whitelist = start fresh)
        role.permissions = []

        # Add each whitelisted permission
        added = 0
        skipped = 0
        for perm_name, view_name in GC_CREATOR_PERMISSIONS:
            pv = security_manager.find_permission_view_menu(perm_name, view_name)
            if pv:
                role.permissions.append(pv)
                added += 1
            else:
                # Permission/view might not exist in this Superset version
                skipped += 1

        db.session.commit()
        print(
            f"Role '{ROLE_NAME}': {added} permissions set, "
            f"{skipped} skipped (not found in this Superset version)"
        )


if __name__ == "__main__":
    ensure_role_with_permissions()
