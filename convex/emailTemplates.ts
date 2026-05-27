// Pure TypeScript helper for generating HTML email strings. No Convex runtime dependencies —
// safe to import anywhere without pulling in server-side primitives.

export type UnreadNotification = {
  message: string;
  type: string;
};

export type SparkedVentureUpdate = {
  ventureName: string;
  currentStage: number;
  currentCheckpoint: number;
};

export type PlatformStats = {
  newVenturesThisWeek: number;
};

const STAGE_NAMES: Record<number, string> = {
  1: "Ideation",
  2: "Validation",
  3: "Planning",
  4: "Building",
  5: "Testing",
  6: "Launch",
  7: "Growth",
  8: "Scale",
};

function stageName(stage: number): string {
  return STAGE_NAMES[stage] ?? `Stage ${stage}`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildNotificationsSection(notifications: UnreadNotification[]): string {
  if (notifications.length === 0) return "";

  const shown = notifications.slice(0, 5);
  const overflow = notifications.length - shown.length;

  const items = shown
    .map(
      (n) => `
      <div style="background-color:#0E0C17;border-left:3px solid #7C3AED;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:8px;">
        <span style="color:#e8e4f0;font-size:14px;line-height:1.5;">${escapeHtml(n.message)}</span>
      </div>`
    )
    .join("\n");

  const more =
    overflow > 0
      ? `<p style="margin:8px 0 0;color:#9d94b8;font-size:13px;">…and ${overflow} more waiting for you</p>`
      : "";

  return `
  <div style="margin-bottom:28px;">
    <p style="margin:0 0 12px;color:#9d94b8;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Unread Notifications</p>
    ${items}
    ${more}
  </div>
  <div style="height:1px;background:linear-gradient(90deg,transparent,#2d2550,transparent);margin-bottom:28px;"></div>`;
}

function buildVenturesSection(ventures: SparkedVentureUpdate[]): string {
  if (ventures.length === 0) return "";

  const shown = ventures.slice(0, 5);

  const cards = shown
    .map(
      (venture) => `
      <div style="background-color:#0E0C17;border-radius:10px;padding:16px;margin-bottom:8px;border:1px solid #2d2550;">
        <p style="margin:0 0 10px;color:#ffffff;font-size:15px;font-weight:600;">${escapeHtml(venture.ventureName)}</p>
        <div>
          <span style="display:inline-block;background:#2d2550;border-radius:6px;padding:4px 10px;margin-right:6px;">
            <span style="color:#FFDF00;font-size:12px;font-weight:700;">Stage ${venture.currentStage}: ${stageName(venture.currentStage)}</span>
          </span>
          <span style="display:inline-block;background:#1a1530;border-radius:6px;padding:4px 10px;">
            <span style="color:#9d94b8;font-size:12px;">Checkpoint ${venture.currentCheckpoint}</span>
          </span>
        </div>
      </div>`
    )
    .join("\n");

  return `
  <div style="margin-bottom:28px;">
    <p style="margin:0 0 4px;color:#9d94b8;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Someone You Believed In Made Progress</p>
    <p style="margin:0 0 14px;color:#6b6285;font-size:12px;">Ventures you sparked while you were away</p>
    ${cards}
  </div>
  <div style="height:1px;background:linear-gradient(90deg,transparent,#2d2550,transparent);margin-bottom:28px;"></div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Farewell email — sent exactly once when a user crosses the churn threshold.
// Tone: honest, a little melancholic, no hard sell. Shows what they're leaving
// behind and makes clear this is the last email they'll receive.
// ─────────────────────────────────────────────────────────────────────────────

export function buildFarewellEmail(
  userName: string,
  inactiveDays: number,
  unreadNotifications: UnreadNotification[],
  sparkedVentureUpdates: SparkedVentureUpdate[],
  platformStats: PlatformStats
): string {
  const notificationsSection = buildNotificationsSection(unreadNotifications);
  const { newVenturesThisWeek } = platformStats;
  const hasPersonalisedContent =
    unreadNotifications.length > 0 || sparkedVentureUpdates.length > 0;

  const venturesSection =
    sparkedVentureUpdates.length === 0
      ? ""
      : `
  <div style="margin-bottom:28px;">
    <p style="margin:0 0 4px;color:#9d94b8;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">Ventures You Sparked Are Still Going</p>
    <p style="margin:0 0 14px;color:#6b6285;font-size:12px;">They kept building — even without you there to see it.</p>
    ${sparkedVentureUpdates
      .slice(0, 5)
      .map(
        (venture) => `
      <div style="background-color:#0E0C17;border-radius:10px;padding:16px;margin-bottom:8px;border:1px solid #2d2550;">
        <p style="margin:0 0 10px;color:#ffffff;font-size:15px;font-weight:600;">${escapeHtml(venture.ventureName)}</p>
        <span style="display:inline-block;background:#2d2550;border-radius:6px;padding:4px 10px;margin-right:6px;">
          <span style="color:#FFDF00;font-size:12px;font-weight:700;">Stage ${venture.currentStage}: ${stageName(venture.currentStage)}</span>
        </span>
        <span style="display:inline-block;background:#1a1530;border-radius:6px;padding:4px 10px;">
          <span style="color:#9d94b8;font-size:12px;">Checkpoint ${venture.currentCheckpoint}</span>
        </span>
      </div>`
      )
      .join("\n")}
  </div>
  <div style="height:1px;background:linear-gradient(90deg,transparent,#2d2550,transparent);margin-bottom:28px;"></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Before we go — Interactive Ideas</title>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800&display=swap" rel="stylesheet">
  <style>@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800&display=swap');</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Exo 2',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#000000;padding:32px 16px;min-width:320px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:580px;width:100%;">

          <!-- Logo — update src if your path differs from /logo.png -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="https://ibhaveda.com" style="text-decoration:none;display:block;">
                <img src="https://ibhaveda.com/logo.png"
                     alt="Interactive Ideas"
                     width="210"
                     style="display:block;margin:0 auto;height:auto;border:0;max-width:210px;"
                />
              </a>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#16122a;border-radius:16px;padding:40px 36px 36px;border:1px solid #2d2550;">

              <!-- Farewell badge -->
              <div style="text-align:center;margin-bottom:20px;">
                <span style="display:inline-block;background:#1a1530;border:1px solid #3d3560;border-radius:20px;padding:6px 16px;color:#9d94b8;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">
                  This is our last email to you
                </span>
              </div>

              <!-- Hero -->
              <h1 style="margin:0 0 12px;color:#ffffff;font-size:26px;font-weight:800;line-height:1.35;text-align:center;font-family:'Exo 2','Courier New',Courier,monospace;">
                You've been away <span style="color:#FFDF00;">${inactiveDays}&nbsp;days</span>,&nbsp;${escapeHtml(userName)}.
              </h1>
              <p style="margin:0 0 6px;color:#9d94b8;font-size:15px;text-align:center;line-height:1.6;">
                After this, we'll stop reaching out.
              </p>
              ${hasPersonalisedContent ? `
              <p style="margin:0 0 28px;color:#6b6285;font-size:14px;text-align:center;line-height:1.6;">
                But before we go — here's everything you'd be leaving behind.
              </p>` : `
              <p style="margin:0 0 28px;color:#6b6285;font-size:14px;text-align:center;line-height:1.6;">
                The community is still building. Come back whenever you're ready.
              </p>`}

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#3d3560,transparent);margin-bottom:28px;"></div>

              ${notificationsSection}
              ${venturesSection}

              <!-- Platform stat -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#0E0C17;border-radius:12px;margin-bottom:32px;border:1px solid #2d2550;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 4px;color:#9d94b8;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">While You Were Away</p>
                    <p style="margin:0;color:#FFDF00;font-size:30px;font-weight:800;line-height:1.2;">${newVenturesThisWeek} new ventures</p>
                    <p style="margin:6px 0 0;color:#9d94b8;font-size:13px;line-height:1.5;">
                      launched just this week. The community is moving fast — with or without you.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="https://ibhaveda.com"
                       style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#5b21b6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:10px;letter-spacing:0.3px;line-height:1;">
                      Take me back &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Goodbye note -->
              <p style="margin:0;color:#4a4568;font-size:13px;text-align:center;line-height:1.6;font-style:italic;">
                If you don't come back, we understand — and we won't send another email.<br>
                Whenever you're ready, we'll be here.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;color:#4a4568;font-size:12px;line-height:1.6;">
                This is the final email from Interactive Ideas to this address.
              </p>
              <p style="margin:6px 0 0;color:#4a4568;font-size:12px;">
                &copy; 2025 Interactive Ideas &middot;
                <a href="https://ibhaveda.com" style="color:#7C3AED;text-decoration:none;">Visit Platform</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Standard re-engagement email
// ─────────────────────────────────────────────────────────────────────────────

export function buildReengagementEmail(
  userName: string,
  inactiveDays: number,
  unreadNotifications: UnreadNotification[],
  sparkedVentureUpdates: SparkedVentureUpdate[],
  platformStats: PlatformStats
): string {
  const notificationsSection = buildNotificationsSection(unreadNotifications);
  const venturesSection = buildVenturesSection(sparkedVentureUpdates);
  const { newVenturesThisWeek } = platformStats;

  const hasPersonalisedContent =
    unreadNotifications.length > 0 || sparkedVentureUpdates.length > 0;

  const subhead = hasPersonalisedContent
    ? `here's what you missed, <strong style="color:#e8e4f0;">${escapeHtml(userName)}</strong>`
    : `the platform has kept moving, <strong style="color:#e8e4f0;">${escapeHtml(userName)}</strong>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been away — Interactive Ideas</title>
  <link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800&display=swap" rel="stylesheet">
  <style>@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800&display=swap');</style>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:'Exo 2',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:#000000;padding:32px 16px;min-width:320px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:580px;width:100%;">

          <!-- Logo — update src if your path differs from /logo.png -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <a href="https://ibhaveda.com" style="text-decoration:none;display:block;">
                <img src="https://ibhaveda.com/logo.png"
                     alt="Interactive Ideas"
                     width="210"
                     style="display:block;margin:0 auto;height:auto;border:0;max-width:210px;"
                />
              </a>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background-color:#16122a;border-radius:16px;padding:40px 36px 36px;border:1px solid #2d2550;">

              <!-- Hero headline -->
              <h1 style="margin:0 0 8px;color:#ffffff;font-size:27px;font-weight:800;line-height:1.3;text-align:center;font-family:'Exo 2','Courier New',Courier,monospace;">
                You've been away&nbsp;<span style="color:#FFDF00;">${inactiveDays}&nbsp;days</span>
              </h1>
              <p style="margin:0 0 8px;color:#9d94b8;font-size:16px;text-align:center;font-weight:400;">
                ${subhead}
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(90deg,transparent,#7C3AED,transparent);margin:28px 0;"></div>

              ${notificationsSection}
              ${venturesSection}

              <!-- Platform stat -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#0E0C17;border-radius:12px;margin-bottom:32px;border:1px solid #2d2550;">
                <tr>
                  <td style="padding:22px 24px;">
                    <p style="margin:0 0 4px;color:#9d94b8;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">This Week on the Platform</p>
                    <p style="margin:0;color:#FFDF00;font-size:30px;font-weight:800;line-height:1.2;">${newVenturesThisWeek} new ventures</p>
                    <p style="margin:6px 0 0;color:#9d94b8;font-size:13px;line-height:1.5;">
                      launched while you were away. The ecosystem keeps growing — don't miss what's next.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://ibhaveda.com"
                       style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#5b21b6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 44px;border-radius:10px;letter-spacing:0.3px;line-height:1;">
                      Come Back to Interactive Ideas &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;color:#4a4568;font-size:12px;line-height:1.6;">
                You're receiving this because you have an account on Interactive Ideas.
              </p>
              <p style="margin:6px 0 0;color:#4a4568;font-size:12px;">
                &copy; 2025 Interactive Ideas &middot;
                <a href="https://ibhaveda.com" style="color:#7C3AED;text-decoration:none;">Visit Platform</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
