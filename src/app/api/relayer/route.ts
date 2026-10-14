import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/firestoreService";
import {
  getRelayerAddress,
  getRelayerBalance,
  broadcastLiveOnChainNotarization,
  resolveValidPrivateKey,
} from "@/lib/relayerService";

/**
 * GET: Query Relayer Status & Balance
 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    const envKey = process.env.BASE_SEPOLIA_RELAYER_PRIVATE_KEY;
    const activeKey = resolveValidPrivateKey(settings.relayerPrivateKey, envKey);

    const res = await getRelayerBalance(activeKey);
    return NextResponse.json({
      configured: true,
      address: res.address,
      balanceEth: res.balanceEth,
      hasFunds: res.hasFunds,
      network: "Base Sepolia Testnet",
      chainId: 84532,
      error: res.error,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST: Broadcast a Live On-Chain Transaction or Run Test Ping
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, docHash, docTitle, rawPrivateKey } = body;

    const settings = await getSiteSettings();
    const envKey = process.env.BASE_SEPOLIA_RELAYER_PRIVATE_KEY;
    const activeKey = resolveValidPrivateKey(rawPrivateKey, settings.relayerPrivateKey, envKey);

    // Default test hash if running a test ping
    const targetHash = docHash || "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    const result = await broadcastLiveOnChainNotarization({
      docHash: targetHash,
      docTitle: docTitle || "Relayer Verification Ping",
      rawPrivateKey: activeKey,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
