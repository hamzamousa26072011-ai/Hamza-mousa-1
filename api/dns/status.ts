import dns from "dns";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const customDomain = "engeznafsak.com";
  const wwwDomain = "www.engeznafsak.com";
  const detectedHost = req.headers.host || "";
  const isIncomingFromCustomDns = detectedHost.includes("engeznafsak.com");

  let apexIps: string[] = [];
  let wwwIps: string[] = [];
  let dnsResolved = false;
  let dnsError: string | null = null;

  try {
    const [apexResult, wwwResult] = await Promise.allSettled([
      dns.promises.resolve4(customDomain),
      dns.promises.resolve4(wwwDomain)
    ]);

    if (apexResult.status === "fulfilled") {
      apexIps = apexResult.value;
      dnsResolved = true;
    }
    if (wwwResult.status === "fulfilled") {
      wwwIps = wwwResult.value;
      dnsResolved = true;
    }
  } catch (err: any) {
    dnsError = err?.message || String(err);
  }

  return res.status(200).json({
    status: dnsResolved ? "CONNECTED_VERIFIED" : "DNS_CHECK_NOTICE",
    connected: dnsResolved,
    canonicalDomain: customDomain,
    canonicalWwwDomain: wwwDomain,
    detectedHost,
    isIncomingFromCustomDns,
    dnsLookup: {
      resolved: dnsResolved,
      apexDomain: customDomain,
      apexIps,
      wwwDomain,
      wwwIps,
      error: dnsError
    },
    authProxy: {
      active: true,
      authHandlerUrl: `https://${customDomain}/__/auth/handler`
    },
    recommendedDnsRecords: [
      {
        type: "A",
        name: "@",
        value: "76.76.21.21",
        description: "Points root domain engeznafsak.com to hosting infrastructure"
      },
      {
        type: "CNAME",
        name: "www",
        value: "cname.vercel-dns.com",
        description: "Points www.engeznafsak.com subdomain to hosting infrastructure"
      }
    ],
    firebaseAuthorizedDomains: [
      "engeznafsak.com",
      "www.engeznafsak.com",
      "localhost"
    ],
    timestamp: new Date().toISOString()
  });
}
