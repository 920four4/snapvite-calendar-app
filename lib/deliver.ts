import { isEmailDeliveryConfigured, resendFromAddress } from "@/config/brand";

export class EmailNotConfiguredError extends Error {
  constructor() {
    super(
      "Email delivery is not configured on this deployment. Set RESEND_API_KEY and RESEND_FROM_EMAIL to a verified sender."
    );
    this.name = "EmailNotConfiguredError";
  }
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function sendToHey(params: {
  toEmail: string;
  eventTitle: string;
  ics: string;
}) {
  if (!isEmailDeliveryConfigured) {
    throw new EmailNotConfiguredError();
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY!);

  return resend.emails.send({
    from: resendFromAddress,
    to: params.toEmail,
    subject: params.eventTitle,
    text: "Tap the attached invite to add this event to your calendar.\n\nSent via Snapvite — snapvite.app",
    attachments: [
      {
        filename: `${slugify(params.eventTitle)}.ics`,
        content: Buffer.from(params.ics).toString("base64"),
      },
    ],
  });
}
