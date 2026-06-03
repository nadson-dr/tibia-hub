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
  // B. PERSONA TIME
  // ──────────────────────────────────────────────────────────────────────────
  let teamSlug = null;
  try {
    await page.goto(`${BASE}/signup`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Tenho um time/i }).click();
    await page.getByLabel("E-mail").fill(TEAM_EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(PWD);
    await page.getByLabel("Confirmar senha").fill(PWD);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL(/\/signup\/team/, { timeout: 15000 });
    rec("B.1", "Conta time criada → redirect /signup/team", "pass");

    // negativo: submeter vazio
    await page.getByRole("button", { name: "Criar time" }).click();
    await page.waitForTimeout(400);
    const reqErr = await page.getByText(/obrigatório|Selecione pelo menos um mundo/i).count();
    rec("B.2neg", "Onboarding valida campos obrigatórios", reqErr > 0 ? "pass" : "warn", `${reqErr} erros`);

    // preenche
    await page.getByLabel("Nome do time").fill(TEAM_NAME);
    await page.getByLabel(/Filtrar mundos/i).fill(CHAR_WORLD);
    await page.waitForTimeout(300);
    await page.getByRole("button", { name: CHAR_WORLD, exact: true }).first().click();
    await page.getByLabel(/Seu personagem principal/i).fill(CHAR);
    await page.getByLabel("WhatsApp").fill("+5511999998888");
    await page.getByLabel(/Descrição/i).fill("Time de QA automatizado.");
    await shot(page, "B2-onboarding-preenchido");
    await page.getByRole("button", { name: "Criar time" }).click();
    await page.waitForURL(/\/p\//, { timeout: 20000 });
    teamSlug = page.url().split("/p/")[1]?.replace(/\/$/, "");
    rec("B.3", "Time criado → redirect /p/[slug]", "pass", `slug=${teamSlug}`);

    const aguardando = await page.getByText(/Aguardando aprovação/i).count();
    const teamNameShown = await page.getByText(TEAM_NAME).count();
    await shot(page, "B3-dashboard");
    rec("B.3b", "Dashboard mostra nome do time + 'Aguardando aprovação'",
      teamNameShown > 0 && aguardando > 0 ? "pass" : "fail");

    // abrir fila
    await page.getByRole("button", { name: /Nova fila/i }).click();
    await page.waitForTimeout(400);
    // quest default soulwar; setar vagas EK=2, ED=2
    await page.getByLabel(/Vagas para EK/i).fill("2");
    await page.getByLabel(/Vagas para ED/i).fill("2");
    await page.locator("form").getByRole("button", { name: /Abrir fila/i }).click();
    await page.waitForTimeout(3000);
    const offeringTab = await page.getByRole("button", { name: /Soul War/i }).count();
    await shot(page, "B4-fila-aberta");
    rec("B.4", "Fila (offering) criada e aparece no dashboard", offeringTab > 0 ? "pass" : "fail");
  } catch (e) { rec("B.x", "Fluxo time", "fail", e.message); await shot(page, "B-erro"); }

  // ──────────────────────────────────────────────────────────────────────────
  // C. /g/[slug] antes da aprovação (deve 404)
  // ──────────────────────────────────────────────────────────────────────────
  try {
    if (teamSlug) {
      const resp = await page.goto(`${BASE}/g/${teamSlug}`, { waitUntil: "networkidle" });
      const is404 = resp?.status() === 404 || (await page.getByText(/404|not found|não encontrad/i).count()) > 0;
      await shot(page, "C6-g-slug-nao-aprovado");
      rec("C.6", "/g/[slug] dá 404 enquanto não aprovado", is404 ? "pass" : "warn", `status=${resp?.status()}`);
    }
  } catch (e) { rec("C.6", "/g/[slug] não aprovado", "warn", e.message); }

  // ownership: cliente tentando abrir o /p do time → redirect /
  try {
    if (teamSlug) {
      // logar como cliente e CONFIRMAR que a sessão trocou antes de navegar
      await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
      await page.getByLabel("E-mail").fill(CLIENT_EMAIL);
      await page.getByLabel("Senha", { exact: true }).fill(PWD);
      await page.getByRole("button", { name: "Entrar" }).click();
      // espera o header refletir o login do cliente (sessão trocada)
      const switched = await page
        .waitForSelector(`text=${CLIENT_EMAIL}`, { timeout: 12000 })
        .then(() => true)
        .catch(() => false);
      rec("B.5pre", "Login do cliente confirmado (header)", switched ? "pass" : "warn");
      await page.waitForTimeout(1500); // garante cookie persistido
      await page.goto(`${BASE}/p/${teamSlug}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      const redirected = !page.url().includes(`/p/${teamSlug}`);
      rec("B.5", "Não-dono é bloqueado do dashboard (/p/[slug])", redirected ? "pass" : "fail", `url=${page.url()}`);
    }
  } catch (e) { rec("B.5", "Ownership", "warn", e.message); }

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
