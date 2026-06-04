// E2E Fase 2 — gate de Apoiador (doação TC) + confirmação admin + criação de time + aprovação.
// Pré-req: dev server :3100 com ADMIN_UIDS setado (via _setup-admin.mjs) e admin@tibiahub.test.
// node tests/e2e-phase2.mjs
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = new URL("./screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const TS = Date.now();
const PWD = "test123456";
const OWNER_EMAIL = `dono+${TS}@tibiahub.test`;
const ADMIN_EMAIL = "admin@tibiahub.test";
const TEAM = `Fase2 Team ${TS}`;

const results = [];
const rec = (id, name, ok, detail = "") => {
  results.push({ ok });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${name}${detail ? " — " + detail : ""}`);
};
const shot = (p, n) => p.screenshot({ path: `${SHOTS}${n}.png`, fullPage: true }).catch(() => {});

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errs = [];
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));

const login = async (email) => {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PWD);
  await page.locator("main").getByRole("button", { name: "Entrar" }).click();
  await page.waitForSelector(`text=${email}`, { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(1200);
};
const logout = async () => {
  await page.goto(`${BASE}/me`, { waitUntil: "networkidle" }).catch(() => {});
  await page.getByRole("button", { name: "Sair" }).click().catch(() => {});
  await page.waitForTimeout(1000);
};

try {
  // 1. cria conta "Tenho um time" → cai no gate de doação
  await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Tenho um time/i }).click();
  await page.getByLabel("E-mail").fill(OWNER_EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PWD);
  await page.getByLabel("Confirmar senha").fill(PWD);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL(/\/signup\/team/, { timeout: 15000 });
  await page.waitForTimeout(1500);
  const formAbsent = (await page.getByLabel("Nome do time").count()) === 0;
  const gateShown = (await page.getByText(/Apoiador|doa(ç|c)/i).count()) > 0;
  await shot(page, "P2-gate-onboarding");
  rec("P2.1", "Gate: não-apoiador NÃO vê o form de time", formAbsent && gateShown, `form=${!formAbsent} gate=${gateShown}`);

  // 2. declara doação
  await page.getByRole("button", { name: /fiz a doa/i }).first().click().catch(() => {});
  await page.waitForTimeout(2500);
  const pending = (await page.getByText(/an(á|a)lise|pendente|confirmar/i).count()) > 0;
  await shot(page, "P2-doacao-pendente");
  rec("P2.2", "Doação declarada → estado pendente", pending);

  // 3. admin confirma a doação
  await logout();
  await login(ADMIN_EMAIL);
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const adminLoaded = (await page.getByText(/doa(ç|c)|pendent|Admin/i).count()) > 0;
  await shot(page, "P2-admin");
  rec("P2.3", "Painel /admin acessível ao admin", adminLoaded);
  // confirma a doação EXATA do OWNER_EMAIL (aria-label inclui o email)
  const confirmBtn = page.getByRole("button", { name: `Confirmar doação de ${OWNER_EMAIL}` });
  let confirmed = false;
  if ((await confirmBtn.count()) > 0) {
    await confirmBtn.click();
    await page.waitForTimeout(2500);
    confirmed = (await confirmBtn.count()) === 0; // sumiu da lista = confirmado
  }
  rec("P2.4", "Admin confirma a doação do dono", confirmed);

  // 4. dono volta e agora cria o time
  await logout();
  await login(OWNER_EMAIL);
  await page.goto(`${BASE}/signup/team`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const formNow = (await page.getByLabel("Nome do time").count()) > 0;
  rec("P2.5", "Apoiador ativo → form de time liberado", formNow);
  if (formNow) {
    await page.getByLabel("Nome do time").fill(TEAM);
    await page.getByLabel(/Filtrar mundos/i).fill("Antica");
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: "Antica", exact: true }).first().click();
    await page.getByLabel(/Seu personagem principal/i).fill("Ranny Zolnierz Elder");
    await page.getByLabel("WhatsApp").fill("+5511955554444");
    await page.getByRole("button", { name: "Criar time" }).click();
    await page.waitForURL(/\/p\//, { timeout: 20000 });
    rec("P2.6", "Apoiador cria time → /p/[slug]", true, page.url());
  }
  const slug = page.url().split("/p/")[1]?.replace(/\/$/, "");

  // 5. admin aprova o time
  await logout();
  await login(ADMIN_EMAIL);
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const approveBtn = page.getByRole("button", { name: `Aprovar time ${TEAM}` });
  let approved = false;
  if ((await approveBtn.count()) > 0) {
    await approveBtn.click();
    await page.waitForTimeout(2500);
    approved = (await approveBtn.count()) === 0;
  }
  rec("P2.7", "Admin aprova o time", approved);

  // 6. time aprovado aparece publicamente
  if (slug) {
    const resp = await page.goto(`${BASE}/g/${slug}`, { waitUntil: "networkidle" });
    const live = resp?.status() === 200 && (await page.getByText(TEAM).count()) > 0;
    await shot(page, "P2-team-live");
    rec("P2.8", "Time aprovado fica público em /g/[slug]", live, `status=${resp?.status()}`);
  }
} catch (e) {
  rec("P2.x", "Fluxo Fase 2", false, e.message);
  await shot(page, "P2-erro");
}

const real = errs.filter((e) => !/favicon|404 \(Not Found\)/i.test(e));
console.log("\nconsole errors:", real.length ? real.slice(0, 8).join(" | ") : "(nenhum)");
await browser.close();
const fail = results.filter((r) => !r.ok).length;
console.log(`\n=== ${results.length - fail} pass / ${fail} fail ===`);
process.exit(fail > 0 ? 1 : 0);
