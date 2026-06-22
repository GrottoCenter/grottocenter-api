"""Unit tests for the JTI store."""

import time
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from jti_store import JtiStore


class TestJtiStore:
    """Test JTI store add/contains/eviction."""

    def test_contains_returns_false_for_unknown_jti(self):
        store = JtiStore(ttl_seconds=30)
        assert store.contains("unknown-jti") is False

    def test_contains_returns_true_after_add(self):
        store = JtiStore(ttl_seconds=30)
        store.add("test-jti-1")
        assert store.contains("test-jti-1") is True

    def test_eviction_after_ttl(self):
        store = JtiStore(ttl_seconds=0)  # immediate eviction
        store.add("expired-jti")
        time.sleep(0.01)
        assert store.contains("expired-jti") is False

    def test_multiple_jtis_tracked_independently(self):
        store = JtiStore(ttl_seconds=30)
        store.add("jti-a")
        store.add("jti-b")
        assert store.contains("jti-a") is True
        assert store.contains("jti-b") is True
        assert store.contains("jti-c") is False

    def test_add_same_jti_twice_still_detected(self):
        store = JtiStore(ttl_seconds=30)
        store.add("dup-jti")
        store.add("dup-jti")
        assert store.contains("dup-jti") is True

    def test_add_if_new_returns_true_for_new_jti(self):
        store = JtiStore(ttl_seconds=30)
        assert store.add_if_new("fresh-jti") is True

    def test_add_if_new_returns_false_for_existing_jti(self):
        store = JtiStore(ttl_seconds=30)
        store.add_if_new("used-jti")
        assert store.add_if_new("used-jti") is False

    def test_add_if_new_is_atomic(self):
        """Two sequential add_if_new calls — only first succeeds."""
        store = JtiStore(ttl_seconds=30)
        assert store.add_if_new("race-jti") is True
        assert store.add_if_new("race-jti") is False
