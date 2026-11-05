import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT_DIR = path.resolve("docs/redesign/revisi-3");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function loginDemo() {
  const res = await fetch("http://localhost:3001/api/auth/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "juri" }),
  });
  const cookieHeader = res.headers.get("set-cookie") || "";
  const match = cookieHeader.match(/sb_user_session=([^;]+)/);
  return match ? match[1] : null;
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve) => {
      this.ws.onopen = resolve;
      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function capture() {
  const sessionCookie = await loginDemo();
  console.log("Logged in demo session:", sessionCookie ? "OK" : "FAILED");

  const edge = spawn(EDGE_PATH, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 1500));

  try {
    const targetsRes = await fetch("http://127.0.0.1:9222/json");
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === "page") || targets[0];

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send("Page.enable");
    await cdp.send("Network.enable");

    // Helper function to capture screenshot
    async function takeScreenshot({ url, width, height, scrollY = 0, filename, auth = false }) {
      console.log(`Capturing ${filename} (${width}x${height}, scroll: ${scrollY})...`);

      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });

      if (auth && sessionCookie) {
        await cdp.send("Network.setCookie", {
          name: "sb_user_session",
          value: sessionCookie,
          domain: "localhost",
          path: "/",
        });
      } else {
        await cdp.send("Network.deleteCookies", { name: "sb_user_session", domain: "localhost" });
      }

      await cdp.send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, 2500));

      if (scrollY > 0) {
        await cdp.send("Runtime.evaluate", {
          expression: `window.scrollTo(0, ${scrollY})`,
        });
        await new Promise((r) => setTimeout(r, 600));
      }

      const screenshot = await cdp.send("Page.captureScreenshot", {
        format: "png",
      });

      const buffer = Buffer.from(screenshot.data, "base64");
      const outPath = path.join(OUT_DIR, filename);
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved: ${outPath}`);
    }

    // 1. Landing di puncak (1440px)
    await takeScreenshot({
      url: "http://localhost:3001/",
      width: 1440,
      height: 900,
      scrollY: 0,
      filename: "landing-1440-top.png",
      auth: false,
    });

    // 2. Landing setelah scroll (1440px, navbar kaca blur)
    await takeScreenshot({
      url: "http://localhost:3001/",
      width: 1440,
      height: 900,
      scrollY: 350,
      filename: "landing-1440-scrolled.png",
      auth: false,
    });

    // 3. Landing di puncak (375px mobile)
    await takeScreenshot({
      url: "http://localhost:3001/",
      width: 375,
      height: 812,
      scrollY: 0,
      filename: "landing-375-top.png",
      auth: false,
    });

    // 4. Dashboard (1440px, dengan CV demo aktif & skill)
    await takeScreenshot({
      url: "http://localhost:3001/dashboard",
      width: 1440,
      height: 900,
      scrollY: 0,
      filename: "dashboard-1440.png",
      auth: true,
    });

    // 5. Dashboard (375px mobile)
    await takeScreenshot({
      url: "http://localhost:3001/dashboard",
      width: 375,
      height: 812,
      scrollY: 0,
      filename: "dashboard-375.png",
      auth: true,
    });

    // 6. Job Explorer (1440px, default Data & Analitik & skor)
    await takeScreenshot({
      url: "http://localhost:3001/jobs",
      width: 1440,
      height: 900,
      scrollY: 0,
      filename: "jobs-1440.png",
      auth: true,
    });

    // 7. Job Explorer (375px mobile)
    await takeScreenshot({
      url: "http://localhost:3001/jobs",
      width: 375,
      height: 812,
      scrollY: 0,
      filename: "jobs-375.png",
      auth: true,
    });

    cdp.close();
  } catch (err) {
    console.error("Screenshot error:", err);
  } finally {
    edge.kill();
  }
}

capture();

