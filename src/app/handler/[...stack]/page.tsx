import { HandlerClient } from "./handler-client";

/**
 * Static export requires every catch-all path to be enumerated so each gets a
 * prerendered HTML shell. These are Stack Auth's handler sub-routes; the OAuth
 * provider redirects back to `/handler/oauth-callback`, which boots the client
 * SDK to finish the flow. Missing a slug here would 404 that step.
 */
export function generateStaticParams() {
  return [
    "sign-in",
    "sign-up",
    "sign-out",
    "oauth-callback",
    "magic-link-callback",
    "email-verification",
    "password-reset",
    "forgot-password",
    "account-settings",
    "team-invitation",
    "error",
  ].map((slug) => ({ stack: [slug] }));
}

export default function HandlerPage() {
  return <HandlerClient />;
}
