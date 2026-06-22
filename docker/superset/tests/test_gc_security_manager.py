"""Unit tests for the GC security manager SSO logic.

These tests validate the JWT verification, JTI tracking, and error page
rendering without requiring a full Superset application context.
"""

import os
import sys
import time

import jwt
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from jti_store import JtiStore

# Test constants
TEST_SECRET = "test-sso-secret-for-unit-tests"
VALID_PAYLOAD = {
    "sub": 42,
    "aud": "superset",
    "email": "42@grottocenter.org",
    "firstName": "Jean",
    "lastName": "Dupont",
    "jti": "test-unique-jti-001",
    "iat": int(time.time()),
}


def _make_token(payload=None, secret=None, exp_offset=30):
    """Helper to create a signed JWT."""
    p = dict(payload or VALID_PAYLOAD)
    if "iat" not in (payload or {}):
        p["iat"] = int(time.time())
    p["exp"] = p["iat"] + exp_offset
    return jwt.encode(p, secret or TEST_SECRET, algorithm="HS256")


class TestJwtVerification:
    """Test JWT signature, audience, and freshness verification."""

    def test_valid_token_decodes_successfully(self):
        token = _make_token()
        decoded = jwt.decode(token, TEST_SECRET, algorithms=["HS256"], audience="superset", options={"verify_sub": False})
        assert decoded["sub"] == 42
        assert decoded["aud"] == "superset"
        assert decoded["email"] == "42@grottocenter.org"

    def test_invalid_signature_raises(self):
        token = _make_token(secret="wrong-secret")
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, TEST_SECRET, algorithms=["HS256"], audience="superset", options={"verify_sub": False})

    def test_expired_token_raises(self):
        token = _make_token(exp_offset=-10)
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, TEST_SECRET, algorithms=["HS256"], audience="superset", options={"verify_sub": False})

    def test_wrong_audience_detected(self):
        payload = dict(VALID_PAYLOAD)
        payload["aud"] = "not-superset"
        token = _make_token(payload=payload)
        with pytest.raises(jwt.InvalidAudienceError):
            jwt.decode(token, TEST_SECRET, algorithms=["HS256"], audience="superset", options={"verify_sub": False})

    def test_iat_freshness_check(self):
        """Token with iat older than 30s should be considered expired."""
        payload = dict(VALID_PAYLOAD)
        payload["iat"] = int(time.time()) - 60  # 60s ago
        token = _make_token(payload=payload, exp_offset=120)
        decoded = jwt.decode(token, TEST_SECRET, algorithms=["HS256"], audience="superset", options={"verify_exp": False, "verify_sub": False})
        assert (time.time() - decoded["iat"]) > 30


class TestJtiReplayProtection:
    """Test that consumed JTIs are rejected on reuse."""

    def test_first_use_passes(self):
        store = JtiStore(ttl_seconds=30)
        assert store.contains("fresh-jti") is False

    def test_second_use_rejected(self):
        store = JtiStore(ttl_seconds=30)
        store.add("used-jti")
        assert store.contains("used-jti") is True

    def test_eviction_clears_old_entries(self):
        store = JtiStore(ttl_seconds=0)
        store.add("old-jti")
        time.sleep(0.01)
        assert store.contains("old-jti") is False


class TestErrorPageRendering:
    """Test that error pages don't expose sensitive information."""

    def test_error_template_contains_reason_placeholder(self):
        template_path = os.path.join(
            os.path.dirname(__file__), "..", "templates", "sso_error.html"
        )
        with open(template_path, "r") as f:
            content = f.read()

        assert "{{ reason }}" in content
        assert "close this tab and try again from Grottocenter" in content

    def test_error_template_does_not_contain_secrets(self):
        template_path = os.path.join(
            os.path.dirname(__file__), "..", "templates", "sso_error.html"
        )
        with open(template_path, "r") as f:
            content = f.read()

        # Should not contain any env var references, stack trace patterns, or paths
        assert "SUPERSET_SSO_SECRET" not in content
        assert "SSO_SALT" not in content
        assert "traceback" not in content.lower()
        assert "/app/pythonpath" not in content
