/**
 * @name AllBadges
 * @description Exibe qualquer badge do Discord no seu perfil (incluindo Nitro, experimental). 100% client-side — só você vê.
 * @version 2.0.0
 * @author ykauttiz
 * @website https://github.com/ykauttiz/allbadges
 * @source https://raw.githubusercontent.com/ykauttiz/allbadges/main/allbadges.plugin.js
 * @updateUrl https://raw.githubusercontent.com/ykauttiz/allbadges/main/allbadges.plugin.js
 */

// ══════════════════════════════════════════════════════════════════════════════
// Catálogo de badges baseado no bitfield UserFlags oficial da Discord
// (discord-api-types v10 · discord.com/developers/docs/resources/user)
// Catálogo revisado em 28/06/2026 — ver README.md → "Pesquisa: por que as
// badges não apareciam" para as fontes de cada status.
//
// Propositalmente NÃO incluímos flags puramente internas/de moderação
// (Spammer, Quarantined, BotHTTPInteractions, MFASMS, PremiumPromoDismissed,
// DisablePremium, HasUnreadUrgentMessages, Collaborator, RestrictedCollaborator,
// TeamPseudoUser): elas não desenham nenhuma badge na interface da Discord, e
// algumas (Spammer/Quarantined) podem até disparar avisos indesejados no seu
// próprio cliente. "flags = -1" (técnica usada por outros plugins antigos)
// liga essas flags às cegas — este plugin nunca faz isso.
// ══════════════════════════════════════════════════════════════════════════════

const TIERS = {
    MITICO:        { label: "Mítico",        color: "#FF73FA" },
    RARO:          { label: "Raro",          color: "#3BA55D" },
    LEGADO:        { label: "Legado",        color: "#99AAB5" },
    DESCONTINUADO: { label: "Descontinuado", color: "#ED4245" },
};

const TIER_ORDER = ["MITICO", "RARO", "LEGADO", "DESCONTINUADO"];

const BADGES = {
    STAFF: {
        bit: 1 << 0, // 1
        label: "Discord Staff",
        desc: "Funcionário(a) ativo(a) da Discord Inc.",
        emoji: "🛡️",
        tier: "MITICO",
    },
    PARTNER: {
        bit: 1 << 1, // 2
        label: "Discord Partner",
        desc: 'Dono(a) de servidor parceiro. Programa em estado "zumbi" desde out/2023 — sem novas concessões.',
        emoji: "🤝",
        tier: "LEGADO",
    },
    HYPESQUAD_EVENTS: {
        bit: 1 << 2, // 4
        label: "HypeSquad Events",
        desc: "Representante em eventos presenciais da HypeSquad. Programa encerrado em 01/09/2023.",
        emoji: "🏆",
        tier: "LEGADO",
    },
    BUG_HUNTER_1: {
        bit: 1 << 3, // 8
        label: "Bug Hunter Nível 1",
        desc: "Comunidade de testers da Discord. Inscrições raramente reabertas desde 2022.",
        emoji: "🐛",
        tier: "RARO",
    },
    HOUSE_BRAVERY: {
        bit: 1 << 6, // 64
        label: "HypeSquad: Bravery",
        desc: "Casa da Bravura. O quiz de seleção foi removido dos clientes desktop/web em set/2025.",
        emoji: "🦁",
        tier: "LEGADO",
    },
    HOUSE_BRILLIANCE: {
        bit: 1 << 7, // 128
        label: "HypeSquad: Brilliance",
        desc: "Casa da Brilhância. O quiz de seleção foi removido dos clientes desktop/web em set/2025.",
        emoji: "💎",
        tier: "LEGADO",
    },
    HOUSE_BALANCE: {
        bit: 1 << 8, // 256
        label: "HypeSquad: Balance",
        desc: "Casa do Equilíbrio. O quiz de seleção foi removido dos clientes desktop/web em set/2025.",
        emoji: "⚖️",
        tier: "LEGADO",
    },
    EARLY_SUPPORTER: {
        bit: 1 << 9, // 512
        label: "Early Supporter",
        desc: "Concedida uma única vez a quem teve Nitro antes de 10/10/2018. Impossível de repetir.",
        emoji: "🌟",
        tier: "LEGADO",
    },
    BUG_HUNTER_2: {
        bit: 1 << 14, // 16384
        label: "Bug Hunter Nível 2 (Dourado)",
        desc: "Topo do programa de testers da Discord.",
        emoji: "🦗",
        tier: "RARO",
    },
    VERIFIED_DEVELOPER: {
        bit: 1 << 17, // 131072
        label: "Early Verified Bot Developer",
        desc: "Verificação antiga de bots, renomeada após a mudança de critérios em ago/2020.",
        emoji: "🤖",
        tier: "LEGADO",
    },
    MOD_ALUMNI: {
        bit: 1 << 18, // 262144
        label: "Moderator Program Alumni",
        desc: 'Ex-"Certified Moderator". O programa Moderator Academy foi encerrado em 2023.',
        emoji: "🔨",
        tier: "LEGADO",
    },
    ACTIVE_DEVELOPER: {
        bit: 1 << 22, // 4194304
        label: "Active Developer",
        desc: "⚠️ A Discord deletou por completo o código que desenha essa badge em 05/12/2025. Mesmo com a flag ativa, ela NÃO vai aparecer em nenhum cliente — mantida aqui apenas por referência histórica.",
        emoji: "💻",
        tier: "DESCONTINUADO",
    },
};

// Nitro nunca fez parte do bitfield UserFlags — é controlado por um campo
// separado (premiumType). Por isso vive numa seção própria ("Extras"),
// marcada como experimental.
const PREMIUM_TIERS = {
    1: "Nitro Classic",
    2: "Nitro",
    3: "Nitro Basic",
};

// Badges reais da Discord que ESTE plugin não tenta falsificar, e o motivo
// técnico de cada uma. Ver README.md para a pesquisa completa com fontes.
const UNSUPPORTED = [
    {
        label: "Server Booster",
        reason: "Calculada por servidor (cada boost tem sua própria data), não por uma flag global da conta — falsificar com segurança exigiria simular dados por servidor.",
    },
    {
        label: "Discord Quests",
        reason: "Depende de um registro interno de quests concluídas, não de uma flag pública do usuário.",
    },
    {
        label: "Orbs",
        reason: "Depende de um registro de compra feito na loja de cosméticos da Discord.",
    },
    {
        label: '"Originally Known As" (nome legado)',
        reason: "Não faz parte do bitfield UserFlags; usa um campo interno que a Discord nunca documentou publicamente.",
    },
    {
        label: "Last Meadow Online (abr/2026)",
        reason: "Badge de evento sazonal. O mecanismo de concessão foi desativado em 08/04/2026 e nunca foi documentado.",
    },
    {
        label: "Lootbox / Palhaço",
        reason: "Excluída por completo do código da Discord em 08/04/2024 — impossível de exibir em qualquer cliente, modificado ou não.",
    },
];

// ══════════════════════════════════════════════════════════════════════════════
// CSS do painel de configurações
// ══════════════════════════════════════════════════════════════════════════════
const PANEL_CSS = `
.ab-root { padding: 20px; color: var(--header-primary); font-family: var(--font-primary); }
.ab-header { margin-bottom: 16px; }
.ab-title { font-size: 20px; font-weight: 700; margin: 0 0 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ab-version-chip { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; background: var(--brand-experiment, #5865F2); color: #fff; }
.ab-subtitle { font-size: 13px; color: var(--header-secondary); margin: 0; line-height: 1.5; }
.ab-disclaimer { font-size: 12px; color: var(--text-warning, #f0b232); margin-top: 6px; }
.ab-divider { height: 1px; background: var(--background-modifier-accent); margin: 16px 0; }
.ab-statsbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.ab-counter { font-size: 13px; font-weight: 600; padding: 6px 12px; border-radius: 8px; background: var(--background-secondary); white-space: nowrap; }
.ab-search { flex: 1; min-width: 160px; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--background-modifier-accent); background: var(--background-secondary); color: var(--text-normal); font-size: 13px; }
.ab-search:focus { outline: none; border-color: var(--brand-experiment, #5865F2); }
.ab-btn { padding: 7px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 600; color: #fff; transition: filter .15s, transform .1s; }
.ab-btn:hover { filter: brightness(.88); }
.ab-btn:active { transform: scale(.97); }
.ab-tierbar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; }
.ab-tier-chip { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; border: 2px solid transparent; background: var(--background-secondary); color: var(--header-secondary); transition: all .15s; user-select: none; }
.ab-tier-chip.active { color: #fff; }
.ab-section-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--header-secondary); margin: 18px 0 10px; }
.ab-section-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.ab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(255px, 1fr)); gap: 10px; }
.ab-card { display: flex; align-items: flex-start; gap: 10px; padding: 11px 14px; background: var(--background-secondary); border: 2px solid transparent; border-radius: 10px; cursor: pointer; transition: border-color .15s, background .15s; user-select: none; }
.ab-card:hover { background: var(--background-secondary-alt); }
.ab-card.active { border-color: var(--tier-color); }
.ab-card input[type="checkbox"] { width: 17px; height: 17px; margin-top: 2px; cursor: pointer; accent-color: var(--tier-color); flex-shrink: 0; }
.ab-card-title { font-size: 13.5px; font-weight: 600; color: var(--header-primary); display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.ab-card-desc { font-size: 11px; color: var(--header-secondary); margin-top: 3px; line-height: 1.45; }
.ab-tier-tag { font-size: 9.5px; font-weight: 700; padding: 1px 6px; border-radius: 4px; color: #fff; text-transform: uppercase; letter-spacing: .02em; }
.ab-extras-card { align-items: center; }
.ab-select { margin-top: 6px; padding: 5px 8px; border-radius: 6px; border: 1px solid var(--background-modifier-accent); background: var(--background-primary); color: var(--text-normal); font-size: 12px; }
.ab-locked-grid { display: grid; gap: 8px; }
.ab-locked-card { display: flex; gap: 10px; padding: 10px 14px; background: var(--background-secondary); border-radius: 8px; opacity: .8; }
.ab-locked-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }
.ab-locked-title { font-size: 13px; font-weight: 600; color: var(--header-secondary); }
.ab-locked-reason { font-size: 11px; color: var(--text-muted); margin-top: 2px; line-height: 1.45; }
.ab-footer { margin-top: 22px; padding-top: 14px; border-top: 1px solid var(--background-modifier-accent); font-size: 11.5px; color: var(--header-muted); line-height: 1.6; }
`;

// ══════════════════════════════════════════════════════════════════════════════
// Plugin principal
// ══════════════════════════════════════════════════════════════════════════════
module.exports = class AllBadges {
    constructor(meta) {
        this.meta = meta ?? { name: "AllBadges", version: "2.0.0", author: "ykauttiz" };
        this.api = new BdApi("AllBadges");
        this._started = false;
        this._userStoreRef = null;
        this._activeTierFilter = "ALL";
        this.settings = this._defaultSettings();
    }

    // ── Getters de metadados (compatibilidade BD legada) ─────────────────────
    getName()        { return "All Badges"; }
    getShortName()   { return "AllBadges"; }
    getVersion()     { return "2.0.0"; }
    getDescription() { return "Exibe qualquer badge do Discord no seu perfil. 100% client-side."; }
    getAuthor()      { return "ykauttiz"; }

    // ── Configurações padrão e migração ──────────────────────────────────────
    _defaultSettings() {
        return {
            flags: Object.fromEntries(Object.keys(BADGES).map(k => [k, false])),
            premium: { enabled: false, tier: 2, since: null },
        };
    }

    _loadSettings() {
        const raw = this.api.Data.load("settings");
        const defaults = this._defaultSettings();
        if (!raw) return defaults;

        // A v1.0.0 salvava um mapa simples {CHAVE_DA_BADGE: boolean}.
        // Detecta esse formato antigo e migra automaticamente, sem perder
        // as escolhas que você já tinha feito.
        const isLegacyFlatMap = !raw.flags && !raw.premium;
        if (isLegacyFlatMap) {
            return {
                flags: { ...defaults.flags, ...raw },
                premium: defaults.premium,
            };
        }

        return {
            flags: { ...defaults.flags, ...(raw.flags || {}) },
            premium: { ...defaults.premium, ...(raw.premium || {}) },
        };
    }

    // ── Ciclo de vida ────────────────────────────────────────────────────────
    start() {
        if (this._started) this.stop();
        this._started = true;
        this.settings = this._loadSettings();

        BdApi.DOM.addStyle("AllBadges", PANEL_CSS);
        this._initStore();
    }

    async _initStore() {
        try {
            let UserStore = this._findUserStore();

            if (!UserStore) {
                // Logo após abrir/recarregar a Discord, alguns módulos do
                // Webpack ainda não foram registrados no cache no instante
                // exato em que o plugin inicia. Em vez de falhar direto,
                // aguardamos o módulo aparecer.
                this.api.Logger.warn("UserStore não encontrado de imediato — aguardando a Discord carregar...");
                UserStore = await BdApi.Webpack.waitForModule(
                    BdApi.Webpack.Filters.byProps("getCurrentUser", "getUser"),
                    { defaultExport: true, timeout: 20000 }
                ).catch(() => null);
            }

            if (!UserStore) {
                this.api.Logger.error(
                    "Não foi possível localizar o UserStore.",
                    "A Discord pode ter mudado a estrutura interna — verifique se há uma atualização do plugin."
                );
                BdApi.UI.showToast("❌ AllBadges: UserStore não encontrado. Veja o console.", { type: "error" });
                return;
            }

            this._patchStore(UserStore);
            BdApi.UI.showToast("✅ AllBadges iniciado!", { type: "success" });
        } catch (err) {
            this.api.Logger.error("Falha ao iniciar:", err);
            BdApi.UI.showToast("❌ AllBadges: erro ao iniciar. Veja o console.", { type: "error" });
        }
    }

    stop() {
        if (!this._started) return;
        this._started = false;
        this.api.Patcher.unpatchAll();
        BdApi.DOM.removeStyle("AllBadges");
        this._userStoreRef = null;
        BdApi.UI.showToast("🛑 AllBadges desativado.", { type: "info" });
    }

    // ── Localização robusta do UserStore ────────────────────────────────────
    // Três estratégias, da mais específica para a mais genérica. Se a
    // Discord renomear/mover o módulo, a busca por assinatura (3ª opção)
    // ainda funciona, pois não depende do nome interno "UserStore".
    _findUserStore() {
        return (
            BdApi.Webpack.getStore?.("UserStore") ??
            BdApi.Webpack.Stores?.UserStore ??
            BdApi.Webpack.getModule(BdApi.Webpack.Filters.byProps("getCurrentUser", "getUser")) ??
            null
        );
    }

    // ── Lógica de patch ──────────────────────────────────────────────────────
    _computeFlagsExtra() {
        return Object.entries(BADGES)
            .filter(([k]) => !!this.settings.flags[k])
            .reduce((acc, [, b]) => acc | b.bit, 0);
    }

    _applyOverrides(user) {
        if (!user) return user;

        const flagsExtra = this._computeFlagsExtra();
        const premium = this.settings.premium;
        const overrides = {};
        let touched = false;

        if (flagsExtra) {
            const merged = (user.flags ?? user.public_flags ?? user.publicFlags ?? 0) | flagsExtra;
            // O nome exato da propriedade lida pelo componente de badges já
            // mudou entre versões do cliente (flags / public_flags /
            // publicFlags). Definir os três é inofensivo e cobre qualquer
            // um dos casos.
            overrides.flags = merged;
            overrides.public_flags = merged;
            overrides.publicFlags = merged;
            touched = true;
        }

        if (premium?.enabled) {
            // Nitro nunca foi uma flag — é o campo premiumType. Mantido
            // como recurso experimental (ver README).
            overrides.premiumType = premium.tier;
            overrides.premium_type = premium.tier;
            if (premium.since) {
                overrides.premiumSince = premium.since;
                overrides.premium_since = premium.since;
            }
            touched = true;
        }

        if (!touched) return user;
        return this._mergeUser(user, overrides);
    }

    _mergeUser(user, overrides) {
        try {
            // Caminho rápido: a grande maioria das builds da Discord permite
            // mutar o objeto User normalmente.
            Object.assign(user, overrides);
            return user;
        } catch (err) {
            // Fallback para o caso raro de o objeto vir congelado
            // (Object.freeze). Clonamos preservando o prototype para que
            // getters como `.tag` continuem funcionando.
            try {
                const clone = Object.create(Object.getPrototypeOf(user));
                Object.assign(clone, user, overrides);
                return clone;
            } catch (err2) {
                this.api.Logger.error("Não foi possível aplicar as badges nesse objeto de usuário:", err2);
                return user;
            }
        }
    }

    _patchStore(UserStore) {
        this._userStoreRef = UserStore;

        this.api.Patcher.after(UserStore, "getCurrentUser", (_, _args, user) => this._applyOverrides(user));

        // Vários pontos da interface (popout ao clicar no seu próprio avatar
        // na lista de membros, mini-perfil em DMs, painel inferior etc.)
        // chamam getUser(id) em vez de getCurrentUser(). Replicamos o patch
        // aqui, mas SEMPRE restrito ao seu próprio ID — este plugin nunca
        // deve alterar como o perfil de outras pessoas aparece para você.
        if (typeof UserStore.getUser === "function") {
            this.api.Patcher.after(UserStore, "getUser", (_, _args, user) => {
                if (!user) return user;
                const myId = UserStore.getCurrentUser?.()?.id;
                if (!myId || user.id !== myId) return user;
                return this._applyOverrides(user);
            });
        }

        this.api.Logger.info(
            "Patch aplicado. Flags extra:", this._computeFlagsExtra(),
            "| Nitro experimental:", this.settings.premium
        );
    }

    _refreshPatch() {
        this.api.Patcher.unpatchAll();
        if (this._userStoreRef) this._patchStore(this._userStoreRef);
        this._forceRerender();
    }

    _forceRerender() {
        // Melhor esforço: se o UserStore expuser emitChange(), avisamos
        // qualquer popout já montado para se atualizar sem precisar ser
        // reaberto. Se essa função não existir nessa versão da Discord, sem
        // problema — basta fechar e reabrir o seu próprio perfil.
        try {
            this._userStoreRef?.emitChange?.();
        } catch {
            /* melhor esforço apenas */
        }
    }

    // ── Persistência ─────────────────────────────────────────────────────────
    _save() {
        this.api.Data.save("settings", this.settings);
        this._refreshPatch();
    }

    // ══════════════════════════════════════════════════════════════════════
    // Painel de configurações
    // ══════════════════════════════════════════════════════════════════════
    getSettingsPanel() {
        const root = document.createElement("div");
        root.className = "ab-root";

        root.insertAdjacentHTML("beforeend", `
            <div class="ab-header">
                <h2 class="ab-title">🏅 AllBadges <span class="ab-version-chip">v2.0.0</span></h2>
                <p class="ab-subtitle">
                    Ative as badges que deseja ver no seu próprio perfil. Catálogo revisado em 28/06/2026.
                </p>
                <p class="ab-disclaimer">
                    ⚠️ 100% client-side — só você vê essas badges, e usar a Discord modificada (BetterDiscord)
                    pode violar os Termos de Serviço da Discord.
                </p>
            </div>
            <div class="ab-divider"></div>
        `);

        // ─── Barra de estatísticas + busca + ações em massa ───────────────
        const statsBar = document.createElement("div");
        statsBar.className = "ab-statsbar";

        const counter = document.createElement("span");
        counter.className = "ab-counter";

        const search = document.createElement("input");
        search.type = "text";
        search.placeholder = "🔎 Buscar badge por nome ou descrição...";
        search.className = "ab-search";

        const selectAllBtn = this._btn("✅ Selecionar visíveis", "#5865F2", () => this._bulkToggle(true, root));
        const clearAllBtn = this._btn("❌ Limpar visíveis", "#ED4245", () => this._bulkToggle(false, root));

        statsBar.append(counter, search, selectAllBtn, clearAllBtn);
        root.appendChild(statsBar);

        // ─── Barra de filtro por raridade ──────────────────────────────────
        const tierBar = document.createElement("div");
        tierBar.className = "ab-tierbar";
        const allChip = this._tierChip("Todas as raridades", "ALL", "#5865F2");
        tierBar.appendChild(allChip);
        for (const tierKey of TIER_ORDER) {
            tierBar.appendChild(this._tierChip(TIERS[tierKey].label, tierKey, TIERS[tierKey].color));
        }
        root.appendChild(tierBar);

        const setActiveTier = (tierKey) => {
            this._activeTierFilter = tierKey;
            tierBar.querySelectorAll("[data-tier-filter]").forEach(chip => {
                const isActive = chip.dataset.tierFilter === tierKey;
                chip.classList.toggle("active", isActive);
                chip.style.background = isActive ? chip.dataset.color : "";
                chip.style.borderColor = isActive ? chip.dataset.color : "transparent";
            });
            this._applyFilters(root, search.value);
        };
        tierBar.querySelectorAll("[data-tier-filter]").forEach(chip => {
            chip.addEventListener("click", () => setActiveTier(chip.dataset.tierFilter));
        });
        setActiveTier("ALL");

        search.addEventListener("input", () => this._applyFilters(root, search.value));

        // ─── Seções por raridade ────────────────────────────────────────────
        for (const tierKey of TIER_ORDER) {
            const tier = TIERS[tierKey];
            const entries = Object.entries(BADGES).filter(([, b]) => b.tier === tierKey);
            if (!entries.length) continue;

            const title = document.createElement("div");
            title.className = "ab-section-title";
            title.innerHTML = `<span class="ab-section-dot" style="background:${tier.color}"></span> ${tier.label} (${entries.length})`;
            root.appendChild(title);

            const grid = document.createElement("div");
            grid.className = "ab-grid";
            for (const [key, badge] of entries) {
                grid.appendChild(this._createFlagCard(key, badge));
            }
            root.appendChild(grid);
        }

        // ─── Extras (fora do bitfield de flags) ────────────────────────────
        const extrasTitle = document.createElement("div");
        extrasTitle.className = "ab-section-title";
        extrasTitle.innerHTML = `<span class="ab-section-dot" style="background:#F47B67"></span> Extras (não são flags) (1)`;
        root.appendChild(extrasTitle);

        const extrasGrid = document.createElement("div");
        extrasGrid.className = "ab-grid";
        extrasGrid.appendChild(this._createPremiumCard());
        root.appendChild(extrasGrid);

        // ─── Não suportado ──────────────────────────────────────────────────
        const lockedTitle = document.createElement("div");
        lockedTitle.className = "ab-section-title";
        lockedTitle.innerHTML = `<span class="ab-section-dot" style="background:var(--header-muted)"></span> Badges que este plugin NÃO falsifica (${UNSUPPORTED.length})`;
        root.appendChild(lockedTitle);

        const lockedGrid = document.createElement("div");
        lockedGrid.className = "ab-locked-grid";
        for (const item of UNSUPPORTED) {
            const card = document.createElement("div");
            card.className = "ab-locked-card";
            card.innerHTML = `
                <span class="ab-locked-icon">🔒</span>
                <div>
                    <div class="ab-locked-title">${item.label}</div>
                    <div class="ab-locked-reason">${item.reason}</div>
                </div>
            `;
            lockedGrid.appendChild(card);
        }
        root.appendChild(lockedGrid);

        // ─── Rodapé ──────────────────────────────────────────────────────────
        root.insertAdjacentHTML("beforeend", `
            <div class="ab-footer">
                🔧 Plugin por <strong>ykauttiz</strong> · As badges são visuais e visíveis apenas para você.<br>
                Usar BetterDiscord pode violar os Termos de Serviço da Discord. Use por conta e risco.<br>
                Veja o CHANGELOG.md do projeto para o histórico completo de mudanças desta versão.
            </div>
        `);

        this._updateCounter(root);
        return root;
    }

    // ── Componentes do painel ───────────────────────────────────────────────
    _tierChip(label, tierKey, color) {
        const chip = document.createElement("div");
        chip.className = "ab-tier-chip";
        chip.textContent = label;
        chip.dataset.tierFilter = tierKey;
        chip.dataset.color = color;
        return chip;
    }

    _createFlagCard(key, badge) {
        const isOn = !!this.settings.flags[key];
        const tier = TIERS[badge.tier];

        const card = document.createElement("div");
        card.className = `ab-card${isOn ? " active" : ""}`;
        card.dataset.key = key;
        card.dataset.tier = badge.tier;
        card.dataset.search = (badge.label + " " + badge.desc).toLowerCase();
        card.style.setProperty("--tier-color", tier.color);

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = isOn;

        const body = document.createElement("div");
        body.innerHTML = `
            <div class="ab-card-title">
                ${badge.emoji} ${badge.label}
                <span class="ab-tier-tag" style="background:${tier.color}">${tier.label}</span>
            </div>
            <div class="ab-card-desc">${badge.desc}</div>
        `;

        const toggle = () => {
            const next = !this.settings.flags[key];
            this.settings.flags[key] = next;
            cb.checked = next;
            card.classList.toggle("active", next);
            this._save();
            this._updateCounter(card.closest(".ab-root"));
        };

        card.addEventListener("click", (e) => { if (e.target !== cb) toggle(); });
        cb.addEventListener("change", toggle);
        // Evita disparar duas vezes quando o clique cai exatamente no checkbox
        cb.addEventListener("click", (e) => e.stopPropagation());

        card.append(cb, body);
        return card;
    }

    _createPremiumCard() {
        const premium = this.settings.premium;

        const card = document.createElement("div");
        card.className = `ab-card ab-extras-card${premium.enabled ? " active" : ""}`;
        card.style.setProperty("--tier-color", "#F47B67");

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = premium.enabled;

        const body = document.createElement("div");
        body.innerHTML = `
            <div class="ab-card-title">
                💜 Nitro
                <span class="ab-tier-tag" style="background:#F47B67">Experimental</span>
            </div>
            <div class="ab-card-desc">
                Nitro nunca fez parte do bitfield de flags — é controlado por um campo separado
                (premiumType). O ícone deve aparecer normalmente; a data de "assinante desde" no hover é
                a parte menos confiável, pois esse campo não é documentado publicamente pela Discord.
                Recursos que dependem de confirmação no servidor (ex.: emoji personalizado em outro
                servidor) continuam não funcionando — é só visual.
            </div>
        `;

        const select = document.createElement("select");
        select.className = "ab-select";
        for (const [value, label] of Object.entries(PREMIUM_TIERS)) {
            const opt = document.createElement("option");
            opt.value = value;
            opt.textContent = label;
            if (Number(value) === premium.tier) opt.selected = true;
            select.appendChild(opt);
        }
        select.disabled = !premium.enabled;
        body.appendChild(select);

        const toggle = () => {
            premium.enabled = !premium.enabled;
            if (premium.enabled && !premium.since) premium.since = new Date().toISOString();
            cb.checked = premium.enabled;
            select.disabled = !premium.enabled;
            card.classList.toggle("active", premium.enabled);
            this._save();
        };

        card.addEventListener("click", (e) => { if (e.target !== cb && e.target !== select) toggle(); });
        cb.addEventListener("click", (e) => e.stopPropagation());
        cb.addEventListener("change", toggle);
        select.addEventListener("click", (e) => e.stopPropagation());
        select.addEventListener("change", () => {
            premium.tier = Number(select.value);
            this._save();
        });

        card.append(cb, body);
        return card;
    }

    /** Cria um botão estilizado (ações em massa) */
    _btn(label, bg, onClick) {
        const b = document.createElement("button");
        b.className = "ab-btn";
        b.textContent = label;
        b.style.background = bg;
        b.addEventListener("click", onClick);
        return b;
    }

    /** Marca/desmarca todas as badges atualmente visíveis (respeita filtro + busca) */
    _bulkToggle(val, root) {
        root.querySelectorAll(".ab-card[data-key]").forEach(card => {
            if (card.style.display === "none") return;
            const key = card.dataset.key;
            this.settings.flags[key] = val;
            const cb = card.querySelector("input[type=checkbox]");
            if (cb) cb.checked = val;
            card.classList.toggle("active", val);
        });
        this._save();
        this._updateCounter(root);
    }

    /** Aplica o filtro de raridade + busca textual aos cards de flags */
    _applyFilters(root, searchTerm) {
        const term = (searchTerm || "").trim().toLowerCase();
        root.querySelectorAll(".ab-card[data-key]").forEach(card => {
            const matchesTier = this._activeTierFilter === "ALL" || card.dataset.tier === this._activeTierFilter;
            const matchesSearch = !term || card.dataset.search.includes(term);
            card.style.display = (matchesTier && matchesSearch) ? "" : "none";
        });
    }

    /** Atualiza o contador "X/12 badges ativas" */
    _updateCounter(root) {
        if (!root) return;
        const counter = root.querySelector(".ab-counter");
        if (!counter) return;
        const total = Object.keys(BADGES).length;
        const active = Object.values(this.settings.flags).filter(Boolean).length;
        counter.textContent = `${active}/${total} badges ativas`;
    }
};
