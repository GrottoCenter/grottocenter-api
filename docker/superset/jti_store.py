"""
In-memory JTI (JWT ID) tracking with automatic time-based eviction.

Prevents token replay by tracking consumed jti values for a configurable
TTL (default 30 seconds). After the TTL expires, entries are automatically
evicted to keep memory bounded.
"""

import time
import threading


class JtiStore:
    """Thread-safe in-memory JTI store with automatic eviction."""

    def __init__(self, ttl_seconds: int = 30):
        self._store: dict[str, float] = {}  # jti → insertion_time
        self._ttl = ttl_seconds
        self._lock = threading.Lock()

    def contains(self, jti: str) -> bool:
        """Check if a jti has been consumed (evicts stale entries first)."""
        with self._lock:
            self._evict_stale()
            return jti in self._store

    def add(self, jti: str) -> None:
        """Record a jti as consumed."""
        with self._lock:
            self._store[jti] = time.time()

    def _evict_stale(self) -> None:
        """Remove entries older than the TTL."""
        now = time.time()
        cutoff = now - self._ttl
        self._store = {
            jti: ts for jti, ts in self._store.items() if ts > cutoff
        }
