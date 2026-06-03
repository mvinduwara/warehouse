export function inviteUserTemplate(opts: {
  name: string;
  email: string;
  role: string;
  tempPassword: string;
  warehouseName: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `You've been invited to ${opts.warehouseName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f14;padding:40px 0">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#13161e;border:1px solid #2a2f42;border-radius:16px;overflow:hidden">
          <tr>
            <td style="background:linear-gradient(135deg,#4ade80,#22d3ee);padding:32px;text-align:center">
              <div style="width:48px;height:48px;background:rgba(0,0,0,0.2);border-radius:12px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#0d0f14;line-height:48px">W</div>
              <h1 style="margin:0;font-size:20px;font-weight:600;color:#0d0f14">WarehouseOS</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#e8eaf0">Welcome, ${opts.name}!</h2>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#8b92a8">
                You've been invited to join <strong style="color:#e8eaf0">${opts.warehouseName}</strong> as a
                <strong style="color:#4ade80;text-transform:capitalize">${opts.role}</strong>.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1e28;border:1px solid #2a2f42;border-radius:10px;margin:0 0 24px">
                <tr>
                  <td style="padding:16px 20px">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#555d73">Your login credentials</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#8b92a8">Email: <span style="color:#e8eaf0;font-family:monospace">${opts.email}</span></p>
                    <p style="margin:0;font-size:13px;color:#8b92a8">Temporary password: <span style="color:#4ade80;font-family:monospace;font-size:15px;font-weight:600">${opts.tempPassword}</span></p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:13px;color:#8b92a8">
                Please log in and change your password immediately.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr>
                  <td style="background:#4ade80;border-radius:10px">
                    <a href="${opts.loginUrl}" style="display:block;padding:14px 32px;font-size:14px;font-weight:600;color:#0d0f14;text-decoration:none">
                      Sign in to WarehouseOS →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #2a2f42">
              <p style="margin:0;font-size:12px;color:#555d73;text-align:center">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `
Welcome to ${opts.warehouseName}, ${opts.name}!

You've been invited as a ${opts.role}.

Login credentials:
  Email: ${opts.email}
  Temporary password: ${opts.tempPassword}

Sign in at: ${opts.loginUrl}

Please change your password after logging in.
`.trim();

  return { subject, html, text };
}

export function lowStockAlertTemplate(opts: {
  items: Array<{ sku: string; name: string; qty: number; reorderPoint: number; zone: string }>;
  warehouseName: string;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const criticalCount = opts.items.filter((i) => i.qty === 0 || i.qty <= i.reorderPoint * 0.25).length;
  const subject = `${criticalCount > 0 ? `⚠ ${criticalCount} critical` : `Low stock alert`} — ${opts.items.length} item${opts.items.length > 1 ? "s" : ""} need attention`;

  const rowsHtml = opts.items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #2a2f42">
        <td style="padding:10px 16px;font-family:monospace;font-size:12px;color:#8b92a8">${item.sku}</td>
        <td style="padding:10px 16px;font-size:13px;color:#e8eaf0">${item.name}</td>
        <td style="padding:10px 16px;font-size:13px;font-weight:600;color:${item.qty === 0 ? "#f87171" : item.qty <= item.reorderPoint * 0.25 ? "#f87171" : "#f59e0b"}">${item.qty}</td>
        <td style="padding:10px 16px;font-size:13px;color:#555d73">${item.reorderPoint}</td>
        <td style="padding:10px 16px;font-size:13px;color:#8b92a8">${item.zone}</td>
      </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f14;padding:40px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#13161e;border:1px solid #2a2f42;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #2a2f42">
              <h2 style="margin:0;font-size:18px;font-weight:600;color:#e8eaf0">
                <span style="color:#f59e0b">⚡</span> Low Stock Alert — ${opts.warehouseName}
              </h2>
              <p style="margin:6px 0 0;font-size:13px;color:#8b92a8">${opts.items.length} product${opts.items.length > 1 ? "s" : ""} require reordering</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0">
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="background:#1a1e28">
                    <th style="padding:8px 16px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#555d73">SKU</th>
                    <th style="padding:8px 16px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#555d73">Product</th>
                    <th style="padding:8px 16px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#555d73">On Hand</th>
                    <th style="padding:8px 16px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#555d73">Reorder Pt.</th>
                    <th style="padding:8px 16px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#555d73">Zone</th>
                  </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2a2f42;text-align:center">
              <a href="${opts.dashboardUrl}/inventory?status=low" style="display:inline-block;background:#4ade80;color:#0d0f14;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">
                View Inventory →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Low Stock Alert — ${opts.warehouseName}\n\n` +
    opts.items.map((i) => `${i.sku} — ${i.name}: ${i.qty} units (reorder at ${i.reorderPoint})`).join("\n");

  return { subject, html, text };
}

export function dailySummaryTemplate(opts: {
  date: string;
  warehouseName: string;
  stats: {
    ordersDispatched: number;
    ordersReceived: number;
    lowStockCount: number;
    transfersCompleted: number;
    inventoryValue: string;
  };
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Daily Summary — ${opts.date} — ${opts.warehouseName}`;

  const statCards = [
    { label: "Orders Dispatched", value: opts.stats.ordersDispatched, color: "#4ade80" },
    { label: "POs Received", value: opts.stats.ordersReceived, color: "#22d3ee" },
    { label: "Low Stock Items", value: opts.stats.lowStockCount, color: "#f59e0b" },
    { label: "Transfers Done", value: opts.stats.transfersCompleted, color: "#a78bfa" },
  ];

  const cardsHtml = statCards
    .map(
      (s) => `
      <td width="25%" style="padding:0 6px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1e28;border:1px solid #2a2f42;border-radius:10px">
          <tr>
            <td style="padding:14px 16px">
              <p style="margin:0 0 4px;font-size:11px;color:#555d73">${s.label}</p>
              <p style="margin:0;font-size:22px;font-weight:600;color:${s.color};font-family:monospace">${s.value}</p>
            </td>
          </tr>
        </table>
      </td>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0f14;padding:40px 0">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#13161e;border:1px solid #2a2f42;border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid #2a2f42">
              <h2 style="margin:0;font-size:18px;font-weight:600;color:#e8eaf0">Daily Summary</h2>
              <p style="margin:4px 0 0;font-size:13px;color:#555d73">${opts.date} — ${opts.warehouseName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 26px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>${cardsHtml}</tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:#1a1e28;border:1px solid #2a2f42;border-radius:10px">
                <tr>
                  <td style="padding:16px 20px">
                    <p style="margin:0 0 4px;font-size:11px;color:#555d73">Total Inventory Value</p>
                    <p style="margin:0;font-size:24px;font-weight:600;color:#e8eaf0;font-family:monospace">${opts.stats.inventoryValue}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #2a2f42;text-align:center">
              <a href="${opts.dashboardUrl}" style="display:inline-block;background:#4ade80;color:#0d0f14;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">
                Open Dashboard →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Daily Summary — ${opts.date}\n\nOrders Dispatched: ${opts.stats.ordersDispatched}\nPOs Received: ${opts.stats.ordersReceived}\nLow Stock Items: ${opts.stats.lowStockCount}\nTransfers Completed: ${opts.stats.transfersCompleted}\nInventory Value: ${opts.stats.inventoryValue}`;

  return { subject, html, text };
}