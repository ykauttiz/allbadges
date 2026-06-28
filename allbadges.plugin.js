/**
 * @name AllBadges
 * @description Exibe qualquer badge do Discord no seu perfil. 100% client-side — só você vê.
 * @version 1.0.0
 * @author ykauttiz
 * @website https://github.com/ykauttiz/allbadges
 * @source https://raw.githubusercontent.com/ykauttiz/allbadges/main/allbadges.plugin.js
 * @updateUrl https://raw.githubusercontent.com/ykauttiz/allbadges/main/allbadges.plugin.js
 */

// ══════════════════════════════════════════════════════════════════════════════
// Mapa completo de UserFlags do Discord (bitfield)
// Fonte: discord-api-types · reversão da API do Discord
// ══════════════════════════════════════════════════════════════════════════════
const BADGES = {
    DISCORD_EMPLOYEE: {
        bit: 1 << 0,      // 1
        label: "Discord Staff",
        desc: "Funciona na equipe do Discord",
        emoji: "🛡️",
        color: "#5865F2",
    },
    PARTNERED_SERVER_OWNER: {
        bit: 1 << 1,      // 2
        label: "Discord Partner",
        desc: "Dono de servidor parceiro (badge legada)",
        emoji: "🤝",
        color: "#5865F2",
        legacy: true,
    },
    HYPESQUAD_EVENTS: {
        bit: 1 << 2,      // 4
        label: "HypeSquad Events",
        desc: "Membro de eventos HypeSquad (badge legada)",
        emoji: "🏆",
        color: "#F47B67",
        legacy: true,
    },
    BUG_HUNTER_LEVEL_1: {
        bit: 1 << 3,      // 8
        label: "Bug Hunter Nível 1",
        desc: "Caçador de bugs do Discord (Bronze)",
        emoji: "🐛",
        color: "#2ECC71",
    },
    HYPESQUAD_BRAVERY: {
        bit: 1 << 6,      // 64
        label: "House of Bravery",
        desc: "Membro da Casa da Bravura",
        emoji: "🏠",
        color: "#9B59B6",
    },
    HYPESQUAD_BRILLIANCE: {
        bit: 1 << 7,      // 128
        label: "House of Brilliance",
        desc: "Membro da Casa da Brilhância",
        emoji: "💡",
        color: "#E91E63",
    },
    HYPESQUAD_BALANCE: {
        bit: 1 << 8,      // 256
        label: "House of Balance",
        desc: "Membro da Casa do Equilíbrio",
        emoji: "⚖️",
        color: "#2ECC71",
    },
    PREMIUM_EARLY_SUPPORTER: {
        bit: 1 << 9,      // 512
        label: "Early Supporter",
        desc: "Apoiador antigo do Nitro (irrecuperável desde out/2018)",
        emoji: "⭐",
        color: "#F1C40F",
        legacy: true,
    },
    BUG_HUNTER_LEVEL_2: {
        bit: 1 << 14,     // 16384
        label: "Bug Hunter Nível 2",
        desc: "Caçador de bugs experiente (Ouro)",
        emoji: "🦗",
        color: "#F1C40F",
    },
    VERIFIED_BOT_DEVELOPER: {
        bit: 1 << 17,     // 131072
        label: "Verified Bot Developer",
        desc: "Desenvolvedor de bot verificado (legado)",
        emoji: "🤖",
        color: "#5865F2",
        legacy: true,
    },
    CERTIFIED_MODERATOR: {
        bit: 1 << 18,     // 262144
        label: "Discord Certified Moderator",
        desc: "Moderador certificado pelo Discord",
        emoji: "🔨",
        color: "#5865F2",
    },
    ACTIVE_DEVELOPER: {
        bit: 1 << 22,     // 4194304
        label: "Active Developer",
        desc: "Desenvolvedor ativo — removido em Dez/2025 (somente cosmético)",
        emoji: "💻",
        color: "#ED4245",
        legacy: true,
    },
};

// ══════════════════════════════════════════════════════════════════════════════
// Plugin principal
// ══════════════════════════════════════════════════════════════════════════════
module.exports = class AllBadges {
    constructor(meta) {
        // meta é injetado pelo BetterDiscord com os dados do cabeçalho
        this.meta = meta ?? {
            name: "AllBadges",
            version: "1.0.0",
            author: "ykauttiz",
        };

        // Instância do BdApi vinculada ao plugin — garante unpatch automático
        this.api = new BdApi("AllBadges");

        // Configurações padrão: todas as badges desativadas
        this._defaults = Object.fromEntries(
            Object.keys(BADGES).map(k => [k, false])
        );
        this.settings = {};
        this._started = false;
    }

    // ── Getters de metadados (compatibilidade BD legada) ─────────────────────
    getName()        { return "All Badges"; }
    getShortName()   { return "AllBadges"; }
    getVersion()     { return "1.0.0"; }
    getDescription() { return "Exibe qualquer badge do Discord no seu perfil. 100% client-side."; }
    getAuthor()      { return "ykauttiz"; }

    // ── Ciclo de vida ────────────────────────────────────────────────────────
    start() {
        if (this._started) { this.stop(); }
        this._started = true;

        // Carrega configurações salvas (ou usa padrão)
        this.settings = this.api.Data.load("settings") ?? { ...this._defaults };

        try {
            this._applyPatch();
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
        BdApi.UI.showToast("🛑 AllBadges desativado.", { type: "info" });
    }

    // ── Lógica de patch ──────────────────────────────────────────────────────

    /** Calcula o bitfield das badges selecionadas */
    _computeFlags() {
        return Object.entries(BADGES)
            .filter(([k]) => !!this.settings[k])
            .reduce((acc, [, { bit }]) => acc | bit, 0);
    }

    /**
     * Aplica o patch no UserStore.getCurrentUser.
     * Usa a API moderna (getStore) com fallback para getModule com filtro.
     */
    _applyPatch() {
        const UserStore =
            // Método preferido — nomeado, robusto a ofuscações do Discord
            BdApi.Webpack.getStore?.("UserStore") ??
            // Fallback — busca por propriedades conhecidas
            BdApi.Webpack.getModule(
                BdApi.Webpack.Filters.byProps("getCurrentUser", "getUser")
            );

        if (!UserStore) {
            this.api.Logger.error(
                "Não foi possível encontrar o UserStore.",
                "Pode ser que o Discord atualizou. Aguarde uma atualização do plugin."
            );
            BdApi.UI.showToast("❌ [AllBadges] UserStore não encontrado. Veja o console.", {
                type: "error",
            });
            return;
        }

        this.api.Patcher.after(UserStore, "getCurrentUser", (_, _args, user) => {
            if (!user) return user;
            const extra = this._computeFlags();
            if (extra) user.flags = (user.flags || 0) | extra;
            return user;
        });

        this.api.Logger.info("Patch aplicado com sucesso. Flags ativas:", this._computeFlags());
    }

    /** Remove o patch e reaplica (chamado ao salvar configurações) */
    _refreshPatch() {
        this.api.Patcher.unpatchAll();
        this._applyPatch();
    }

    // ── Persistência ─────────────────────────────────────────────────────────

    _save() {
        this.api.Data.save("settings", this.settings);
        this._refreshPatch();
    }

    // ── Painel de configurações (DOM puro, sem libs externas) ────────────────
    getSettingsPanel() {
        const root = document.createElement("div");
        root.style.cssText =
            "padding:20px;color:var(--header-primary);font-family:var(--font-primary);";

        // ─── Cabeçalho ───────────────────────────────────────────────────────
        root.insertAdjacentHTML(
            "beforeend",
            `<div style="margin-bottom:18px;">
                <h2 style="font-size:20px;font-weight:700;margin:0 0 6px;display:flex;align-items:center;gap:8px;">
                    🏅 AllBadges <span style="font-size:12px;font-weight:400;color:var(--header-secondary);">v1.0.0 · ykauttiz</span>
                </h2>
                <p style="font-size:13px;color:var(--header-secondary);margin:0;line-height:1.5;">
                    Ative as badges que deseja ver no seu perfil.<br>
                    <strong>⚠️ 100% client-side</strong> — apenas você vê essas badges.
                </p>
            </div>
            <div style="height:1px;background:var(--background-modifier-accent);margin-bottom:18px;"></div>`
        );

        // ─── Botões rápidos ───────────────────────────────────────────────────
        const bar = document.createElement("div");
        bar.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;";
        bar.appendChild(
            this._btn("✅ Selecionar Tudo", "#5865F2", () => this._bulkToggle(true, root))
        );
        bar.appendChild(
            this._btn("❌ Desmarcar Tudo", "#ED4245", () => this._bulkToggle(false, root))
        );
        root.appendChild(bar);

        // ─── Grade de badges ──────────────────────────────────────────────────
        const grid = document.createElement("div");
        grid.style.cssText =
            "display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:10px;";

        for (const [key, badge] of Object.entries(BADGES)) {
            const isOn = !!this.settings[key];

            const card = document.createElement("div");
            card.dataset.key = key;
            card.style.cssText = [
                "display:flex;align-items:center;gap:10px;",
                "padding:10px 14px;",
                "background:var(--background-secondary);",
                `border:2px solid ${isOn ? badge.color : "transparent"};`,
                "border-radius:10px;cursor:pointer;",
                "transition:border-color .2s,background .15s;",
                "user-select:none;",
            ].join("");

            // Checkbox
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = isOn;
            cb.style.cssText = `
                width:18px;height:18px;cursor:pointer;
                accent-color:${badge.color};flex-shrink:0;
            `;

            // Texto
            const textWrap = document.createElement("div");
            textWrap.innerHTML = `
                <div style="font-size:14px;font-weight:600;color:var(--header-primary);display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                    ${badge.emoji} ${badge.label}
                    ${badge.legacy
                        ? `<span style="font-size:10px;background:#ED4245;color:#fff;border-radius:4px;padding:1px 5px;font-weight:700;">LEGADA</span>`
                        : ""}
                </div>
                <div style="font-size:11px;color:var(--header-secondary);margin-top:3px;line-height:1.4;">
                    ${badge.desc}
                </div>
            `;

            // Toggle handler
            const toggle = () => {
                const next = !this.settings[key];
                this.settings[key] = next;
                cb.checked = next;
                card.style.borderColor = next ? badge.color : "transparent";
                this._save();
            };

            card.addEventListener("click", e => { if (e.target !== cb) toggle(); });
            cb.addEventListener("change", () => {
                this.settings[key] = cb.checked;
                card.style.borderColor = cb.checked ? badge.color : "transparent";
                this._save();
            });

            // Hover visual
            card.addEventListener("mouseover", () => {
                if (card.style.background !== "var(--background-secondary-alt)")
                    card.style.background = "var(--background-secondary-alt)";
            });
            card.addEventListener("mouseout", () => {
                card.style.background = "var(--background-secondary)";
            });

            card.append(cb, textWrap);
            grid.appendChild(card);
        }

        root.appendChild(grid);

        // ─── Rodapé ───────────────────────────────────────────────────────────
        root.insertAdjacentHTML(
            "beforeend",
            `<p style="
                margin-top:20px;padding-top:12px;
                font-size:11.5px;color:var(--header-muted);
                border-top:1px solid var(--background-modifier-accent);
                line-height:1.6;
            ">
                🔧 Plugin por <strong>ykauttiz</strong> · As badges são visuais e somente visíveis a você.<br>
                Usar BetterDiscord pode violar os Termos de Serviço do Discord. Use por conta e risco.
            </p>`
        );

        return root;
    }

    // ── Utilitários internos ─────────────────────────────────────────────────

    /** Cria um botão estilizado */
    _btn(label, bg, onClick) {
        const b = document.createElement("button");
        b.textContent = label;
        b.style.cssText = `
            padding:8px 18px;background:${bg};color:#fff;
            border:none;border-radius:6px;cursor:pointer;
            font-size:13px;font-weight:600;transition:filter .15s;
        `;
        b.addEventListener("mouseover", () => (b.style.filter = "brightness(.85)"));
        b.addEventListener("mouseout",  () => (b.style.filter = "brightness(1)"));
        b.addEventListener("click", onClick);
        return b;
    }

    /** Marca/desmarca todas as badges de uma vez */
    _bulkToggle(val, root) {
        Object.keys(BADGES).forEach(k => (this.settings[k] = val));
        this._save();

        // Atualiza visual dos cards sem recriar o painel
        root.querySelectorAll("[data-key]").forEach(card => {
            const key = card.dataset.key;
            const badge = BADGES[key];
            card.style.borderColor = val ? badge.color : "transparent";
            const cb = card.querySelector("input[type=checkbox]");
            if (cb) cb.checked = val;
        });
    }
};
