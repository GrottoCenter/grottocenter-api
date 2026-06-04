"""
Superset configuration for Grottocenter local development.
"""
import os

# Security
SECRET_KEY = os.environ.get('SUPERSET_SECRET_KEY', 'grottocenter_local_dev_secret_key_change_in_prod')

# ============================================================
# Branding
# ============================================================
APP_NAME = "Grottocenter"
APP_ICON = "/static/assets/images/grottocenter/grottocenter-logo.svg"
FAVICONS = [{"href": "/static/assets/images/favicon.png"}]

# Grottocenter color palette (matches grottoTheme.js from grottocenter-front)
# Primary: brown, Secondary: orange, Accent: blue
EXTRA_CATEGORICAL_COLOR_SCHEMES = [
    {
        "id": "grottocenter",
        "description": "Grottocenter brand colors",
        "label": "Grottocenter",
        "isDefault": True,
        "colors": [
            "#795548",  # brown 500 (primary light)
            "#5D4037",  # brown 700 (primary main)
            "#FF9800",  # orange 500 (secondary light)
            "#F57C00",  # orange 700 (secondary main)
            "#2196F3",  # blue 500 (accent)
            "#1976D2",  # blue 700 (accent dark)
            "#3E2723",  # brown 900 (primary dark)
            "#E65100",  # orange 900 (secondary dark)
            "#90CAF9",  # blue 200 (accent light)
            "#A1887F",  # brown 300
        ],
    }
]

THEME_OVERRIDES = {
    "colors": {
        "primary": {"base": "#2196F3"},
        "secondary": {"base": "#607D8B"},
    }
}

# Superset 6.x theme tokens (overrides THEME_DEFAULT and THEME_DARK)
THEME_DEFAULT = {
    "token": {
        "brandAppName": "Grottocenter",
        "brandLogoAlt": "Grottocenter",
        "brandLogoUrl": "/static/assets/images/grottocenter/grottocenter-logo.svg",
        "brandLogoMargin": "18px 0",
        "brandLogoHref": "/",
        "brandLogoHeight": "24px",
        "colorPrimary": "#5D4037",
        "colorLink": "#F57C00",
        "colorSuccess": "#4CAF50",
        "colorWarning": "#FF9800",
        "colorError": "#F44336",
    },
    "algorithm": "default",
}

THEME_DARK = {
    "token": {
        "brandAppName": "Grottocenter",
        "brandLogoAlt": "Grottocenter",
        "brandLogoUrl": "/static/assets/images/grottocenter/grottocenter-logo.svg",
        "brandLogoMargin": "18px 0",
        "brandLogoHref": "/",
        "brandLogoHeight": "24px",
        "colorPrimary": "#5D4037",
        "colorLink": "#F57C00",
        "colorSuccess": "#4CAF50",
        "colorWarning": "#FF9800",
        "colorError": "#F44336",
    },
    "algorithm": "dark",
}

# ============================================================
# Database
# ============================================================

# Database for Superset metadata (dashboards, datasets, users)
SQLALCHEMY_DATABASE_URI = os.environ.get(
    'SQLALCHEMY_DATABASE_URI',
    'postgresql://root:root@dbserver:5432/grottoce'
)

# Connection pool settings
SQLALCHEMY_POOL_SIZE = 5
SQLALCHEMY_POOL_TIMEOUT = 30
SQLALCHEMY_MAX_OVERFLOW = 10

# Redis for caching and Celery broker
REDIS_URL = os.environ.get('REDIS_URL', '')

CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache' if REDIS_URL else 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 300,
    'CACHE_KEY_PREFIX': 'superset_',
    'CACHE_REDIS_URL': REDIS_URL or None,
}

DATA_CACHE_CONFIG = {
    'CACHE_TYPE': 'RedisCache' if REDIS_URL else 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 600,
    'CACHE_KEY_PREFIX': 'superset_data_',
    'CACHE_REDIS_URL': REDIS_URL or None,
}

# Embedded dashboard support (for grottocenter-front integration)
FEATURE_FLAGS = {
    'EMBEDDED_SUPERSET': True,
    'ENABLE_TEMPLATE_PROCESSING': True,
}

# CORS (allow grottocenter-front in all environments)
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['Content-Type', 'Authorization', 'X-GuestToken', 'X-CSRFToken'],
    'resources': ['*'],
    'origins': [
        'http://localhost:3000',
        'http://localhost:1337',
        'https://grottocenter.org',
        'https://www.grottocenter.org',
        'https://api.grottocenter.org',
        'https://bi.grottocenter.org',
    ],
}

# Guest token for embedded dashboards
GUEST_ROLE_NAME = 'Public'
GUEST_TOKEN_JWT_SECRET = SECRET_KEY
GUEST_TOKEN_JWT_ALGO = 'HS256'
GUEST_TOKEN_HEADER_NAME = 'X-GuestToken'

# Session cookie settings (no tracking, secure, minimal)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = os.environ.get('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
SESSION_COOKIE_SAMESITE = 'Lax'

# Disable examples loading
LOAD_EXAMPLES = False

# Disable Scarf telemetry
SCARF_ANALYTICS = False

# Disable external analytics and tracking
from superset.stats_logger import DummyStatsLogger
STATS_LOGGER = DummyStatsLogger()
LOG_LEVEL = 'WARNING'

# Map visualization defaults
DEFAULT_MAP_CENTER = (46.5, 2.5)  # France center (many caves there)
DEFAULT_MAP_ZOOM = 5

# Content Security Policy — allow map tile servers
TALISMAN_ENABLED = True
TALISMAN_CONFIG = {
    'content_security_policy': {
        'default-src': ["'self'"],
        'img-src': [
            "'self'",
            'blob:',
            'data:',
            'https://*.openstreetmap.org',
            'https://ows.terrestris.de',
            'https://ows.mundialis.de',
            'https://tiles.stadiamaps.com',
            'https://server.arcgisonline.com',
            'https://basemap.nationalmap.gov',
            'https://apachesuperset.gateway.scarf.sh',
            'https://static.scarf.sh/',
        ],
        'worker-src': ["'self'", 'blob:'],
        'connect-src': [
            "'self'",
            'https://*.openstreetmap.org',
            'https://ows.terrestris.de',
            'https://ows.mundialis.de',
            'https://tiles.stadiamaps.com',
        ],
        'style-src': ["'self'", "'unsafe-inline'"],
        # 'unsafe-eval' is required by Superset's React/webpack bundle
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'font-src': ["'self'", 'data:'],
    },
    'content_security_policy_nonce_in': ['script-src'],
    'force_https': False,
}
