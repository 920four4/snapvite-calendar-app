const SANDBOX_FROM = "Snapvite <onboarding@resend.dev>";

// Server-only. `RESEND_FROM_EMAIL` should be a verified sender on a Resend-
// verified domain (e.g. `Snapvite <invite@snapvite.app>`). If unset we fall
// back to the Resend sandbox sender, which can only deliver to the account
// owner's verified address — treat that as "email disabled" at the UI layer.
export const resendFromAddress = process.env.RESEND_FROM_EMAIL?.trim() || SANDBOX_FROM;
export const isEmailDeliveryConfigured =
  !!process.env.RESEND_API_KEY && resendFromAddress !== SANDBOX_FROM;

export const brand = {
  name: "Snapvite",
  tagline: "Screenshot any event, add it to your calendar in one tap.",
  description:
    "Snapvite turns screenshots of events — iMessages, Telegram chats, Luma invites, booking confirmations — into calendar events in seconds.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://snapvite.app",
  email: {
    from: resendFromAddress,
  },
  social: {
    twitter: "https://twitter.com/snapvite",
  },
} as const;
