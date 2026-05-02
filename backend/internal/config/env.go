package config

import (
	"os"
	"strings"
)

// SessionCookieDomain is the Set-Cookie Domain attribute (e.g. localhost or your.duckdns.org).
func SessionCookieDomain() string {
	d := strings.TrimSpace(os.Getenv("SESSION_COOKIE_DOMAIN"))
	if d != "" {
		return d
	}
	return "localhost"
}

// SessionCookieSecure sets the Secure flag on the session cookie (use true behind HTTPS).
func SessionCookieSecure() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("SESSION_COOKIE_SECURE")))
	return v == "1" || v == "true" || v == "yes"
}

// CorsAllowedOrigins returns allowed browser Origins. Nil or empty slice means allow any origin (reflect request Origin).
func CorsAllowedOrigins() []string {
	raw := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS"))
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func CorsOriginPermitted(origin string, allowed []string) bool {
	if allowed == nil {
		return true
	}
	for _, o := range allowed {
		if o == origin {
			return true
		}
	}
	return false
}
