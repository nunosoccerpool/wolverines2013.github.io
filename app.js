const DATA_URL = "./data.json";

const COLUMNS = {
  playerSeasonTotals: [
    { key: "player", label: "#" },
    { key: "gp", label: "GP" },
    { key: "g", label: "G" },
    { key: "a", label: "A" },
    { key: "pts", label: "PTS" },
    { key: "plusMinus", label: "+/-" },
    { key: "pim", label: "PIM" },
    { key: "sog", label: "SOG" },
    { key: "fow", label: "FOW" },
    { key: "fol", label: "FOL" },
    { key: "fot", label: "FOT" },
    { key: "foPct", label: "FO%" }
  ],
  gameDetails: [
    { key: "game", label: "GAME" },
    { key: "vs", label: "VS" },
    { key: "result", label: "RESULT" },
    { key: "score", label: "SCORE" },
    { key: "_spacer", label: "", spacer: true }
  ],
  goalsFor: [
    { key: "game", label: "GAME" },
    { key: "opponent", label: "OPPONENT" },
    { key: "goalType", label: "GOAL TYPE" },
    { key: "goal", label: "GOAL" },
    { key: "assist1", label: "ASSIST" },
    { key: "assist2", label: "ASSIST" },
    { key: "forward1", label: "FORWARD", iceGroup: true },
    { key: "forward2", label: "FORWARD", iceGroup: true },
    { key: "forward3", label: "FORWARD", iceGroup: true },
    { key: "defence1", label: "DEFENCE", iceGroup: true },
    { key: "defence2", label: "DEFENCE", iceGroup: true }
  ],
  goalsAgainst: [
    { key: "game", label: "GAME" },
    { key: "opponent", label: "OPPONENT" },
    { key: "goalType", label: "GOAL TYPE" },
    { key: "forward1", label: "FORWARD", iceGroup: true },
    { key: "forward2", label: "FORWARD", iceGroup: true },
    { key: "forward3", label: "FORWARD", iceGroup: true },
    { key: "defence1", label: "DEFENCE", iceGroup: true },
    { key: "defence2", label: "DEFENCE", iceGroup: true }
  ],
  goalieSeasonTotals: [
    { key: "goalie", label: "GOALIE" },
    { key: "gp", label: "GP" },
    { key: "svPct", label: "SV%" },
    { key: "sv", label: "SV" },
    { key: "ga", label: "GA" }
  ],
  goalieGameByGame: [
    { key: "game", label: "GAME" },
    { key: "opponent", label: "OPPONENT" },
    { key: "result", label: "RESULT" },
    { key: "score", label: "SCORE" },
    { key: "g30Sv", label: "SV", goalieGroup: "30" },
    { key: "g30Ga", label: "GA", goalieGroup: "30" },
    { key: "g30SvPct", label: "SV%", goalieGroup: "30" },
    { key: "g33Sv", label: "SV", goalieGroup: "33" },
    { key: "g33Ga", label: "GA", goalieGroup: "33" },
    { key: "g33SvPct", label: "SV%", goalieGroup: "33" }
  ],
  specialTeams: [
    { key: "label", label: "" },
    { key: "value", label: "" }
  ],
  goalies: [
    { key: "goalie", label: "Goalie" },
    { key: "games", label: "Games" },
    { key: "saves", label: "Saves" },
    { key: "ga", label: "GA" },
    { key: "svPct", label: "SV %" }
  ],
  summary: [
    { key: "game", label: "Game" },
    { key: "opponent", label: "Opponent" },
    { key: "result", label: "Result" },
    { key: "shots", label: "Shots" },
    { key: "faceoffs", label: "Faceoffs" },
    { key: "shotsDiff", label: "SOG Diff" },
    { key: "foDiff", label: "FO Diff" }
  ],
  coachesCorner: [
    { key: "topic", label: "Topic" },
    { key: "notes", label: "Notes" }
  ]
};

const GAME_PLAYER_COLS = [
  { key: "player", label: "#" },
  { key: "g", label: "G" },
  { key: "a", label: "A" },
  { key: "pts", label: "PTS" },
  { key: "plusMinus", label: "+/-" },
  { key: "pim", label: "PIM" },
  { key: "sog", label: "SOG" },
  { key: "fow", label: "FOW" },
  { key: "fol", label: "FOL" },
  { key: "fot", label: "FOT" },
  { key: "foPct", label: "FO%" },
  { key: "sog1st", label: "SOG", subLabel: "(1st)" },
  { key: "sog2nd", label: "SOG", subLabel: "(2nd)" },
  { key: "sog3rd", label: "SOG", subLabel: "(3rd)" },
  { key: "ppSog", label: "PP", subLabel: "(sog)" }
];

const EXCLUDED_GOALIE_NUMBERS = new Set(["30", "33"]);

const SEASON_TOTALS_DESC_TIEBREAKERS = {
  gp: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "plusMinus", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  g: [
    { key: "pts", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "plusMinus", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  a: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "plusMinus", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  pts: [
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "plusMinus", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  plusMinus: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  pim: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  sog: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  fow: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  fol: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  fot: [
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ],
  foPct: [
    { key: "fot", dir: "desc" },
    { key: "fow", dir: "desc" },
    { key: "pts", dir: "desc" },
    { key: "g", dir: "desc" },
    { key: "a", dir: "desc" },
    { key: "sog", dir: "asc" },
    { key: "pim", dir: "asc" },
    { key: "gp", dir: "asc" },
    { key: "player", dir: "asc" }
  ]
};

const state = {
  data: null,
  activeTab: "playerSeasonTotals",
  search: "",
  scoringSearch: {
    goalsFor: "",
    goalsAgainst: ""
  },
  goaliesSearch: "",
  coachesGameFilter: "",
  sortKey: null,
  sortAsc: true,
  expandedGames: new Set()
};

const els = {
  title: document.getElementById("page-title"),
  subtitle: document.getElementById("page-subtitle"),
  summaryCards: document.getElementById("summary-cards"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  controlsRow: document.querySelector(".controls-row"),
  searchInput: document.getElementById("search-input"),
  rowCount: document.getElementById("row-count"),
  statusBanner: document.getElementById("status-banner"),
  tableHead: document.getElementById("table-head"),
  tableBody: document.getElementById("table-body")
};

let scoringContainer = null;
let specialTeamsCard = null;
let goaliesContainer = null;
let coachesCornerContainer = null;

function ensureScoringContainer() {
  if (scoringContainer) return scoringContainer;
  const tableWrap = els.tableBody ? els.tableBody.closest(".table-wrap") : null;
  if (!tableWrap || !tableWrap.parentNode) return null;

  scoringContainer = document.createElement("div");
  scoringContainer.id = "scoring-dual-tables";
  scoringContainer.className = "scoring-dual-tables hidden";
  tableWrap.parentNode.insertBefore(scoringContainer, tableWrap.nextSibling);
  return scoringContainer;
}

function ensureSpecialTeamsCard() {
  if (specialTeamsCard) return specialTeamsCard;
  const tableWrap = els.tableBody ? els.tableBody.closest(".table-wrap") : null;
  if (!tableWrap || !tableWrap.parentNode) return null;

  specialTeamsCard = document.createElement("div");
  specialTeamsCard.id = "special-teams-card";
  specialTeamsCard.className = "special-teams-card hidden";
  tableWrap.parentNode.insertBefore(specialTeamsCard, tableWrap.nextSibling);
  return specialTeamsCard;
}

function ensureGoaliesContainer() {
  if (goaliesContainer) return goaliesContainer;
  const tableWrap = els.tableBody ? els.tableBody.closest(".table-wrap") : null;
  if (!tableWrap || !tableWrap.parentNode) return null;

  goaliesContainer = document.createElement("div");
  goaliesContainer.id = "goalies-dual-tables";
  goaliesContainer.className = "goalies-dual-tables hidden";
  tableWrap.parentNode.insertBefore(goaliesContainer, tableWrap.nextSibling);
  return goaliesContainer;
}

function ensureCoachesCornerContainer() {
  if (coachesCornerContainer) return coachesCornerContainer;
  const tableWrap = els.tableBody ? els.tableBody.closest(".table-wrap") : null;
  if (!tableWrap || !tableWrap.parentNode) return null;

  coachesCornerContainer = document.createElement("div");
  coachesCornerContainer.id = "coaches-corner-view";
  coachesCornerContainer.className = "coaches-corner-view hidden";
  tableWrap.parentNode.insertBefore(coachesCornerContainer, tableWrap.nextSibling);
  return coachesCornerContainer;
}

function syncSpecialViewsVisibility() {
  const isScoring = state.activeTab === "scoring";
  const isSpecialTeams = state.activeTab === "specialTeams";
  const isGoalies = state.activeTab === "goalies";
  const isCoaches = state.activeTab === "coachesCorner";
  const hideStandard = isScoring || isSpecialTeams || isGoalies || isCoaches;

  const tableWrap = els.tableBody ? els.tableBody.closest(".table-wrap") : null;
  if (els.controlsRow) els.controlsRow.classList.toggle("hidden", hideStandard);
  if (tableWrap) tableWrap.classList.toggle("hidden", hideStandard);

  if (scoringContainer) {
    scoringContainer.classList.toggle("hidden", !isScoring);
    if (!isScoring) scoringContainer.innerHTML = "";
  }

  if (specialTeamsCard) {
    specialTeamsCard.classList.toggle("hidden", !isSpecialTeams);
    if (!isSpecialTeams) specialTeamsCard.innerHTML = "";
  }

  if (goaliesContainer) {
    goaliesContainer.classList.toggle("hidden", !isGoalies);
    if (!isGoalies) goaliesContainer.innerHTML = "";
  }

  if (coachesCornerContainer) {
    coachesCornerContainer.classList.toggle("hidden", !isCoaches);
    if (!isCoaches) coachesCornerContainer.innerHTML = "";
  }
}

function syncSearchPlaceholder() {
  if (!els.searchInput) return;
  if (state.activeTab === "summary") {
    els.searchInput.placeholder = "Search opponent...";
    els.searchInput.setAttribute("aria-label", "Search opponent");
  } else {
    els.searchInput.placeholder = "Filter rows..";
    els.searchInput.setAttribute("aria-label", "Filter rows");
  }
}

function escapeHtml(v) {
  return String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showError(msg) {
  if (!els.statusBanner) return;
  els.statusBanner.textContent = msg;
  els.statusBanner.classList.remove("hidden");
}

function clearError() {
  if (!els.statusBanner) return;
  els.statusBanner.textContent = "";
  els.statusBanner.classList.add("hidden");
}

function parseSortableNumber(val) {
  if (typeof val === "number") return Number.isFinite(val) ? val : NaN;
  const cleaned = String(val ?? "").replace(/[^\d.-]/g, "").trim();
  if (!cleaned || cleaned === "-" || cleaned === ".") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function compareVals(a, b, asc) {
  const numA = parseSortableNumber(a);
  const numB = parseSortableNumber(b);
  const bothNum = !Number.isNaN(numA) && !Number.isNaN(numB);
  if (bothNum) {
    if (numA === numB) return 0;
    return asc ? numA - numB : numB - numA;
  }
  const cmp = String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true });
  return asc ? cmp : -cmp;
}

function compareSeasonTotalsRows(a, b, primaryKey, sortAsc) {
  const primaryCmp = compareVals(a[primaryKey], b[primaryKey], sortAsc);
  if (primaryCmp !== 0) return primaryCmp;

  if (!sortAsc && SEASON_TOTALS_DESC_TIEBREAKERS[primaryKey]) {
    for (const rule of SEASON_TOTALS_DESC_TIEBREAKERS[primaryKey]) {
      const tieCmp = compareVals(a[rule.key], b[rule.key], rule.dir === "asc");
      if (tieCmp !== 0) return tieCmp;
    }
  }
  return 0;
}

function parseGameResultAndScore(rawResult) {
  const trimmed = String(rawResult ?? "").trim();
  if (!trimmed) return { result: "", score: "" };

  const prefixMatch = trimmed.match(/^([wlt])\s*[-:]?\s*(.+)$/i);
  if (prefixMatch) {
    const code = prefixMatch[1].toLowerCase();
    const score = prefixMatch[2].trim();
    const result = code === "w" ? "WIN" : code === "l" ? "LOSS" : "TIE";
    return { result, score };
  }

  const scoreMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (scoreMatch) {
    const ours = Number(scoreMatch[1]);
    const theirs = Number(scoreMatch[2]);
    let result = "TIE";
    if (ours > theirs) result = "WIN";
    else if (ours < theirs) result = "LOSS";
    return { result, score: trimmed };
  }

  return { result: "", score: trimmed };
}

function parsePairOutcome(val) {
  const m = String(val ?? "").trim().match(/^(-?\d+)\s*[-–]\s*(-?\d+)$/);
  if (!m) return "";
  const left = Number(m[1]);
  const right = Number(m[2]);
  if (left > right) return "win";
  if (left < right) return "loss";
  return "tie";
}

function parseDiffOutcome(val) {
  const s = String(val ?? "").trim();
  if (!s) return "";
  if (s.startsWith("+")) return "pos";
  if (s.startsWith("-")) return "neg";
  const n = Number(s);
  if (!Number.isNaN(n)) {
    if (n > 0) return "pos";
    if (n < 0) return "neg";
    return "zero";
  }
  return "";
}

function getSummaryCellOutcome(colKey, row) {
  if (colKey === "result") {
    const code = String(row?.result ?? "").trim().toUpperCase();
    if (code === "WIN" || code === "W") return "win";
    if (code === "LOSS" || code === "L") return "loss";
    if (code === "TIE" || code === "T") return "tie";
    return parsePairOutcome(row?.result);
  }
  if (colKey === "shots") return parsePairOutcome(row?.shots);
  if (colKey === "faceoffs") return parsePairOutcome(row?.faceoffs);
  if (colKey === "shotsDiff") return parseDiffOutcome(row?.shotsDiff);
  if (colKey === "foDiff") return parseDiffOutcome(row?.foDiff);
  return "";
}

function isValidSummaryRow(row) {
  if (!row || typeof row !== "object") return false;
  return Boolean(
    String(row.game ?? "").trim() ||
      String(row.opponent ?? "").trim() ||
      String(row.result ?? "").trim()
  );
}

function buildGameDetailsRows(data) {
  const playerRows = Array.isArray(data?.gameDetails) ? data.gameDetails : [];
  const summaryRows = Array.isArray(data?.summary)
    ? data.summary.filter(isValidSummaryRow)
    : [];

  const summaryByGame = new Map();
  for (const s of summaryRows) {
    const gKey = String(s?.game ?? "").trim();
    if (gKey && !summaryByGame.has(gKey)) {
      summaryByGame.set(gKey, s);
    }
  }

  const seenGames = new Set();
  const gamesPlayed = [];

  for (const row of playerRows) {
    const gameVal = String(row?.game ?? "").trim();
    if (!gameVal || seenGames.has(gameVal)) continue;

    const summaryMatch = summaryByGame.get(gameVal);
    const vsVal = String(row?.opponent ?? summaryMatch?.opponent ?? "").trim();
    const rawResult = String(row?.result ?? summaryMatch?.result ?? "").trim();
    const { result, score } = parseGameResultAndScore(rawResult);

    if (!vsVal || !score) continue;

    seenGames.add(gameVal);
    gamesPlayed.push({
      game: gameVal,
      vs: vsVal,
      result,
      score
    });
  }

  return gamesPlayed;
}

function getGamePlayerRows(data, gameId) {
  const rows = Array.isArray(data?.gameDetails) ? data.gameDetails : [];
  const target = String(gameId ?? "").trim();
  const goalieNums = new Set(EXCLUDED_GOALIE_NUMBERS);

  const goaliesTab = Array.isArray(data?.goalies) ? data.goalies : [];
  for (const g of goaliesTab) {
    const id = String(g?.goalie ?? g?.player ?? g?.number ?? "").trim().replace(/^#/, "");
    if (id) goalieNums.add(id);
  }

  return rows.filter((r) => {
    if (String(r?.game ?? "").trim() !== target) return false;
    const num = String(r?.player ?? "").trim().replace(/^#/, "");
    return !goalieNums.has(num);
  });
}

function renderGameSubtable(playerRows) {
  if (!playerRows.length) {
    return `<p class="subtable-empty">No player stats recorded for this game.</p>`;
  }

  const headHtml = GAME_PLAYER_COLS.map((c) => {
    const sub = c.subLabel
      ? `<span class="th-sub">${escapeHtml(c.subLabel)}</span>`
      : "";
    return `<th data-col="${escapeHtml(c.key)}"><span class="th-stack">${escapeHtml(c.label)}${sub}</span></th>`;
  }).join("");

  const bodyHtml = playerRows
    .map((p) => {
      const num = p?.player != null ? String(p.player).trim().replace(/^#/, "") : "";
      const rowAttr = num ? ` data-player="${escapeHtml(num)}"` : "";
      const cells = GAME_PLAYER_COLS.map(
        (c) => `<td data-col="${escapeHtml(c.key)}">${escapeHtml(p[c.key] ?? "")}</td>`
      ).join("");
      return `<tr${rowAttr}>${cells}</tr>`;
    })
    .join("");

  return `
    <div class="game-subtable-wrap">
      <table class="game-subtable">
        <thead><tr>${headHtml}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>`;
}

function getTabRows(data, tabKey) {
  if (!data) return [];
  if (tabKey === "gameDetails") {
    return buildGameDetailsRows(data);
  }
  if (tabKey === "summary") {
    return Array.isArray(data.summary) ? data.summary.filter(isValidSummaryRow) : [];
  }
  const list = data[tabKey];
  return Array.isArray(list) ? list : [];
}

function renderSummary(data) {
  if (!els.summaryCards) return;
  const kpis = data.kpis || {};
  const cards = [
    { label: "RECORD (W-L-T)", value: kpis.record ?? "-" },
    { label: "GOALS: FOR - AGAINST", value: kpis.goalsScoredAgainst ?? "-" },
    { label: "Total Power-Play Time", value: kpis.totalPowerPlayTime ?? "-" },
    { label: "POWER-PLAY GOALS FOR", value: kpis.powerPlayGoalsScored ?? "-" }
  ];

  els.summaryCards.innerHTML = cards
    .map(
      (c) => `
      <div class="card">
        <div class="card-label">${escapeHtml(c.label)}</div>
        <div class="card-value">${escapeHtml(c.value)}</div>
      </div>`
    )
    .join("");
}

function filterAndSortRows(rawRows, query) {
  const q = String(query ?? "").trim().toLowerCase();
  let rows = rawRows.filter((r) => {
    if (!q || !r || typeof r !== "object") return true;
    return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  if (state.sortKey) {
    rows = [...rows].sort((a, b) =>
      state.activeTab === "playerSeasonTotals"
        ? compareSeasonTotalsRows(a, b, state.sortKey, state.sortAsc)
        : compareVals(a[state.sortKey], b[state.sortKey], state.sortAsc)
    );
  }
  return rows;
}

function buildSpecialTeamsMiniTable(title, rows, themeClass) {
  const list = Array.isArray(rows) ? rows : [];
  const bodyHtml = list.length
    ? list
        .map(
          (r) => `
          <tr>
            <td class="st-label-cell">${escapeHtml(r?.label ?? r?.metric ?? "")}</td>
            <td class="st-value-cell">${escapeHtml(r?.value ?? "")}</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="2" class="st-empty-cell">No data available.</td></tr>`;

  return `
    <div class="special-teams-block ${themeClass}">
      <h3 class="special-teams-heading">${escapeHtml(title)}</h3>
      <table class="special-teams-mini-table ${themeClass}">
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>`;
}

function renderSpecialTeamsView() {
  if (state.activeTab !== "specialTeams") {
    syncSpecialViewsVisibility();
    return;
  }

  const card = ensureSpecialTeamsCard();
  syncSpecialViewsVisibility();
  if (!card) return;

  const st = state.data?.specialTeams;
  let ppRows = [];
  let pkRows = [];

  if (st && typeof st === "object" && !Array.isArray(st)) {
    ppRows = Array.isArray(st.powerPlay) ? st.powerPlay : [];
    pkRows = Array.isArray(st.penaltyKill) ? st.penaltyKill : [];
  } else if (Array.isArray(st)) {
    ppRows = st.map((item) => ({
      label: item.label ?? item.metric ?? "",
      value: item.value ?? ""
    }));
  }

  card.innerHTML =
    buildSpecialTeamsMiniTable("TEAM POWER-PLAY STATS", ppRows, "goals-for-theme") +
    buildSpecialTeamsMiniTable("TEAM PENALTY KILL STATS", pkRows, "goals-against-theme");
}

function buildScoringTableHtml({
  title,
  themeClass,
  tableAttr,
  filterKey,
  filterValue,
  cols,
  rawRows,
  rows,
  groupHeaderText,
  groupSpacerCols,
  groupSpanCols
}) {
  const iceBannerRow = groupHeaderText
    ? `<tr class="group-header-row">
         <th colspan="${groupSpacerCols}" class="group-spacer-th"></th>
         <th colspan="${groupSpanCols}" class="ice-group-th">${escapeHtml(groupHeaderText)}</th>
       </tr>`
    : "";

  const headHtml = cols
    .map((c) => {
      const isSorted = state.sortKey === c.key;
      const arrow = isSorted ? (state.sortAsc ? "▲" : "▼") : "▼";
      const cls = isSorted ? ' class="sorted-col"' : "";
      const arrowStyle = isSorted ? "" : ' style="visibility: hidden;"';
      return `<th data-key="${escapeHtml(c.key)}" data-col="${escapeHtml(c.key)}"${cls}><span class="th-inner">${escapeHtml(c.label)}<span class="sort-arrow"${arrowStyle}>${arrow}</span></span></th>`;
    })
    .join("");

  const bodyHtml = rows.length
    ? rows
        .map((r) => {
          const cells = cols
            .map((c) => {
              const tdCls = state.sortKey === c.key ? ' class="sorted-col"' : "";
              return `<td data-col="${escapeHtml(c.key)}"${tdCls}>${escapeHtml(r[c.key] ?? "")}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${cols.length}">No matching rows.</td></tr>`;

  return `
    <section class="scoring-section ${themeClass}">
      <div class="scoring-section-bar">
        <h2 class="scoring-section-title">${escapeHtml(title)}</h2>
        <div class="scoring-section-controls">
          <input
            type="search"
            class="search-input scoring-filter-input"
            data-scoring-filter="${escapeHtml(filterKey)}"
            value="${escapeHtml(filterValue)}"
            placeholder="Filter ${escapeHtml(title.toLowerCase())}..."
            aria-label="Filter ${escapeHtml(title)}"
          />
          <div class="row-count">Showing ${rows.length} of ${rawRows.length} rows</div>
        </div>
      </div>
      <div class="table-wrap scoring-table-wrap">
        <table class="scoring-table ${themeClass}" ${tableAttr}>
          <thead>
            ${iceBannerRow}
            <tr>${headHtml}</tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    </section>`;
}

function captureScoringFocus() {
  const active = document.activeElement;
  if (!active || !active.matches || !active.matches("input.scoring-filter-input[data-scoring-filter]")) {
    return null;
  }
  return {
    filterKey: active.dataset.scoringFilter,
    selectionStart: active.selectionStart,
    selectionEnd: active.selectionEnd
  };
}

function restoreScoringFocus(focusInfo) {
  if (!focusInfo || !scoringContainer) return;
  const input = scoringContainer.querySelector(
    `input.scoring-filter-input[data-scoring-filter="${CSS.escape(focusInfo.filterKey)}"]`
  );
  if (!input) return;
  input.focus();
  if (typeof focusInfo.selectionStart === "number" && typeof focusInfo.selectionEnd === "number") {
    try {
      input.setSelectionRange(focusInfo.selectionStart, focusInfo.selectionEnd);
    } catch (_) {}
  }
}

function renderScoringView() {
  if (state.activeTab !== "scoring") {
    syncSpecialViewsVisibility();
    return;
  }

  const focusInfo = captureScoringFocus();
  const container = ensureScoringContainer();
  syncSpecialViewsVisibility();
  if (!container) return;

  const rawGoalsFor = Array.isArray(state.data?.goalsFor) ? state.data.goalsFor : [];
  const rawGoalsAgainst = Array.isArray(state.data?.goalsAgainst) ? state.data.goalsAgainst : [];

  const filteredGoalsFor = filterAndSortRows(rawGoalsFor, state.scoringSearch.goalsFor);
  const filteredGoalsAgainst = filterAndSortRows(rawGoalsAgainst, state.scoringSearch.goalsAgainst);

  container.innerHTML =
    buildScoringTableHtml({
      title: "Goals For",
      themeClass: "goals-for-theme",
      tableAttr: 'data-scoring-table="goalsFor"',
      filterKey: "goalsFor",
      filterValue: state.scoringSearch.goalsFor,
      cols: COLUMNS.goalsFor,
      rawRows: rawGoalsFor,
      rows: filteredGoalsFor,
      groupHeaderText: "Wolverines on the ice at the time of goal scored",
      groupSpacerCols: 6,
      groupSpanCols: 5
    }) +
    buildScoringTableHtml({
      title: "Goals Against",
      themeClass: "goals-against-theme",
      tableAttr: 'data-scoring-table="goalsAgainst"',
      filterKey: "goalsAgainst",
      filterValue: state.scoringSearch.goalsAgainst,
      cols: COLUMNS.goalsAgainst,
      rawRows: rawGoalsAgainst,
      rows: filteredGoalsAgainst,
      groupHeaderText: "Wolverines on the ice at the time of goal against",
      groupSpacerCols: 3,
      groupSpanCols: 5
    });

  restoreScoringFocus(focusInfo);
}

function buildGoalieSeasonTableHtml(cols, rows) {
  const headHtml = cols
    .map((c) => {
      const isSorted = state.sortKey === c.key;
      const arrow = isSorted ? (state.sortAsc ? "▲" : "▼") : "▼";
      const cls = isSorted ? ' class="sorted-col"' : "";
      const arrowStyle = isSorted ? "" : ' style="visibility: hidden;"';
      return `<th data-key="${escapeHtml(c.key)}" data-col="${escapeHtml(c.key)}"${cls}><span class="th-inner">${escapeHtml(c.label)}<span class="sort-arrow"${arrowStyle}>${arrow}</span></span></th>`;
    })
    .join("");

  const bodyHtml = rows.length
    ? rows
        .map((r) => {
          const cells = cols
            .map((c) => {
              const tdCls = state.sortKey === c.key ? ' class="sorted-col"' : "";
              return `<td data-col="${escapeHtml(c.key)}"${tdCls}>${escapeHtml(r[c.key] ?? "")}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${cols.length}">No rows available.</td></tr>`;

  return `
    <section class="goalies-section goalies-season-section">
      <div class="goalies-section-bar">
        <h2 class="goalies-section-title">Season Totals</h2>
      </div>
      <div class="table-wrap goalies-season-table-wrap">
        <table class="goalies-season-table">
          <thead><tr>${headHtml}</tr></thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    </section>`;
}

function buildGoalieGameByGameTableHtml(cols, rawRows, rows) {
  const groupRowHtml = `
    <tr class="group-header-row">
      <th colspan="4" class="group-spacer-th"></th>
      <th colspan="3" class="ice-group-th">GOALIE #30</th>
      <th colspan="3" class="ice-group-th">GOALIE #33</th>
    </tr>`;

  const headHtml = cols
    .map((c) => {
      const isSorted = state.sortKey === c.key;
      const arrow = isSorted ? (state.sortAsc ? "▲" : "▼") : "▼";
      const cls = isSorted ? ' class="sorted-col"' : "";
      const arrowStyle = isSorted ? "" : ' style="visibility: hidden;"';
      const groupAttr = c.goalieGroup ? ` data-goalie-group="${escapeHtml(c.goalieGroup)}"` : "";
      return `<th data-key="${escapeHtml(c.key)}" data-col="${escapeHtml(c.key)}"${groupAttr}${cls}><span class="th-inner">${escapeHtml(c.label)}<span class="sort-arrow"${arrowStyle}>${arrow}</span></span></th>`;
    })
    .join("");

  const bodyHtml = rows.length
    ? rows
        .map((r) => {
          const rawResult = String(r?.result ?? r?.results ?? "").trim();
          const rawScore = String(r?.score ?? "").trim();

          const parsedFromResult = parseGameResultAndScore(rawResult);
          const parsedFromScore = parseGameResultAndScore(rawScore);

          const resultCode = (
            parsedFromResult.result ||
            parsedFromScore.result ||
            rawResult
          )
            .trim()
            .toUpperCase();

          const scoreText =
            parsedFromScore.score ||
            rawScore ||
            parsedFromResult.score ||
            "";

          const normalizedRow = {
            ...r,
            result: resultCode,
            score: scoreText
          };
          const rowAttr = resultCode ? ` data-result="${escapeHtml(resultCode)}"` : "";

          const cells = cols
            .map((c) => {
              const tdCls = state.sortKey === c.key ? ' class="sorted-col"' : "";
              const groupAttr = c.goalieGroup ? ` data-goalie-group="${escapeHtml(c.goalieGroup)}"` : "";
              return `<td data-col="${escapeHtml(c.key)}"${groupAttr}${tdCls}>${escapeHtml(normalizedRow[c.key] ?? "")}</td>`;
            })
            .join("");
          return `<tr${rowAttr}>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${cols.length}">No matching rows.</td></tr>`;

  return `
    <section class="goalies-section goalies-game-section">
      <div class="goalies-section-bar">
        <h2 class="goalies-section-title">Game by Game</h2>
        <div class="scoring-section-controls">
          <input
            type="search"
            class="search-input goalie-filter-input"
            value="${escapeHtml(state.goaliesSearch)}"
            placeholder="Filter game by game..."
            aria-label="Filter Game by Game"
          />
          <div class="row-count">Showing ${rows.length} of ${rawRows.length} rows</div>
        </div>
      </div>
      <div class="table-wrap goalies-game-table-wrap">
        <table class="goalies-game-table">
          <thead>
            ${groupRowHtml}
            <tr>${headHtml}</tr>
          </thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </div>
    </section>`;
}

function renderGoaliesView() {
  if (state.activeTab !== "goalies") {
    syncSpecialViewsVisibility();
    return;
  }

  const active = document.activeElement;
  const hadFilterFocus = Boolean(active && active.matches && active.matches("input.goalie-filter-input"));
  const selStart = hadFilterFocus ? active.selectionStart : null;
  const selEnd = hadFilterFocus ? active.selectionEnd : null;

  const container = ensureGoaliesContainer();
  syncSpecialViewsVisibility();
  if (!container) return;

  const seasonRows = Array.isArray(state.data?.goalieSeasonTotals)
    ? filterAndSortRows(state.data.goalieSeasonTotals, "")
    : [];
  const rawGameRows = Array.isArray(state.data?.goalieGameByGame) ? state.data.goalieGameByGame : [];
  const filteredGameRows = filterAndSortRows(rawGameRows, state.goaliesSearch);

  container.innerHTML =
    buildGoalieSeasonTableHtml(COLUMNS.goalieSeasonTotals, seasonRows) +
    buildGoalieGameByGameTableHtml(COLUMNS.goalieGameByGame, rawGameRows, filteredGameRows);

  if (hadFilterFocus) {
    const input = container.querySelector("input.goalie-filter-input");
    if (input) {
      input.focus();
      if (typeof selStart === "number" && typeof selEnd === "number") {
        try {
          input.setSelectionRange(selStart, selEnd);
        } catch (_) {}
      }
    }
  }
}

function renderBulletList(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return `<p class="cc-empty">No notes recorded.</p>`;
  return `<ul class="cc-list">${arr.map((txt) => `<li>${escapeHtml(txt)}</li>`).join("")}</ul>`;
}

function renderGameScoringSummary(scoringSummary) {
  const gf = Array.isArray(scoringSummary?.goalsFor) ? scoringSummary.goalsFor : [];
  const ga = Array.isArray(scoringSummary?.goalsAgainst) ? scoringSummary.goalsAgainst : [];

  const gfHtml = gf.length
    ? `<ul class="cc-goal-list">${gf
        .map((g) => {
          const assists = Array.isArray(g.assists) && g.assists.length ? ` (${g.assists.join(", ")})` : "";
          const onIce = Array.isArray(g.onIce) && g.onIce.length ? `On Ice: ${g.onIce.join(", ")}` : "On Ice: -";
          return `<li>
            <span class="cc-badge cc-badge-gf">${escapeHtml(g.goalType || "EV")}</span>
            <strong>${escapeHtml(g.goal || "Goal")}</strong>${escapeHtml(assists)}
            <span class="cc-on-ice">— ${escapeHtml(onIce)}</span>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="cc-empty">No goals for recorded.</p>`;

  const gaHtml = ga.length
    ? `<ul class="cc-goal-list">${ga
        .map((g) => {
          const onIce = Array.isArray(g.onIce) && g.onIce.length ? `On Ice: ${g.onIce.join(", ")}` : "On Ice: -";
          return `<li>
            <span class="cc-badge cc-badge-ga">${escapeHtml(g.goalType || "EV")}</span>
            <span class="cc-on-ice">${escapeHtml(onIce)}</span>
          </li>`;
        })
        .join("")}</ul>`
    : `<p class="cc-empty">No goals against recorded.</p>`;

  return `
    <div class="cc-scoring-summary">
      <h4 class="cc-sub-heading">Scoring Summary (On-Ice)</h4>
      <div class="cc-scoring-grid">
        <div class="cc-scoring-col cc-gf-col">
          <div class="cc-scoring-col-title">Goals For (${gf.length})</div>
          ${gfHtml}
        </div>
        <div class="cc-scoring-col cc-ga-col">
          <div class="cc-scoring-col-title">Goals Against (${ga.length})</div>
          ${gaHtml}
        </div>
      </div>
    </div>`;
}

function renderCoachesCornerView() {
  if (state.activeTab !== "coachesCorner") {
    syncSpecialViewsVisibility();
    return;
  }

  const active = document.activeElement;
  const hadFilterFocus = Boolean(active && active.matches && active.matches("input.cc-game-filter-input"));
  const selStart = hadFilterFocus ? active.selectionStart : null;
  const selEnd = hadFilterFocus ? active.selectionEnd : null;

  const container = ensureCoachesCornerContainer();
  syncSpecialViewsVisibility();
  if (!container) return;

  const cc = state.data?.coachesCorner || {};
  const season = cc.seasonAnalysis || {};
  const allGames = Array.isArray(cc.games)
    ? [...cc.games].sort((a, b) => {
        const keyA = String(a?.game ?? "").replace(/^(?:game\s*|g)?0*(\d+)$/i, "$1");
        const keyB = String(b?.game ?? "").replace(/^(?:game\s*|g)?0*(\d+)$/i, "$1");
        const numA = Number(keyA);
        const numB = Number(keyB);
        const bothNum = Number.isInteger(numA) && Number.isInteger(numB) && /^\d+$/.test(keyA) && /^\d+$/.test(keyB);
        if (bothNum && numA !== numB) {
          return numB - numA;
        }
        return String(b?.game ?? "").localeCompare(String(a?.game ?? ""), undefined, { numeric: true });
      })
    : [];

  const q = String(state.coachesGameFilter || "").trim().toLowerCase();
  const filteredGames = q
    ? allGames.filter((g) => {
        const hay = [
          g.game,
          g.opponent,
          g.result,
          g.score,
          ...(g.keyPointsAndTakeaways || []),
          ...(g.practiceAndTacticalFocus || [])
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : allGames;

  const seasonHtml = `
    <section class="cc-season-panel">
      <div class="cc-panel-header">
        <h2 class="cc-section-title">Season Analysis</h2>
      </div>
      <div class="cc-two-col">
        <div class="cc-box cc-highlights-box">
          <h3 class="cc-box-heading cc-heading-pos">Key Highlights (What’s Working Well)</h3>
          ${renderBulletList(season.keyHighlights)}
        </div>
        <div class="cc-box cc-improvements-box">
          <h3 class="cc-box-heading cc-heading-focus">Points of Improvement (Where to Focus)</h3>
          ${renderBulletList(season.pointsOfImprovement)}
        </div>
      </div>
    </section>`;

  const gamesHtml = filteredGames.length
    ? filteredGames
        .map((g) => {
          const resUpper = String(g.result || "").trim().toUpperCase();
          const resCls =
            resUpper === "WIN"
              ? "cc-res-win"
              : resUpper === "LOSS"
              ? "cc-res-loss"
              : resUpper === "TIE"
              ? "cc-res-tie"
              : "";
          return `
          <article class="cc-game-card">
            <div class="cc-game-card-header">
              <div class="cc-game-title">
                <span class="cc-game-num">Game ${escapeHtml(g.game)}</span>
                <span class="cc-game-vs">vs ${escapeHtml(g.opponent)}</span>
              </div>
              <div class="cc-game-meta">
                <span class="cc-game-result ${resCls}">${escapeHtml(g.result || "")}</span>
                <span class="cc-game-score">${escapeHtml(g.score || "")}</span>
              </div>
            </div>
            ${renderGameScoringSummary(g.scoringSummary)}
            <div class="cc-two-col cc-game-sections">
              <div class="cc-box">
                <h4 class="cc-box-heading">Key Game Points &amp; Coaching Takeaways</h4>
                ${renderBulletList(g.keyPointsAndTakeaways)}
              </div>
              <div class="cc-box">
                <h4 class="cc-box-heading">Practice &amp; Tactical Focus</h4>
                ${renderBulletList(g.practiceAndTacticalFocus)}
              </div>
            </div>
          </article>`;
        })
        .join("")
    : `<p class="cc-empty">No matching game analyses.</p>`;

  container.innerHTML = `
    ${seasonHtml}
    <section class="cc-games-panel">
      <div class="cc-games-bar">
        <h2 class="cc-section-title">Game-by-Game Analysis</h2>
        <div class="scoring-section-controls">
          <input
            type="search"
            class="search-input cc-game-filter-input"
            value="${escapeHtml(state.coachesGameFilter)}"
            placeholder="Filter game or opponent..."
            aria-label="Filter game or opponent"
          />
          <div class="row-count">Showing ${filteredGames.length} of ${allGames.length} games</div>
        </div>
      </div>
      <div class="cc-games-list">${gamesHtml}</div>
    </section>`;

  if (hadFilterFocus) {
    const input = container.querySelector("input.cc-game-filter-input");
    if (input) {
      input.focus();
      if (typeof selStart === "number" && typeof selEnd === "number") {
        try {
          input.setSelectionRange(selStart, selEnd);
        } catch (_) {}
      }
    }
  }
}

function renderTable() {
  if (!state.data || !els.tableHead || !els.tableBody) return;

  if (state.activeTab === "scoring") {
    renderScoringView();
    return;
  }

  if (state.activeTab === "specialTeams") {
    renderSpecialTeamsView();
    return;
  }

  if (state.activeTab === "goalies") {
    renderGoaliesView();
    return;
  }

  if (state.activeTab === "coachesCorner") {
    renderCoachesCornerView();
    return;
  }

  syncSpecialViewsVisibility();
  syncSearchPlaceholder();

  const q = (els.searchInput ? els.searchInput.value : state.search).trim().toLowerCase();
  const cols = COLUMNS[state.activeTab] || [];
  const raw = getTabRows(state.data, state.activeTab);

  const tableEl = els.tableHead.closest("table");
  if (tableEl) {
    tableEl.dataset.tab = state.activeTab;
    tableEl.classList.toggle("is-sorted", Boolean(state.sortKey));
  }

  const rows = filterAndSortRows(raw, q);

  els.tableHead.innerHTML = `
    <tr>
      ${cols
        .map((c) => {
          if (c.spacer) {
            return `<th data-col="${escapeHtml(c.key)}" data-spacer="true"><span class="th-inner"></span></th>`;
          }
          const isSorted = state.sortKey === c.key;
          const arrow = isSorted ? (state.sortAsc ? "▲" : "▼") : "▼";
          const cls = isSorted ? ' class="sorted-col"' : "";
          const arrowStyle = isSorted ? "" : ' style="visibility: hidden;"';
          return `<th data-key="${escapeHtml(c.key)}" data-col="${escapeHtml(c.key)}"${cls}><span class="th-inner">${escapeHtml(c.label)}<span class="sort-arrow"${arrowStyle}>${arrow}</span></span></th>`;
        })
        .join("")}
    </tr>`;

  els.tableBody.innerHTML = rows.length
    ? rows
        .map((r) => {
          const isGameTab = state.activeTab === "gameDetails";
          const gameId = isGameTab ? String(r.game ?? "").trim() : "";
          const resultCode = isGameTab ? String(r.result ?? "").trim().toUpperCase() : "";
          const isExpanded = isGameTab && state.expandedGames.has(gameId);

          const playerNum =
            state.activeTab === "playerSeasonTotals" && r && r.player != null
              ? String(r.player).trim().replace(/^#/, "")
              : "";
          const rowClasses = [
            isGameTab ? "game-row" : "",
            isExpanded ? "is-open" : ""
          ]
            .filter(Boolean)
            .join(" ");
          const rowAttr = [
            playerNum ? ` data-player="${escapeHtml(playerNum)}"` : "",
            isGameTab
              ? ` data-game="${escapeHtml(gameId)}" data-result="${escapeHtml(resultCode)}" aria-expanded="${String(isExpanded)}"`
              : "",
            rowClasses ? ` class="${rowClasses}"` : ""
          ].join("");

          const mainRowHtml = `
          <tr${rowAttr}>
            ${cols
              .map((c) => {
                if (c.spacer) {
                  return `<td data-col="${escapeHtml(c.key)}" data-spacer="true"></td>`;
                }
                const tdCls = state.sortKey === c.key ? ' class="sorted-col"' : "";
                const outcome =
                  state.activeTab === "summary" ? getSummaryCellOutcome(c.key, r) : "";
                const outcomeAttr = outcome
                  ? ` data-outcome="${escapeHtml(outcome)}"`
                  : "";
                const indicator =
                  isGameTab && c.key === "game"
                    ? `<span class="expand-indicator">${isExpanded ? "▲" : "▼"}</span>`
                    : "";
                return `<td data-col="${escapeHtml(c.key)}"${outcomeAttr}${tdCls}>${indicator}${escapeHtml(r[c.key] ?? "")}</td>`;
              })
              .join("")}
          </tr>`;

          if (!isGameTab) return mainRowHtml;

          const playerRows = getGamePlayerRows(state.data, gameId);
          return `${mainRowHtml}
          <tr class="game-expand-row${isExpanded ? " is-open" : ""}" data-game-drawer="${escapeHtml(gameId)}">
            <td colspan="${cols.length}" class="game-expand-cell">
              <div class="game-drawer">
                <div class="game-drawer-inner">
                  <div class="game-drawer-content">
                    <div class="game-drawer-header">
                      <span>Game ${escapeHtml(gameId)} vs ${escapeHtml(r.vs)} — Player Stats</span>
                    </div>
                    ${renderGameSubtable(playerRows)}
                  </div>
                </div>
              </div>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="${cols.length}">No matching rows.</td></tr>`;

  if (els.rowCount) {
    els.rowCount.textContent = `Showing ${rows.length} of ${raw.length} rows`;
  }
}

function handleSortHeaderClick(e) {
  const th = e.target.closest("th[data-key]");
  if (!th) return;
  const key = th.dataset.key;
  if (state.sortKey === key) {
    state.sortAsc = !state.sortAsc;
  } else {
    state.sortKey = key;
    state.sortAsc = state.activeTab === "playerSeasonTotals" ? false : true;
  }
  renderTable();
}

async function load() {
  clearError();
  if (window.location.protocol === "file:") {
    showError(
      "Opened via file:// — browsers block fetch() on local files. Run `python -m http.server 8000` in C:\\wolverines2013 and open http://localhost:8000"
    );
    return;
  }

  try {
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status} loading ${DATA_URL}`);
    const data = await res.json();
    state.data = data;

    if (els.title) {
      els.title.textContent = `${data.meta?.team || "Wolverines"} Stats`;
    }
    if (data.meta?.subtitle && els.subtitle) {
      els.subtitle.textContent = data.meta.subtitle;
    }
    renderSummary(data);
    renderTable();
  } catch (err) {
    showError(`Could not load data.json: ${err.message}`);
  }
}

els.tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    state.activeTab = btn.dataset.tab;
    state.sortKey = null;
    state.sortAsc = true;
    els.tabButtons.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", String(active));
    });
    syncSpecialViewsVisibility();
    renderTable();
  });
});

if (els.tableHead) {
  els.tableHead.addEventListener("click", handleSortHeaderClick);
}

document.addEventListener("click", (e) => {
  const inScoring = state.activeTab === "scoring" && scoringContainer && scoringContainer.contains(e.target);
  const inGoalies = state.activeTab === "goalies" && goaliesContainer && goaliesContainer.contains(e.target);
  if (!inScoring && !inGoalies) return;
  handleSortHeaderClick(e);
});

document.addEventListener("input", (e) => {
  const target = e.target;
  if (!target || !target.matches) return;

  if (state.activeTab === "scoring" && target.matches("input.scoring-filter-input[data-scoring-filter]")) {
    const filterKey = target.dataset.scoringFilter;
    if (filterKey === "goalsFor" || filterKey === "goalsAgainst") {
      state.scoringSearch[filterKey] = target.value;
      renderScoringView();
    }
    return;
  }

  if (state.activeTab === "goalies" && target.matches("input.goalie-filter-input")) {
    state.goaliesSearch = target.value;
    renderGoaliesView();
    return;
  }

  if (state.activeTab === "coachesCorner" && target.matches("input.cc-game-filter-input")) {
    state.coachesGameFilter = target.value;
    renderCoachesCornerView();
  }
});

if (els.tableBody) {
  els.tableBody.addEventListener("click", (e) => {
    if (state.activeTab !== "gameDetails") return;
    const gameRow = e.target.closest("tr.game-row[data-game]");
    if (!gameRow) return;
    const gameId = gameRow.dataset.game;
    if (!gameId) return;

    const nowOpen = !state.expandedGames.has(gameId);
    if (nowOpen) state.expandedGames.add(gameId);
    else state.expandedGames.delete(gameId);

    gameRow.classList.toggle("is-open", nowOpen);
    gameRow.setAttribute("aria-expanded", String(nowOpen));
    const indicator = gameRow.querySelector(".expand-indicator");
    if (indicator) indicator.textContent = nowOpen ? "▲" : "▼";

    const expandRow = els.tableBody.querySelector(
      `tr.game-expand-row[data-game-drawer="${CSS.escape(gameId)}"]`
    );
    if (expandRow) {
      expandRow.classList.toggle("is-open", nowOpen);
    }
  });
}

if (els.searchInput) {
  els.searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    renderTable();
  });
}

load();