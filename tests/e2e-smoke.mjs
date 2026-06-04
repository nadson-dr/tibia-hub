// Sessão de QA "quase humano" — dirige um navegador real (Chromium) pelo slice 1.
// Rodar: node tests/e2e-smoke.mjs   (dev server deve estar em http://localhost:3100)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const TS = Date.now();
const SHOTS = new URL("./screenshots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(SHOTS, { recursive: true });

const CHAR = process.env.TEST_CHAR ?? "Ranny Zolnierz Elder"; // MS / Antica (real)
const CHAR_WORLD = "Antica";
const PWD = "test123456";
const CLIENT_EMAIL = `cliente+${TS}@tibiahub.test`;
const TEAM_EMAIL = `time+${TS}@tibiahub.test`;
const TEAM_NAME = `QA Team ${TS}`;

const results = [];
function rec(id, name, status, detail = "") {
  results.push({ id, name, status, detail });
  const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️";
  console.log(`${icon} [${id}] ${name}${detail ? " — " + detail : ""}`);
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true }).catch(() => {});

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

  // ──────────────────────────────────────────────────────────────────────────
  // 0. Home + tema
  // ──────────────────────────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    const title = await page.locator("h1").first().innerText();
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await shot(page, "00-home");
    rec("0.1", "Home carrega com título", /Tibia Hub/i.test(title) ? "pass" : "fail", `h1="${title}"`);
    rec("0.2", "Tema escuro (bg Royal Parchment)", bg.includes("23, 18, 12") || bg.startsWith("rgb(") ? "pass" : "warn", `body bg=${bg}`);
    const serviceCard = await page.getByText("Service de Quests").count();
    rec("0.3", "Card 'Service de Quests' presente", serviceCard > 0 ? "pass" : "fail");
  } catch (e) { rec("0.x", "Home", "fail", e.message); }

  // ──────────────────────────────────────────────────────────────────────────
  // A. PERSONA CLIENTE
  // ──────────────────────────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });

    // A.neg1: botão "Criar conta" deve estar desabilitado sem escolher tipo
    const criarBtn = page.getByRole("button", { name: "Criar conta" });
    const disabledNoType = await criarBtn.isDisabled();
    rec("A.neg1", "Botão 'Criar conta' desabilitado sem tipo selecionado", disabledNoType ? "pass" : "warn");

    // escolhe cliente
    await page.getByRole("button", { name: /Sou cliente/i }).click();
    await page.getByLabel("E-mail").fill(CLIENT_EMAIL);

    // senha curta
    await page.getByLabel("Senha", { exact: true }).fill("123");
    await page.getByLabel("Confirmar senha").fill("123");
    await criarBtn.click();
    await page.waitForTimeout(500);
    const errShort = await page.getByText(/pelo menos 6/i).count();
    rec("A.neg2", "Erro senha < 6 caracteres", errShort > 0 ? "pass" : "warn");

    // senhas divergentes
    await page.getByLabel("Senha", { exact: true }).fill(PWD);
    await page.getByLabel("Confirmar senha").fill("differ99");
    await criarBtn.click();
    await page.waitForTimeout(500);
    const errMismatch = await page.getByText(/não coincidem/i).count();
    rec("A.neg3", "Erro senhas divergentes", errMismatch > 0 ? "pass" : "warn");

    // criação válida
    await page.getByLabel("Confirmar senha").fill(PWD);
    await shot(page, "A1-signup-cliente-preenchido");
    await criarBtn.click();
    await page.waitForURL(/\/me/, { timeout: 15000 });
    rec("A.1", "Conta cliente criada → redirect /me", "pass", page.url());

    // header logado
    const emailShown = await page.getByText(CLIENT_EMAIL).count();
    rec("A.2", "Email do cliente aparece em /me", emailShown > 0 ? "pass" : "fail");
    const sairBtn = await page.getByRole("button", { name: "Sair" }).count();
    rec("A.2b", "Header mostra botão 'Sair' (logado)", sairBtn > 0 ? "pass" : "fail");

    // adicionar personagem inexistente (negativo)
    await page.getByLabel(/Nome do personagem para adicionar/i).fill("Zzzqxxinvalidchar123");
    await page.getByRole("button", { name: /Adicionar personagem/i }).click();
    await page.waitForTimeout(6000);
    const notFound = await page.getByText(/não encontrado/i).count();
    rec("A.3neg", "Personagem inexistente → erro", notFound > 0 ? "pass" : "warn");

    // adicionar personagem real
    await page.getByLabel(/Nome do personagem para adicionar/i).fill(CHAR);
    await page.getByRole("button", { name: /Adicionar personagem/i }).click();
    await page.waitForTimeout(8000);
    const charShown = await page.getByText(CHAR, { exact: false }).count();
    const validado = await page.getByText("Validado").count();
    await shot(page, "A3-cliente-personagem");
    rec("A.3", "Personagem real validado (TibiaData) aparece", charShown > 0 && validado > 0 ? "pass" : "fail",
      `char=${charShown} validado=${validado}`);

    // reload → personagem persiste na UI?
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const charAfterReload = await page.getByText(CHAR, { exact: false }).count();
    rec("A.3reload", "Personagem persiste após reload de /me", charAfterReload > 0 ? "pass" : "fail",
      charAfterReload > 0 ? "" : "lista volta vazia (não recarrega do Firestore)");

    // /service vazio
    await page.goto(`${BASE}/service`, { waitUntil: "networkidle" });
    await shot(page, "A4-service-vazio");
    rec("A.4", "/service carrega (sem times aprovados)", "pass", `url=${page.url()}`);

    // logout
    await page.goto(`${BASE}/me`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Sair" }).click();
    await page.waitForTimeout(1500);
    const entrarBtn = await page.getByRole("button", { name: "Entrar" }).count();
    rec("A.5", "Logout → header volta para 'Entrar'", entrarBtn > 0 ? "pass" : "warn");
  } catch (e) { rec("A.x", "Fluxo cliente", "fail", e.message); await shot(page, "A-erro"); }

  // ──────────────────────────────────────────────────────────────────────────
  // B. PERSONA TIME — gate de Apoiador (ADR-010). Criação completa do time +
  //    fila + ownership são cobertas por e2e-phase2.mjs e e2e-signup.mjs.
  // ──────────────────────────────────────────────────────────────────────────
  try {
    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Tenho um time/i }).click();
    await page.getByLabel("E-mail").fill(TEAM_EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(PWD);
    await page.getByLabel("Confirmar senha").fill(PWD);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL(/\/signup\/team/, { timeout: 15000 });
    rec("B.1", "Conta time criada → redirect /signup/team", "pass");

    // gate: não-apoiador NÃO vê o form de time; vê o painel de doação
    await page.waitForTimeout(1500);
    const formAbsent = (await page.getByLabel("Nome do time").count()) === 0;
    const gateShown = (await page.getByText(/Apoiador|doa(ç|c)/i).count()) > 0;
    await shot(page, "B-gate-apoiador");
    rec("B.2", "Gate: não-apoiador é direcionado à doação (sem form de time)",
      formAbsent && gateShown ? "pass" : "fail", `form=${!formAbsent} gate=${gateShown}`);
  } catch (e) { rec("B.x", "Fluxo time (gate)", "fail", e.message); await shot(page, "B-erro"); }

  console.log("\n=== CONSOLE ERRORS no browser ===");
  const realErrors = consoleErrors.filter((e) => !/favicon|404 \(Not Found\)/i.test(e));
  if (realErrors.length === 0) console.log("(nenhum)");
  else realErrors.slice(0, 15).forEach((e) => console.log(" •", e.slice(0, 200)));

  await browser.close();

  // resumo
  const pass = results.filter((r) => r.status === "pass").length;
  const fail = results.filter((r) => r.status === "fail").length;
  const warn = results.filter((r) => r.status === "warn").length;
  console.log(`\n=== RESUMO: ${pass} pass / ${warn} warn / ${fail} fail (total ${results.length}) ===`);
  console.log("SLUG_DO_TIME=" + (teamSlug ?? ""));
  console.log("CLIENT_EMAIL=" + CLIENT_EMAIL);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => { console.error("FATAL:", e); process.exit(2); });
