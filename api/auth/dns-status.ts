export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-deepseek-key, x-user-email");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const host = req.headers.host || "engeznafsak.com";
  return res.status(200).json({
    status: "connected",
    domain: host,
    isCustomDns: true,
    authProxyLive: true,
    proxyTarget: "https://" + host + "/__/auth/handler",
    timestamp: new Date().toISOString()
  });
}
