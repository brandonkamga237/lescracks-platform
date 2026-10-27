package com.brandonkamga.lescracks.shared.security;

import jakarta.servlet.Filter;

/**
 * A filter a module plugs into the security chain, run once the caller is authenticated.
 * Modules implement it; the chain picks every bean up, so shared never depends on a module.
 */
public interface AuthenticatedRequestFilter extends Filter {
}
