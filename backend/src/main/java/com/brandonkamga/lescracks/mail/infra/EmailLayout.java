package com.brandonkamga.lescracks.mail.infra;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** The building blocks every template shares: the fixed frame and the inline-styled pieces inside it. */
@Component
public class EmailLayout {
    private static final String FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

    /** Footer of every email sent to newsletter subscribers. */
    public static final String NEWSLETTER_NOTE = "Tu reçois cet email parce que tu es abonné à la newsletter LesCracks. Une question ? Réponds simplement à ce message.";

    private final String siteUrl;

    public EmailLayout(@Value("${app.site.url:http://localhost:5173}") String siteUrl) {
        this.siteUrl = siteUrl.endsWith("/") ? siteUrl.substring(0, siteUrl.length() - 1) : siteUrl;
    }

    private static final Pattern LINK = Pattern.compile("<a\\s[^>]*href=\"([^\"]*)\"[^>]*>(.*?)</a>", Pattern.DOTALL);
    private static final Pattern BLOCK_END = Pattern.compile("</(p|h[1-6]|li|tr|table|div|blockquote)>|<br\\s*/?>", Pattern.CASE_INSENSITIVE);

    /** The HTML email in its frame, and the same body as plain text. */
    public RenderedEmail email(String subject, String title, String body, String note) {
        return new RenderedEmail(subject, frame(title, body, note), text(body) + "\n\n--\n" + text(note) + "\n" + siteUrl);
    }

    /** Plain text of an HTML fragment: links keep their address, blocks become paragraphs. */
    String text(String html) {
        Matcher links = LINK.matcher(html);
        StringBuilder withUrls = new StringBuilder();
        while (links.find()) {
            String url = links.group(1);
            String label = links.group(2).replaceAll("<[^>]+>", "").trim();
            String plain = label.isEmpty() || label.equals(url) ? url : label + " : " + url;
            links.appendReplacement(withUrls, Matcher.quoteReplacement(plain));
        }
        links.appendTail(withUrls);
        String text = BLOCK_END.matcher(withUrls).replaceAll("\n\n")
                .replaceAll("<li[^>]*>", "- ")
                .replaceAll("<[^>]+>", "")
                .replace("&nbsp;", " ").replace("&middot;", "·").replace("&lt;", "<").replace("&gt;", ">")
                .replace("&quot;", "\"").replace("&#39;", "'").replace("&amp;", "&");
        return text.lines().map(String::strip).reduce((a, b) -> a + "\n" + b).orElse("")
                .replaceAll("\n{3,}", "\n\n").strip();
    }

    /** An absolute link to a page of the site. */
    public String url(String path) {
        return siteUrl + (path.startsWith("/") ? path : "/" + path);
    }

    /**
     * The fixed LesCracks frame around every HTML email: a black band with the logo, a white
     * reading column, a quiet footer. Admins only write the body; the frame is not editable.
     * Light on purpose: a white body stays readable in every client, dark mode included.
     */
    public String frame(String title, String body, String note) {
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="color-scheme" content="light">
                <meta name="supported-color-schemes" content="light">
                <title>%1$s</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f4f2;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f2;">
                    <tr>
                      <td align="center" style="padding:32px 16px 40px 16px;">
                        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%%;">
                          <tr>
                            <td style="background-color:#0b0b0b;padding:20px 40px;border-radius:4px 4px 0 0;">
                              <a href="%2$s" style="text-decoration:none;"><img src="%2$s/images/email-logo.png" width="74" height="30" alt="LesCracks" style="display:block;border:0;width:74px;height:30px;font-family:%3$s;font-size:18px;font-weight:700;color:#d4af37;" /></a>
                            </td>
                          </tr>
                          <tr>
                            <td style="background-color:#ffffff;padding:40px;border:1px solid #e6e6e3;border-top:0;border-radius:0 0 4px 4px;font-family:%3$s;font-size:16px;line-height:1.65;color:#262626;">
                              %4$s
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 40px 0 40px;font-family:%3$s;font-size:12px;line-height:1.6;color:#6b6b6b;">
                              <p style="margin:0 0 8px 0;">
                                <a href="%2$s" style="color:#262626;font-weight:600;text-decoration:none;">LesCracks</a>
                                <span style="color:#b5b5b5;">&nbsp;&middot;&nbsp;</span>
                                <a href="%2$s/ressources" style="color:#6b6b6b;text-decoration:none;">Ressources</a>
                                <span style="color:#b5b5b5;">&nbsp;&middot;&nbsp;</span>
                                <a href="%2$s/evenements" style="color:#6b6b6b;text-decoration:none;">Événements</a>
                              </p>
                              <p style="margin:0;">%5$s</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(escapeHtml(title), siteUrl, FONT, body, note);
    }

    public String heading(String text) {
        return "<h1 style=\"margin:0 0 16px 0;font-size:24px;line-height:1.3;font-weight:700;color:#0b0b0b;\">" + text + "</h1>";
    }

    public String paragraph(String text) {
        return "<p style=\"margin:0 0 20px 0;font-size:16px;line-height:1.65;color:#262626;\">" + text + "</p>";
    }

    public String cover(String url, String alt) {
        return "<img src=\"" + url + "\" alt=\"" + alt + "\" width=\"518\" style=\"display:block;width:100%;max-width:518px;height:auto;border:0;border-radius:4px;margin:0 0 24px 0;\" />";
    }

    public String button(String label, String url) {
        return """
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 28px 0;">
                  <tr>
                    <td style="background-color:#d4af37;border-radius:4px;">
                      <a href="%s" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:600;color:#0b0b0b;text-decoration:none;">%s</a>
                    </td>
                  </tr>
                </table>
                """.formatted(url, label);
    }

    public String fallbackLink(String label, String url) {
        return "<p style=\"margin:0;font-size:13px;line-height:1.6;color:#6b6b6b;word-break:break-all;\">" + label
                + " <a href=\"" + url + "\" style=\"color:#8a6d10;\">" + url + "</a></p>";
    }

    public String absoluteImage(String coverImage) {
        if (coverImage == null || coverImage.isBlank()) {
            return siteUrl + "/preview.jpg";
        }
        if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
            return coverImage;
        }
        if (coverImage.startsWith("/")) {
            return siteUrl + coverImage;
        }
        return siteUrl + "/" + coverImage;
    }

    public String escapeHtml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
