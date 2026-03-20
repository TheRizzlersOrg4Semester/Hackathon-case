import { DonationType, ThankYouTier } from "@prisma/client";

export type ThankYouEmailInput = {
  donorEmail: string | null;
  donorName: string | null;
  campaignId: string;
  campaignTitle: string;
  campaignSummary: string | null;
  amount: number;
  donationType: DonationType;
  receiptNumber: string;
  paymentReference: string;
  supporterAccessCode: string;
  supporterAccessCodeCreated: boolean;
  thankYouTier: ThankYouTier;
};

export type ThankYouEmailDelivery =
  | {
      status: "skipped";
      message: string;
    }
  | {
      status: "triggered";
      message: string;
      providerMessageId: string | null;
    }
  | {
      status: "failed";
      message: string;
      error: string;
    };

type SendThankYouEmailDeps = {
  apiKey?: string;
  fromEmail?: string;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
};

type ThankYouEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDonationType(donationType: DonationType): string {
  return donationType === DonationType.RECURRING ? "Lobende donation" : "Engangs-donation";
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function buildGreeting(donorName: string | null): string {
  if (!donorName || donorName.trim().length === 0) {
    return "Hej";
  }

  return `Hej ${donorName.trim()}`;
}

function buildCampaignUpdate(campaignTitle: string, campaignSummary: string | null): string {
  if (campaignSummary && campaignSummary.trim().length > 0) {
    return `${campaignTitle}: ${campaignSummary.trim()}`;
  }

  return `${campaignTitle} er stadig aktiv i PulseFund-demoen, og din støtte er nu en del af kampagnens momentum.`;
}

function buildTierSpecificLines(input: ThankYouEmailInput): string[] {
  const amount = formatCurrency(input.amount);
  const campaignUpdate = buildCampaignUpdate(input.campaignTitle, input.campaignSummary);

  if (input.thankYouTier === ThankYouTier.BASIC) {
    return [
      `Tak for din donation på ${amount} til ${input.campaignTitle}.`,
      "Vi sætter stor pris på, at du tog dig tid til at støtte kampagnen."
    ];
  }

  if (input.thankYouTier === ThankYouTier.PERSONAL) {
    return [
      `Tak for din donation på ${amount} til ${input.campaignTitle}. Din støtte gør en mærkbar forskel for kampagnen.`,
      `Kampagneopdatering: ${campaignUpdate}`
    ];
  }

  return [
    `Tusind tak for din store donation på ${amount} til ${input.campaignTitle}.`,
    `Kampagneopdatering: ${campaignUpdate}`,
    "Vores team følger personligt op, fordi din donation ligger i det hojeste takkeniveau."
  ];
}

export function buildThankYouEmailContent(
  input: ThankYouEmailInput,
  baseUrl = process.env.PULSEFUND_BASE_URL ?? "http://localhost:3000"
): ThankYouEmailContent {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const campaignUrl = `${normalizedBaseUrl}/campaigns/${input.campaignId}`;
  const myDonationsUrl = `${normalizedBaseUrl}/my-donations`;
  const greeting = buildGreeting(input.donorName);
  const subject =
    input.thankYouTier === ThankYouTier.FOLLOW_UP
      ? `Tak for din store donation til ${input.campaignTitle}`
      : `Tak for din donation til ${input.campaignTitle}`;

  const lines = [
    `${greeting},`,
    "",
    ...buildTierSpecificLines(input),
    "",
    "Dette er en demo-mail sendt efter en simuleret betaling i PulseFund.",
    `Donationstype: ${formatDonationType(input.donationType)}`,
    `Kvittering: ${input.receiptNumber}`,
    `Betalingsreference: ${input.paymentReference}`,
    `Supporter Access Code: ${input.supporterAccessCode}`,
    input.supporterAccessCodeCreated
      ? "Der blev oprettet en ny Supporter Access Code til dig."
      : "Din eksisterende Supporter Access Code blev genbrugt.",
    `Se kampagnen: ${campaignUrl}`,
    `Se dine donationer: ${myDonationsUrl}`,
    "",
    "Venlig hilsen",
    "PulseFund"
  ];

  const htmlParagraphs = lines
    .filter((line) => line.length > 0)
    .map((line) => `<p style="margin:0 0 12px;">${escapeHtml(line)}</p>`)
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#0f172a;">
      <h1 style="margin:0 0 20px;font-size:24px;color:#0f172a;">${escapeHtml(subject)}</h1>
      ${htmlParagraphs}
      <p style="margin:16px 0 0;">
        <a href="${escapeHtml(campaignUrl)}" style="color:#0f766e;">Gå til kampagnen</a>
      </p>
      <p style="margin:8px 0 0;">
        <a href="${escapeHtml(myDonationsUrl)}" style="color:#0f766e;">Se dine donationer</a>
      </p>
    </div>
  `.trim();

  return {
    subject,
    text: lines.join("\n"),
    html
  };
}

export async function sendDonationThankYouEmail(
  input: ThankYouEmailInput,
  deps: SendThankYouEmailDeps = {}
): Promise<ThankYouEmailDelivery> {
  if (!input.donorEmail) {
    return {
      status: "skipped",
      message: "Ingen donor-email blev angivet, sa takke-mailen blev ikke sendt."
    };
  }

  const apiKey = deps.apiKey ?? process.env.RESEND_API_KEY;
  const fromEmail = deps.fromEmail ?? process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      status: "skipped",
      message: "Resend er ikke konfigureret endnu. Saet RESEND_API_KEY og RESEND_FROM_EMAIL for at aktivere mails."
    };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const content = buildThankYouEmailContent(input, deps.baseUrl);

  try {
    const response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "pulsefund/0.1.0"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.donorEmail],
        subject: content.subject,
        html: content.html,
        text: content.text
      })
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          id?: string;
          message?: string;
          error?: {
            message?: string;
          };
        }
      | null;

    if (!response.ok) {
      const errorMessage = payload?.message ?? payload?.error?.message ?? `Resend request failed with status ${response.status}.`;
      return {
        status: "failed",
        message: "Takke-mailen kunne ikke afleveres til Resend.",
        error: errorMessage
      };
    }

    return {
      status: "triggered",
      message: `Takke-mailen blev sendt videre til Resend for ${input.donorEmail}.`,
      providerMessageId: payload?.id ?? null
    };
  } catch (error) {
    return {
      status: "failed",
      message: "Takke-mailen kunne ikke sendes pa grund af en teknisk fejl.",
      error: error instanceof Error ? error.message : "Unknown email error"
    };
  }
}
