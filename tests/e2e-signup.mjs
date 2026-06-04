// E2E slice 2 — inscrição do cliente na fila + visão do dono (self-contained).
// Cria o cenário (dono + time aprovado + oferta) via Admin SDK e dirige o navegador.
// Pré-requisito: dev server em :3100. Rodar: node --env-file=.env.local tests/e2e-signup.mjs
import { chromium } from "playwright";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = new URL("./screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const TS = Date.now();
const PWD = "test123456";
const CLIENT_EMAIL = `cliente-e2e+${TS}@tibiahub.test`;
const OWNER_EMAIL = `time-e2e+${TS}@tibiahub.test`;
const CHAR = "Ranny Zolnierz Elder"; // MS / Antica (real) — casa com a oferta

// ── Setup do cenário via Admin ───────────────────────────────────────────────
const app = getApps().length ? getApps()[0] : initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);
const owner = await getAuth(app).createUser({ email: OWNER_EMAIL, password: PWD, emailVerified: true });
await db.collection("users").doc(owner.uid).set({
  role: "team_owner", displayName: "Dono E2E", email: OWNER_EMAIL,
  contact: { whatsapp: "+5511900000000" }, createdAt: FieldValue.serverTimestamp(),
});
const slug = `team-e2e-${TS}`;
const teamRef = await db.collection("teams").add({
  slug, name: `E2E Team ${TS}`, ownerUid: owner.uid, worlds: ["Antica"],
  approved: true, supporterBadge: false, description: "Cenário E2E", createdAt: FieldValue.serverTimestamp(),
});
const offRef = await db.collection("offerings").add({
  teamId: teamRef.id, teamSlug: slug, quest: "soulwar", world: "Antica",
  vocationSlots: { EK: 2, ED: 2, MS: 2 }, kind: "service", status: "open", createdAt: FieldValue.serverTimestamp(),
});
const offeringId = offRef.id;
console.log(`Cenário: slug=${slug} offering=${offeringId} owner=${OWNER_EMAIL}`);

// ── E2E ──────────────────────────────────────────────────────────────────────
const results = [];
const rec = (id, name, ok, detail = "") => {
  results.push({ ok });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${name}${detail ? " — " + detail : ""}`);
};
const shot = (p, n) => p.screenshot({ path: `${SHOTS}${n}.png`, fullPage: true }).catch(() => {});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

try {
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Sou cliente/i }).click();
  await page.getByLabel("E-mail").fill(CLIENT_EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PWD);
  await page.getByLabel("Confirmar senha").fill(PWD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL(/\/me/, { timeout: 15000 });
  rec("S2.1", "Conta cliente criada", true);

  await page.goto(`${BASE}/g/${slug}/a/${offeringId}/signup`, { waitUntil: "networkidle" });
  rec("S2.2", "Wizard de inscrição carrega", (await page.getByText(/Qual é o seu personagem/i).count()) > 0);
  await page.getByLabel(/Nome do personagem/i).fill(CHAR);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(500);
  await page.getByLabel("WhatsApp").fill("+5511988887777");
  await page.getByRole("button", { name: /Entrar na fila/i }).click();
  const success = await page.waitForSelector("text=/Você está na fila/i", { timeout: 20000 }).then(() => true).catch(() => false);
  await shot(page, "S2-inscricao-sucesso");
  rec("S2.3", "Inscrição concluída ('Você está na fila!')", success);

  // duplicado barrado
  await page.goto(`${BASE}/g/${slug}/a/${offeringId}/signup`, { waitUntil: "networkidle" });
  await page.getByLabel(/Nome do personagem/i).fill(CHAR);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForTimeout(400);
  await page.getByLabel("WhatsApp").fill("+5511988887777");
  await page.getByRole("button", { name: /Entrar na fila/i }).click();
  const dup = await page.waitForSelector("text=/já está nesta fila/i", { timeout: 20000 }).then(() => true).catch(() => false);
  rec("S2.4", "Inscrição duplicada é barrada", dup);

  // dono vê na fila + move status
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(OWNER_EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PWD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForSelector(`text=${OWNER_EMAIL}`, { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.goto(`${BASE}/p/${slug}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, "S2-dashboard-fila");
  rec("S2.5", "Dono vê o personagem inscrito na fila", (await page.getByText(CHAR, { exact: false }).count()) > 0);

  const dropdown = page.getByLabel("Mover status").first();
  let moved = false;
  if ((await dropdown.count()) > 0) {
    await dropdown.selectOption("scheduled").catch(() => {});
    await page.waitForTimeout(1500);
    moved = (await page.getByText(/Agendado/i).count()) > 0;
  }
  rec("S2.6", "Dono move status para 'Agendado'", moved);
} catch (e) {
  rec("S2.x", "Fluxo slice 2", false, e.message);
  await shot(page, "S2-erro");
}

const real = consoleErrors.filter((e) => !/favicon|404 \(Not Found\)/i.test(e));
console.log("\nconsole errors:", real.length ? real.slice(0, 8).join(" | ") : "(nenhum)");
await browser.close();
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== ${results.length - fail} pass / ${fail} fail ===`);
process.exit(fail > 0 ? 1 : 0);
