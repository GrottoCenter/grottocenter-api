"""
Grottocenter custom security manager for Apache Superset.

Adds a /login/sso endpoint that accepts a short-lived JWT issued by
the GC API, verifies it, provisions (or updates) a local Superset user,
and establishes a Flask session.
"""

import logging
import os
import time

import jwt
from flask import current_app, redirect, render_template_string, request
from flask_login import login_user
from superset.security import SupersetSecurityManager

from jti_store import JtiStore

logger = logging.getLogger(__name__)

# Load the error template once at module level
_TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")
_ERROR_TEMPLATE_PATH = os.path.join(_TEMPLATE_DIR, "sso_error.html")

try:
    with open(_ERROR_TEMPLATE_PATH, "r", encoding="utf-8") as _f:
        _ERROR_TEMPLATE = _f.read()
except FileNotFoundError:
    _ERROR_TEMPLATE = (
        "<html><body><h1>Login Failed</h1>"
        "<p>{{ reason }}</p>"
        "<p>Please close this tab and try again from Grottocenter.</p>"
        "</body></html>"
    )

# Module-level JTI store (shared across requests within the same process).
# LIMITATION: In multi-worker deployments (Gunicorn with >1 worker), each worker
# has its own JTI store. A token consumed by worker A can be replayed on worker B.
# For the current traffic volume and 30s TTL, this is an acceptable risk.
# If replay protection needs to be absolute, replace with Redis SET NX EX.
_jti_store = JtiStore(ttl_seconds=30)

EXPECTED_AUDIENCE = "superset"
TOKEN_MAX_AGE_SECONDS = 30
GC_CREATOR_ROLE_NAME = "GC_Creator"


def _render_error(reason: str) -> tuple[str, int]:
    """Render the SSO error page with the given reason."""
    return render_template_string(_ERROR_TEMPLATE, reason=reason), 400


class GrottocenterSecurityManager(SupersetSecurityManager):
    """Custom security manager with GC SSO support."""

    def register_views(self) -> None:
        """Register parent views then add SSO route.

        We register the SSO endpoint directly on the Flask app (not via FAB)
        to ensure it is publicly accessible without Flask-Login authentication.
        The route is also exempted from CSRF since the token itself serves as
        the authentication proof (it's a cross-origin POST from grottocenter.org).
        """
        super().register_views()

        security_manager = self

        @self.appbuilder.app.route("/login/sso", methods=["POST"])
        def login_sso():
            """Handle SSO login via JWT from GC API (public endpoint)."""
            try:
                return security_manager._handle_sso_login()
            except Exception:
                logger.exception("Unexpected error during SSO login")
                return _render_error("An unexpected error occurred.")

        # Exempt from CSRF — the JWT itself is the proof of authenticity
        csrf = self.appbuilder.app.extensions.get("csrf")
        if csrf:
            csrf.exempt(login_sso)

    def _handle_sso_login(self):
        """Core SSO login logic — verify JWT, provision user, establish session."""
        # 1. Extract token
        token_str = request.form.get("token", "").strip()
        if not token_str:
            return _render_error("No authentication token was provided.")

        # 2. Get the SSO secret
        sso_secret = current_app.config.get("SUPERSET_SSO_SECRET", "").strip()
        if not sso_secret:
            logger.error("SUPERSET_SSO_SECRET is not configured")
            return _render_error("An unexpected error occurred.")

        # 3. Verify JWT signature and audience
        try:
            payload = jwt.decode(
                token_str,
                sso_secret,
                algorithms=["HS256"],
                audience=EXPECTED_AUDIENCE,
                options={"verify_exp": True, "verify_sub": False},
            )
        except jwt.ExpiredSignatureError:
            return _render_error("The authentication token has expired.")
        except jwt.InvalidAudienceError:
            return _render_error("This token is not intended for this service.")
        except jwt.InvalidTokenError:
            return _render_error("The authentication token is invalid.")

        # 4. Verify iat freshness (within 30s).
        # Defense-in-depth: PyJWT's verify_exp already rejects tokens past their
        # exp (which is iat + 30), but this manual check guards against tokens
        # where exp was manipulated independently of iat.
        iat = payload.get("iat")
        if iat is None or (time.time() - iat) > TOKEN_MAX_AGE_SECONDS:
            return _render_error("The authentication token has expired.")

        # 5. Check JTI for replay (atomic check-and-add to avoid TOCTOU race)
        jti = payload.get("jti")
        if not jti:
            return _render_error("The authentication token is invalid.")

        if not _jti_store.add_if_new(jti):
            return _render_error("This token has already been used.")

        # 6. JIT provision or update user
        email = payload.get("email", "")
        first_name = payload.get("firstName", "")
        last_name = payload.get("lastName", "")

        if not email:
            return _render_error("The authentication token is invalid.")

        user = self._jit_provision_user(email, first_name, last_name)
        if user is None:
            return _render_error("Service configuration error. Please contact support.")

        # 7. Establish session
        login_user(user)

        # 8. Redirect to landing page
        return redirect("/superset/welcome/")

    def _jit_provision_user(self, email: str, first_name: str, last_name: str):
        """Create or update a Superset user from SSO claims.

        Returns the user object, or None if the GC_Creator role is missing.
        """
        # Look up existing user by email (used as username)
        user = self.find_user(username=email)

        if user is None:
            # Create new user — need the GC_Creator role
            gc_role = self.find_role(GC_CREATOR_ROLE_NAME)
            if gc_role is None:
                logger.error(
                    f"Role '{GC_CREATOR_ROLE_NAME}' not found in Superset. "
                    "Cannot provision SSO user."
                )
                return None

            user = self.add_user(
                username=email,
                first_name=first_name or "Caver",
                last_name=last_name or "",
                email=email,
                role=gc_role,
            )
            if not user:
                logger.error(f"SSO: Failed to create Superset user '{email}'")
                return None
            logger.info(f"SSO: Created new Superset user '{email}'")
        else:
            # Update name if changed (never modify roles)
            changed = False
            if user.first_name != first_name:
                user.first_name = first_name or "Caver"
                changed = True
            if user.last_name != last_name:
                user.last_name = last_name or ""
                changed = True
            if changed:
                from superset.extensions import db

                db.session.commit()
                logger.info(f"SSO: Updated name for Superset user '{email}'")

        return user
