<div align="center">

<h1>🏅 AllBadges</h1>

<p><b>Plugin BetterDiscord que exibe qualquer badge do Discord no seu próprio perfil — 100% client-side.</b></p>

<p>
  <img src="https://img.shields.io/badge/versão-1.0.0-5865F2?style=for-the-badge" alt="Versão">
  <img src="https://img.shields.io/badge/BetterDiscord-compatível-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="BetterDiscord">
  <img src="https://img.shields.io/badge/autor-ykauttiz-2ECC71?style=for-the-badge" alt="Autor">
  <img src="https://img.shields.io/badge/licença-MIT-lightgrey?style=for-the-badge" alt="Licença">
</p>

</div>

---

## 📖 O que é isso?

**AllBadges** é um plugin para o [BetterDiscord](https://betterdiscord.app) que permite visualizar **qualquer badge oficial do Discord no seu perfil**, sem precisar ter ganhado de verdade.

> **⚠️ IMPORTANTE:**
> Todas as mudanças são **100% client-side** (somente no seu computador).
> - ✅ Você vê as badges ao abrir seu próprio perfil
> - ❌ **Outros usuários NÃO veem** — os dados reais ficam nos servidores do Discord
> - ❌ Nenhuma permissão real é concedida

---

## ✨ Funcionalidades

- 🎛️ **Painel de configurações visual** com cards interativos para cada badge
- 🎨 **Borda colorida** em cada card que ativa ao selecionar a badge
- 🔘 **Botões "Selecionar Tudo" e "Desmarcar Tudo"** para agilidade
- 💾 **Configurações persistentes** — suas escolhas são salvas entre sessões
- 🔄 **Patch reativo** — aplicado instantaneamente ao ativar/desativar
- 🏷️ **Tag "LEGADA"** nas badges que não são mais obteníveis no Discord
- 🛡️ **API moderna** do BetterDiscord (`BdApi.Webpack.getStore`, `BdApi.Patcher.after`)

---

## 🏆 Badges Disponíveis

| Emoji | Nome | Flag | Status |
|-------|------|------|--------|
| 🛡️ | Discord Staff | `DISCORD_EMPLOYEE` | Ativa |
| 🤝 | Discord Partner | `PARTNERED_SERVER_OWNER` | 🏷️ Legada |
| 🏆 | HypeSquad Events | `HYPESQUAD_EVENTS` | 🏷️ Legada |
| 🐛 | Bug Hunter Nível 1 | `BUG_HUNTER_LEVEL_1` | Ativa |
| 🏠 | House of Bravery | `HYPESQUAD_BRAVERY` | Ativa |
| 💡 | House of Brilliance | `HYPESQUAD_BRILLIANCE` | Ativa |
| ⚖️ | House of Balance | `HYPESQUAD_BALANCE` | Ativa |
| ⭐ | Early Supporter | `PREMIUM_EARLY_SUPPORTER` | 🏷️ Legada |
| 🦗 | Bug Hunter Nível 2 | `BUG_HUNTER_LEVEL_2` | Ativa |
| 🤖 | Verified Bot Developer | `VERIFIED_BOT_DEVELOPER` | 🏷️ Legada |
| 🔨 | Certified Moderator | `CERTIFIED_MODERATOR` | Ativa |
| 💻 | Active Developer | `ACTIVE_DEVELOPER` | 🏷️ Removida (Dez/2025) |

> **Nota sobre badges legadas:** Discord removeu as badges de Active Developer e Legacy Username em dezembro de 2025. A badge de Partner Program também não é mais concedida desde out/2023. Elas continuam disponíveis no plugin apenas como cosmético.

---

## 📦 Instalação

### Método 1 — Download direto *(Recomendado)*

1. Baixe o arquivo [`allbadges.plugin.js`](https://raw.githubusercontent.com/ykauttiz/allbadges/main/allbadges.plugin.js)
2. Mova para a pasta de plugins do BetterDiscord:

| Sistema | Caminho |
|---------|---------|
| **Windows** | `%APPDATA%\BetterDiscord\plugins\` |
| **macOS** | `~/Library/Application Support/BetterDiscord/plugins/` |
| **Linux** | `~/.config/BetterDiscord/plugins/` |

3. Abra o Discord → **Configurações do Usuário** → **Plugins** → Ative o **AllBadges**

### Método 2 — Copiar URL

Cole esta URL no seu navegador para download direto:

```
https://raw.githubusercontent.com/ykauttiz/allbadges/main/allbadges.plugin.js
```

---

## 🚀 Como usar

1. Com o plugin ativo, vá em **Configurações do Usuário → Plugins**
2. Clique no ⚙️ ao lado de **AllBadges**
3. Ative as badges desejadas clicando nos cards
4. Abra seu perfil para ver o resultado!

### Preview do painel de configurações

```
┌─────────────────────────────────────────────────────────┐
│ 🏅 AllBadges — Configurações          v1.0.0 · ykauttiz │
│ Ative as badges que deseja ver no seu perfil.           │
│ ⚠️ 100% client-side — apenas você vê essas badges.     │
├─────────────────────────────────────────────────────────┤
│  [✅ Selecionar Tudo]  [❌ Desmarcar Tudo]              │
├────────────────────────┬────────────────────────────────┤
│ ☑ 🛡️ Discord Staff    │ ☑ 🐛 Bug Hunter Nível 1       │
│   Funciona na equipe   │   Caçador de bugs (Bronze)     │
├────────────────────────┼────────────────────────────────┤
│ ☐ ⭐ Early Supporter   │ ☐ 🤖 Verified Bot Developer   │
│   [LEGADA] Nitro 2018  │   [LEGADA] Desenvolvedor bot   │
├────────────────────────┴────────────────────────────────┤
│ ⚠️ Plugin por ykauttiz · Use por conta e risco.        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Detalhes Técnicos

### Como o patch funciona

O plugin utiliza `BdApi.Patcher.after` para interceptar o retorno de `UserStore.getCurrentUser()` e aplicar as flags de badge selecionadas via operação **bitwise OR** (`|`). Isso garante que as flags existentes são preservadas.

```js
// Trecho simplificado do patch
Patcher.after(UserStore, "getCurrentUser", (_, _args, user) => {
    if (!user) return user;
    const extraFlags = selectedBadges.reduce((acc, bit) => acc | bit, 0);
    user.flags = (user.flags || 0) | extraFlags;
    return user;
});
```

### Módulos usados

| BdApi API | Uso |
|-----------|-----|
| `BdApi.Webpack.getStore("UserStore")` | Localiza o store de usuário (método moderno) |
| `BdApi.Webpack.getModule(Filters.byProps(...))` | Fallback caso o método acima falhe |
| `BdApi.Patcher.after` | Intercepta o retorno de `getCurrentUser` |
| `BdApi.Data.load / .save` | Persiste as configurações entre sessões |
| `BdApi.UI.showToast` | Notificações de início/parada |
| `new BdApi("AllBadges")` | Instância vinculada (auto-cleanup no stop) |

### Flags de badges (bitfield)

```js
// Discord UserFlags — valores decimais
DISCORD_EMPLOYEE         = 1 << 0  // 1
PARTNERED_SERVER_OWNER   = 1 << 1  // 2
HYPESQUAD_EVENTS         = 1 << 2  // 4
BUG_HUNTER_LEVEL_1       = 1 << 3  // 8
HYPESQUAD_BRAVERY        = 1 << 6  // 64
HYPESQUAD_BRILLIANCE     = 1 << 7  // 128
HYPESQUAD_BALANCE        = 1 << 8  // 256
PREMIUM_EARLY_SUPPORTER  = 1 << 9  // 512
BUG_HUNTER_LEVEL_2       = 1 << 14 // 16384
VERIFIED_BOT_DEVELOPER   = 1 << 17 // 131072
CERTIFIED_MODERATOR      = 1 << 18 // 262144
ACTIVE_DEVELOPER         = 1 << 22 // 4194304
```

---

## 🗂️ Estrutura do Projeto

```
allbadges/
├── allbadges.plugin.js   ← Plugin principal (único arquivo necessário)
└── README.md             ← Esta documentação
```

---

## ❓ Perguntas Frequentes

**Os outros usuários veem minhas badges falsas?**
Não. As mudanças são estritamente client-side. Quando outro usuário vê seu perfil, o cliente deles busca seus dados diretamente dos servidores do Discord, que não são afetados pelo plugin.

**As badges desaparecem se eu desativar o plugin?**
Sim. Ao desativar, `Patcher.unpatchAll()` remove o patch e tudo volta ao normal imediatamente.

**O plugin funciona após updates do Discord?**
Geralmente sim. O plugin usa `getStore("UserStore")` que é robusto a mudanças de minificação. Caso pare de funcionar, verifique se há uma atualização do plugin disponível.

**Posso combinar com outras badges reais da minha conta?**
Sim. O plugin usa OR bitwise, então suas badges reais são sempre preservadas.

---

## 📜 Changelog

### v1.0.0
- Lançamento inicial
- 12 badges suportadas com sistema de bitfield completo
- Painel de configurações com cards visuais e cores por badge
- API moderna: `getStore`, `Patcher.after`, `BdApi.Data`
- Botões de seleção em massa
- Tags "LEGADA" em badges descontinuadas pelo Discord

---

## ⚠️ Aviso Legal

> Usar o BetterDiscord e plugins de modificação de cliente pode violar os [Termos de Serviço do Discord](https://discord.com/terms). As badges exibidas são **visuais e não reais**. O autor não se responsabiliza por qualquer ação tomada pelo Discord em consequência do uso deste plugin. **Use por sua própria conta e risco.**

---

## 🛠️ Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro para discutir o que você gostaria de mudar.

```bash
git clone https://github.com/ykauttiz/allbadges.git
```

---

<div align="center">
  <p>Feito com ❤️ por <strong>ykauttiz</strong></p>
  <p>
    <a href="https://github.com/ykauttiz/allbadges/issues">🐛 Reportar Bug</a> ·
    <a href="https://github.com/ykauttiz/allbadges/issues">✨ Sugerir Feature</a>
  </p>
</div>
