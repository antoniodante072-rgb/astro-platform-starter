import type { Context, Config } from "@netlify/functions";

interface FormSubmission {
  payload: {
    form_name: string;
    data: Record<string, string>;
    created_at: string;
    human_fields: Record<string, string>;
    ordered_human_fields: Array<{ name: string; value: string }>;
  };
}

export default async (req: Request, context: Context) => {
  try {
    const submission: FormSubmission = await req.json();
    const { form_name, data, ordered_human_fields } = submission.payload;

    // Get the notification email from environment variable
    const notificationEmail = Netlify.env.get("NOTIFICATION_EMAIL");

    if (!notificationEmail) {
      console.log("NOTIFICATION_EMAIL environment variable not set. Skipping email notification.");
      return new Response("No notification email configured", { status: 200 });
    }

    // Build the email content
    const formattedFields = ordered_human_fields
      .map(field => `${field.name}: ${field.value}`)
      .join("\n");

    const emailSubject = `New ${form_name} Submission - ClearSpace Cleaning`;
    const emailBody = `
You have received a new form submission from ClearSpace Cleaning website.

Form: ${form_name}
Submitted at: ${new Date().toLocaleString("en-GB", { timeZone: "Europe/London" })}

Details:
${formattedFields}

---
This email was sent automatically from your ClearSpace Cleaning website.
    `.trim();

    // Log the submission for debugging
    console.log("Form submission received:", {
      form_name,
      timestamp: new Date().toISOString(),
      fields: Object.keys(data).length
    });

    // Use Netlify's built-in email notification or external service
    // For now, we'll use console.log to record submissions
    // The user will need to configure an email service (SendGrid, Mailgun, etc.)
    // or use Netlify's form notification settings in the dashboard

    console.log("Email would be sent to:", notificationEmail);
    console.log("Subject:", emailSubject);
    console.log("Body:", emailBody);

    // If using an external email service, add the API call here
    // Example with a hypothetical email API:
    const emailApiKey = Netlify.env.get("EMAIL_API_KEY");
    const emailApiUrl = Netlify.env.get("EMAIL_API_URL");

    if (emailApiKey && emailApiUrl) {
      try {
        const emailResponse = await fetch(emailApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${emailApiKey}`
          },
          body: JSON.stringify({
            to: notificationEmail,
            subject: emailSubject,
            text: emailBody,
            from: "noreply@clearspacecleaning.co.uk"
          })
        });

        if (emailResponse.ok) {
          console.log("Email sent successfully");
        } else {
          console.error("Failed to send email:", await emailResponse.text());
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response("Submission processed", { status: 200 });
  } catch (error) {
    console.error("Error processing form submission:", error);
    return new Response("Error processing submission", { status: 500 });
  }
};
