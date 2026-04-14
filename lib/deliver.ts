import { brand } from "@/config/brand";

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
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY!);

  return resend.emails.send({
    from: brand.email.from,
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
