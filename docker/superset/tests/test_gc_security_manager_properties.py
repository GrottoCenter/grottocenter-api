"""Property-based tests for the GC security manager SSO logic.

Uses Hypothesis to validate correctness properties from the design document.
"""

import os
import sys
import time

import jwt
import pytest
from hypothesis import given, settings, assume
from hypothesis import strategies as st

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from jti_store import JtiStore

TEST_SECRET = "property-test-secret"


# --- Strategies ---

valid_payload_st = st.fixed_dictionaries({
    "sub": st.integers(min_value=1, max_value=999999),
    "aud": st.just("superset"),
    "email": st.from_regex(r"[0-9]+@grottocenter\.org", fullmatch=True),
    "firstName": st.text(min_size=0, max_size=50),
    "lastName": st.text(min_size=0, max_size=50),
    "jti": st.uuids().map(str),
})

non_superset_aud_st = st.text(min_size=1, max_size=20).filter(
    lambda s: s != "superset"
)

secret_st = st.text(min_size=1, max_size=64).filter(lambda s: len(s.strip()) > 0)


def _sign(payload, secret=TEST_SECRET, exp_offset=30):
    """Sign a payload as JWT."""
    p = dict(payload)
    p["iat"] = int(time.time())
    p["exp"] = p["iat"] + exp_offset
    return jwt.encode(p, secret, algorithm="HS256")


class TestProperty6JwtVerificationGate:
    """Property 6: Token accepted iff signature + aud + iat all pass."""

    @settings(max_examples=100)
    @given(payload=valid_payload_st, secret=secret_st)
    def test_valid_token_accepted(self, payload, secret):
        """Valid tokens pass all checks."""
        token = _sign(payload, secret=secret)
        decoded = jwt.decode(
            token, secret, algorithms=["HS256"],
            audience="superset", options={"verify_sub": False}
        )
        assert decoded["aud"] == "superset"
        assert (time.time() - decoded["iat"]) <= 30

    @settings(max_examples=100)
    @given(payload=valid_payload_st, sign_secret=secret_st, verify_secret=secret_st)
    def test_wrong_secret_rejected(self, payload, sign_secret, verify_secret):
        """Tokens signed with a different secret are rejected."""
        assume(sign_secret != verify_secret)
        token = _sign(payload, secret=sign_secret)
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(
                token, verify_secret, algorithms=["HS256"],
                audience="superset", options={"verify_sub": False}
            )

    @settings(max_examples=100)
    @given(payload=valid_payload_st, wrong_aud=non_superset_aud_st)
    def test_wrong_audience_rejected(self, payload, wrong_aud):
        """Tokens with non-superset audience are rejected by PyJWT."""
        payload_copy = dict(payload)
        payload_copy["aud"] = wrong_aud
        token = _sign(payload_copy)
        with pytest.raises(jwt.InvalidAudienceError):
            jwt.decode(
                token, TEST_SECRET, algorithms=["HS256"],
                audience="superset", options={"verify_sub": False}
            )


class TestProperty7ReplaySingleUse:
    """Property 7: After consumption, same JTI is rejected."""

    @settings(max_examples=100)
    @given(jti=st.uuids().map(str))
    def test_consumed_jti_is_rejected(self, jti):
        """Once added, a JTI is detected as already consumed."""
        store = JtiStore(ttl_seconds=30)
        assert store.contains(jti) is False
        store.add(jti)
        assert store.contains(jti) is True


class TestProperty10ErrorPagesSafe:
    """Property 10: Error pages are safe and informative."""

    FORBIDDEN_PATTERNS = [
        "SUPERSET_SSO_SECRET",
        "SSO_SALT_SUPERSET",
        "traceback",
        "Traceback",
        "/app/pythonpath",
        "File \"",
    ]

    def test_template_contains_required_elements(self):
        template_path = os.path.join(
            os.path.dirname(__file__), "..", "templates", "sso_error.html"
        )
        with open(template_path, "r") as f:
            content = f.read()

        assert "{{ reason }}" in content
        assert "close this tab and try again" in content

    def test_template_excludes_sensitive_content(self):
        template_path = os.path.join(
            os.path.dirname(__file__), "..", "templates", "sso_error.html"
        )
        with open(template_path, "r") as f:
            content = f.read()

        for pattern in self.FORBIDDEN_PATTERNS:
            assert pattern not in content, f"Template should not contain: {pattern}"
