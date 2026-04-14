export const brand = {
  name: "Snapvite",
  tagline: "Screenshot any event, add it to your calendar in one tap.",
  description:
    "Snapvite turns screenshots of events — iMessages, Telegram chats, Luma invites, booking confirmations — into calendar events in seconds.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://snapvite.app",
  email: {
    from: "Snapvite <events@snapvite.app>",
  },
  social: {
    twitter: "https://twitter.com/snapvite",
  },
} as const;
