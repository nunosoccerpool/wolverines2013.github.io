import hashlib
import json
import os
import re
from google.oauth2 import service_account
from googleapiclient.discovery import build

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
DEFAULT_SPREADSHEET_ID = "1nphcd9x5l2sfj-qkDfNCkHUD4QWWeIhLTtjixmUGe1M"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

SHEET_TABS = {
    "PlayerStats": 2056733764,
    "TeamStats": 577058236,
    "GoalsFor": 2001822720,
    "GoalsAgainst": 1253697911,
}
TAB_NAMES = list(SHEET_TABS.keys())


def to_int(val):
    try:
        s = str(val).strip()
        if not s:
            return 0
        return int(float(s))
    except Exception:
        return 0


def col_letter_to_idx(letter):
    idx = 0
    for ch in letter:
        idx = idx * 26 + (ord(ch.upper()) - ord("A") + 1)
    return idx - 1


def get_cell(rows, sheet_row_num, col_letter):
    r_idx = sheet_row_num - 1
    c_idx = col_letter_to_idx(col_letter)
    if r_idx < 0 or r_idx >= len(rows):
        return ""
    row = rows[r_idx]
    if c_idx < 0 or c_idx >= len(row):
        return ""
    return str(row[c_idx]).strip()


def get_row_value(rows, sheet_row_num, fallback_cols=("B", "C", "D", "E", "F", "G", "H")):
    for col in fallback_cols:
        val = get_cell(rows, sheet_row_num, col)
        if val != "":
            return val
    return ""


def get_col(row, col_letter):
    c_idx = col_letter_to_idx(col_letter)
    if c_idx < 0 or c_idx >= len(row):
        return ""
    return str(row[c_idx]).strip()


def normalize_game_key(val):
    s = str(val or "").strip()
    m = re.match(r"^(?:game\s*|g)?0*(\d+)$", s, re.IGNORECASE)
    return m.group(1) if m else s


def count_non_empty_col_a_from_a2(rows):
    if not rows or len(rows) <= 1:
        return 0
    count = 0
    for r in rows[1:]:
        val = str(r[0]).strip() if len(r) > 0 else ""
        if val != "":
            count += 1
    return count


def format_sv_pct(sv, ga):
    total_shots = sv + ga
    if total_shots <= 0:
        return ".000"
    pct = sv / total_shots
    if pct >= 1.0:
        return "1.000"
    return f"{pct:.3f}".lstrip("0")


def parse_game_result_and_score(raw_result):
    trimmed = str(raw_result or "").strip()
    if not trimmed:
        return "", ""

    prefix_match = re.match(r"^([wlt])\s*[-:]?\s*(.+)$", trimmed, re.IGNORECASE)
    if prefix_match:
        code = prefix_match.group(1).lower()
        score = prefix_match.group(2).strip()
        result = "WIN" if code == "w" else "LOSS" if code == "l" else "TIE"
        return result, score

    score_match = re.match(r"^(\d+)\s*[-–]\s*(\d+)$", trimmed)
    if score_match:
        ours = int(score_match.group(1))
        theirs = int(score_match.group(2))
        if ours > theirs:
            return "WIN", trimmed
        if ours < theirs:
            return "LOSS", trimmed
        return "TIE", trimmed

    return "", trimmed


def compute_kpis(team_stats_rows, goals_for_rows, goals_against_rows):
    record = get_cell(team_stats_rows, 37, "B") or "-"
    goals_for_count = count_non_empty_col_a_from_a2(goals_for_rows)
    goals_against_count = count_non_empty_col_a_from_a2(goals_against_rows)
    goals_for_against = f"{goals_for_count} - {goals_against_count}"
    total_pp_time = get_cell(team_stats_rows, 41, "D") or "-"
    pp_goals_for = get_cell(team_stats_rows, 43, "D") or "-"

    return {
        "record": record,
        "goalsScoredAgainst": goals_for_against,
        "totalPowerPlayTime": total_pp_time,
        "powerPlayGoalsScored": pp_goals_for,
    }


def fetch_all_tabs(spreadsheet_id, tab_names=TAB_NAMES):
    creds_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    creds_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "service_account.json")

    if creds_json:
        info = json.loads(creds_json)
        creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    elif os.path.exists(creds_file):
        creds = service_account.Credentials.from_service_account_file(creds_file, scopes=SCOPES)
    else:
        raise RuntimeError(
            "Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or place service_account.json in the project root."
        )

    service = build("sheets", "v4", credentials=creds)
    ranges = [f"{name}!A1:AZ2000" for name in tab_names]
    res = (
        service.spreadsheets()
        .values()
        .batchGet(spreadsheetId=spreadsheet_id, ranges=ranges)
        .execute()
    )

    tabs_data = {name: [] for name in tab_names}
    for vr in res.get("valueRanges", []):
        r_str = vr.get("range", "")
        matched_tab = next(
            (name for name in tab_names if r_str.startswith(f"{name}!") or r_str.startswith(f"'{name}'!")),
            None,
        )
        if matched_tab:
            tabs_data[matched_tab] = vr.get("values", [])
    return tabs_data


def rows_to_dicts(rows):
    if not rows or len(rows) < 2:
        return []
    headers = [str(h).strip() for h in rows[0]]
    records = []
    for r in rows[1:]:
        if not any(str(c).strip() for c in r):
            continue
        item = {}
        for idx, h in enumerate(headers):
            if not h:
                continue
            item[h] = str(r[idx]).strip() if idx < len(r) else ""
        records.append(item)
    return records


def parse_player_stats_tab(rows):
    """PlayerStats -> Season Totals (F/D in col F), Goalie Season Totals, Game Details, and Goalies."""
    agg = {}
    player_order = []

    goalie_agg = {}
    goalie_order = []
    goalie_by_game = {}

    for r in rows[1:] if rows and len(rows) > 1 else []:
        player_num = get_col(r, "E")
        pos = get_col(r, "F").upper()
        clean_num = player_num.lstrip("#").strip()
        raw_game = get_col(r, "A")
        game_key = normalize_game_key(raw_game)

        val_v = get_col(r, "V")
        val_w = get_col(r, "W")
        val_x = get_col(r, "X")
        has_goalie_vwx = any(x != "" for x in (val_v, val_w, val_x))

        is_tracked_goalie = clean_num in ("30", "33") or pos in ("G", "GOALIE") or (
            clean_num != "" and pos == "" and has_goalie_vwx
        )

        if is_tracked_goalie and clean_num:
            if clean_num not in goalie_agg:
                goalie_agg[clean_num] = {
                    "goalie": clean_num,
                    "gp": 0,
                    "sv": 0,
                    "ga": 0,
                }
                goalie_order.append(clean_num)

            g_data = goalie_agg[clean_num]
            if has_goalie_vwx:
                g_data["gp"] += 1
            g_data["sv"] += to_int(val_v)
            g_data["ga"] += to_int(val_w)

            if game_key:
                goalie_by_game.setdefault(game_key, {})[clean_num] = {
                    "sv": val_v,
                    "ga": val_w,
                    "svPct": val_x,
                }

        elif player_num and pos in ("F", "D"):
            if player_num not in agg:
                agg[player_num] = {
                    "player": player_num,
                    "gp": 0,
                    "g": 0,
                    "a": 0,
                    "pts": 0,
                    "plusMinus": 0,
                    "pim": 0,
                    "sog": 0,
                    "fow": 0,
                    "fol": 0,
                    "fot": 0,
                }
                player_order.append(player_num)

            d = agg[player_num]
            col_d = get_col(r, "D")
            col_l = get_col(r, "L").lower()
            if col_d != "" and col_l != "x":
                d["gp"] += 1

            d["g"] += to_int(get_col(r, "G"))
            d["a"] += to_int(get_col(r, "H"))
            d["pts"] += to_int(get_col(r, "I"))
            d["plusMinus"] += to_int(get_col(r, "J"))
            d["pim"] += to_int(get_col(r, "K"))
            d["sog"] += to_int(get_col(r, "M"))
            d["fow"] += to_int(get_col(r, "N"))
            d["fol"] += to_int(get_col(r, "O"))
            d["fot"] += to_int(get_col(r, "P"))

    player_season_totals = []
    for p in player_order:
        d = agg[p]
        fo_pct = f"{(d['fow'] / d['fot']) * 100:.1f}%" if d["fot"] > 0 else "0.0%"
        player_season_totals.append({
            **d,
            "foPct": fo_pct,
        })

    player_season_totals.sort(
        key=lambda x: (-x["pts"], -x["g"], -x["a"], int(x["player"]) if x["player"].isdigit() else 999)
    )

    goalie_season_totals = []
    for g_num in goalie_order:
        g_data = goalie_agg[g_num]
        goalie_season_totals.append({
            "goalie": g_data["goalie"],
            "gp": g_data["gp"],
            "sv": g_data["sv"],
            "ga": g_data["ga"],
            "svPct": format_sv_pct(g_data["sv"], g_data["ga"]),
        })

    goalie_season_totals.sort(
        key=lambda x: int(x["goalie"]) if str(x["goalie"]).isdigit() else 999
    )

    headers = [str(h).strip() for h in rows[0]] if rows and len(rows) >= 2 else []
    game_details = []
    goalies = []

    for r in rows[1:] if rows and len(rows) > 1 else []:
        if not any(str(c).strip() for c in r):
            continue

        rec = {}
        for idx, h in enumerate(headers):
            if h:
                rec[h] = str(r[idx]).strip() if idx < len(r) else ""

        pos_or_role = (
            rec.get("Pos") or rec.get("Position") or rec.get("Role") or rec.get("Type") or get_col(r, "F") or ""
        ).strip().upper()
        player_num = (
            rec.get("#") or rec.get("Player") or rec.get("Jersey") or rec.get("Goalie") or get_col(r, "E") or ""
        ).strip()

        game_val = (rec.get("Game") or get_col(r, "A") or "").strip()
        opp_val = (rec.get("Opponent") or get_col(r, "B") or "").strip()

        is_goalie = pos_or_role in ("G", "GOALIE") or bool(
            rec.get("SV %") or rec.get("SV%") or rec.get("Saves") or rec.get("GA")
        )
        is_game_row = bool(game_val) and bool(opp_val or player_num)

        if is_goalie and not is_game_row:
            goalies.append({
                "goalie": player_num or rec.get("Name", ""),
                "games": rec.get("Games") or rec.get("GP") or "",
                "saves": rec.get("Saves") or rec.get("SV") or "",
                "ga": rec.get("GA") or rec.get("Goals Against") or "",
                "svPct": rec.get("SV %") or rec.get("SV%") or "",
            })
            continue

        if is_game_row:
            is_absent = get_col(r, "L").lower() == "x"
            game_details.append({
                "game": game_val,
                "opponent": opp_val,
                "player": player_num,
                "absent": is_absent,
                "g": "-" if is_absent else to_int(get_col(r, "G")),
                "a": "-" if is_absent else to_int(get_col(r, "H")),
                "pts": "-" if is_absent else to_int(get_col(r, "I")),
                "plusMinus": "-" if is_absent else to_int(get_col(r, "J")),
                "pim": "-" if is_absent else to_int(get_col(r, "K")),
                "sog": "-" if is_absent else to_int(get_col(r, "M")),
                "fow": "-" if is_absent else to_int(get_col(r, "N")),
                "fol": "-" if is_absent else to_int(get_col(r, "O")),
                "fot": "-" if is_absent else to_int(get_col(r, "P")),
                "foPct": "-" if is_absent else get_col(r, "Q"),
                "sog1st": "-" if is_absent else to_int(get_col(r, "R")),
                "sog2nd": "-" if is_absent else to_int(get_col(r, "S")),
                "sog3rd": "-" if is_absent else to_int(get_col(r, "T")),
                "ppSog": "-" if is_absent else to_int(get_col(r, "U")),
            })

    return player_season_totals, goalie_season_totals, game_details, goalies, goalie_by_game


def parse_team_stats_tab(rows):
    """TeamStats -> Special Teams (PP rows 41-45, PK rows 49-51) and Summary (up to row 35 where Col C has a value)."""
    capped_rows = (rows or [])[:35]
    headers = [str(h).strip() for h in capped_rows[0]] if len(capped_rows) >= 2 else []
    summary = []

    for r in capped_rows[1:]:
        if not any(str(c).strip() for c in r):
            continue
        if not get_col(r, "C"):
            continue

        rec = {}
        for idx, h in enumerate(headers):
            if not h:
                continue
            rec[h] = str(r[idx]).strip() if idx < len(r) else ""

        game = (rec.get("Game") or "").strip()
        opp = (rec.get("Opponent") or "").strip()
        result = (rec.get("Result") or "").strip()
        if game or opp or result:
            summary.append({
                "game": game,
                "opponent": opp,
                "result": result,
                "shots": rec.get("Shots", ""),
                "faceoffs": get_col(r, "F"),
                "shotsDiff": get_col(r, "G"),
                "foDiff": get_col(r, "H"),
            })

    power_play = []
    for row_num in range(41, 46):
        label = get_cell(rows, row_num, "A")
        value = get_row_value(rows, row_num)
        if label != "" or value != "":
            power_play.append({"label": label, "value": value})

    penalty_kill = []
    for row_num in range(49, 52):
        label = get_cell(rows, row_num, "A")
        value = get_row_value(rows, row_num)
        if label != "" or value != "":
            penalty_kill.append({"label": label, "value": value})

    special_teams = {
        "powerPlay": power_play,
        "penaltyKill": penalty_kill,
    }
    return special_teams, summary


def parse_goals_for_tab(rows):
    """GoalsFor -> A: GAME, B: OPPONENT, C: GOAL TYPE, D: GOAL, E: ASSIST, F: ASSIST, G-I: FORWARD, J-K: DEFENCE."""
    goals_for = []
    if not rows or len(rows) <= 1:
        return goals_for

    for r in rows[1:]:
        if not any(str(c).strip() for c in r):
            continue
        game = normalize_game_key(get_col(r, "A"))
        opponent = get_col(r, "B")
        goal_type = get_col(r, "C")
        goal = get_col(r, "D")
        assist1 = get_col(r, "E")
        assist2 = get_col(r, "F")
        fwd1 = get_col(r, "G")
        fwd2 = get_col(r, "H")
        fwd3 = get_col(r, "I")
        def1 = get_col(r, "J")
        def2 = get_col(r, "K")

        if not any([game, opponent, goal_type, goal, assist1, assist2, fwd1, fwd2, fwd3, def1, def2]):
            continue

        goals_for.append({
            "game": game,
            "opponent": opponent,
            "goalType": goal_type,
            "goal": goal,
            "assist1": assist1,
            "assist2": assist2,
            "forward1": fwd1,
            "forward2": fwd2,
            "forward3": fwd3,
            "defence1": def1,
            "defence2": def2,
        })

    return goals_for


def parse_goals_against_tab(rows):
    """GoalsAgainst -> A: GAME, B: OPPONENT, C: GOAL TYPE; D-F empty; G-I: FORWARD, J-K: DEFENCE."""
    goals_against = []
    if not rows or len(rows) <= 1:
        return goals_against

    for r in rows[1:]:
        if not any(str(c).strip() for c in r):
            continue
        game = normalize_game_key(get_col(r, "A"))
        opponent = get_col(r, "B")
        goal_type = get_col(r, "C")
        fwd1 = get_col(r, "G")
        fwd2 = get_col(r, "H")
        fwd3 = get_col(r, "I")
        def1 = get_col(r, "J")
        def2 = get_col(r, "K")

        if not any([game, opponent, goal_type, fwd1, fwd2, fwd3, def1, def2]):
            continue

        goals_against.append({
            "game": game,
            "opponent": opponent,
            "goalType": goal_type,
            "forward1": fwd1,
            "forward2": fwd2,
            "forward3": fwd3,
            "defence1": def1,
            "defence2": def2,
        })

    return goals_against


def parse_scoring_tabs(goals_for_list, goals_against_list):
    """Combined list kept for backward compatibility if referenced anywhere."""
    scoring = []
    for gf in goals_for_list:
        assists = ", ".join([x for x in (gf.get("assist1"), gf.get("assist2")) if x])
        scoring.append({
            "direction": "Goal For",
            "game": normalize_game_key(gf.get("game", "")),
            "opponent": gf.get("opponent", ""),
            "period": "",
            "time": "",
            "player": gf.get("goal", ""),
            "assists": assists,
            "situation": gf.get("goalType", ""),
        })
    for ga in goals_against_list:
        scoring.append({
            "direction": "Goal Against",
            "game": normalize_game_key(ga.get("game", "")),
            "opponent": ga.get("opponent", ""),
            "period": "",
            "time": "",
            "player": "",
            "assists": "",
            "situation": ga.get("goalType", ""),
        })
    return scoring


def build_goalies_game_by_game(summary, goalie_by_game=None):
    """Build Game by Game rows (10 cols) with per-goalie V, W, X data from PlayerStats."""
    by_game = goalie_by_game or {}
    goalie_game_by_game = []
    for row in summary or []:
        game_val = str(row.get("game", "")).strip()
        game_key = normalize_game_key(game_val)
        opp_val = str(row.get("opponent", "")).strip()
        if not game_val or not opp_val:
            continue
        raw_res = str(row.get("result", "")).strip()
        result_label, parsed_score = parse_game_result_and_score(raw_res)

        game_goalies = by_game.get(game_key) or by_game.get(game_val) or {}
        g30 = game_goalies.get("30", {})
        g33 = game_goalies.get("33", {})

        goalie_game_by_game.append({
            "game": game_val,
            "opponent": opp_val,
            "result": result_label,
            "results": result_label,
            "score": parsed_score or raw_res,
            "g30Sv": g30.get("sv", ""),
            "g30Ga": g30.get("ga", ""),
            "g30SvPct": g30.get("svPct", ""),
            "g33Sv": g33.get("sv", ""),
            "g33Ga": g33.get("ga", ""),
            "g33SvPct": g33.get("svPct", ""),
        })

    return goalie_game_by_game


def _parse_signed_int(val):
    s = str(val or "").strip().replace("+", "")
    if not s:
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def _sum_game_period_shots(game_player_rows, field):
    total = 0
    has_any = False
    for r in game_player_rows:
        v = r.get(field)
        if isinstance(v, int):
            total += v
            has_any = True
        elif isinstance(v, str) and v.strip().lstrip("-").isdigit():
            total += int(v.strip())
            has_any = True
    return total if has_any else None


def _format_skater_label(num):
    s = str(num or "").strip()
    if not s:
        return ""
    return s if s.startswith("#") else f"#{s}"


def _collect_on_ice(row):
    skaters = []
    for k in ("forward1", "forward2", "forward3", "defence1", "defence2"):
        val = str(row.get(k, "")).strip()
        if val:
            skaters.append(_format_skater_label(val))
    return skaters


def _build_scoring_summary_for_game(g_gf, g_ga):
    gf_items = []
    for row in g_gf or []:
        assists = [
            _format_skater_label(row.get("assist1", "")),
            _format_skater_label(row.get("assist2", "")),
        ]
        assists = [a for a in assists if a]
        gf_items.append({
            "goalType": str(row.get("goalType", "")).strip() or "EV",
            "goal": _format_skater_label(row.get("goal", "")),
            "assists": assists,
            "onIce": _collect_on_ice(row),
        })

    ga_items = []
    for row in g_ga or []:
        ga_items.append({
            "goalType": str(row.get("goalType", "")).strip() or "EV",
            "onIce": _collect_on_ice(row),
        })

    return {
        "goalsFor": gf_items,
        "goalsAgainst": ga_items,
    }


def _compute_game_signals_and_fallback(game_ctx):
    game_val = game_ctx["game"]
    opp = game_ctx["opponent"]
    result_code = game_ctx["result"]
    score_str = game_ctx["score"]
    shots_str = game_ctx["shots"]
    fo_str = game_ctx["faceoffs"]
    sog_diff = game_ctx["sogDiff"]
    fo_diff = game_ctx["foDiff"]
    p1, p2, p3 = game_ctx["sog1st"], game_ctx["sog2nd"], game_ctx["sog3rd"]
    pp_gf = game_ctx["ppGoalsFor"]
    sh_gf = game_ctx["shGoalsFor"]
    pp_ga = game_ctx["ppGoalsAgainst"]
    gf_count = game_ctx["goalsForCount"]
    ga_count = game_ctx["goalsAgainstCount"]
    goalies_active = game_ctx["goaliesActive"]

    signals = {
        "result": result_code,
        "score": score_str,
        "shots": shots_str,
        "sogDiff": sog_diff,
        "sogEdge": "strong_for" if (sog_diff is not None and sog_diff >= 6) else (
            "strong_against" if (sog_diff is not None and sog_diff <= -6) else "even_or_tight"
        ),
        "faceoffs": fo_str,
        "foDiff": fo_diff,
        "foEdge": "strong_for" if (fo_diff is not None and fo_diff >= 5) else (
            "strong_against" if (fo_diff is not None and fo_diff <= -5) else "even_or_tight"
        ),
        "periodShots": {"p1": p1, "p2": p2, "p3": p3},
        "goalsForCount": gf_count,
        "goalsAgainstCount": ga_count,
        "ppGoalsFor": pp_gf,
        "shGoalsFor": sh_gf,
        "ppGoalsAgainst": pp_ga,
        "goalies": goalies_active,
    }

    points_and_takeaways = []
    practice_focus = []

    if sog_diff is not None:
        if sog_diff >= 6:
            points_and_takeaways.append(
                f"Generated a decisive shot advantage ({shots_str or 'N/A'}, {sog_diff:+d} SOG diff) in a {result_code or 'game'} ({score_str})."
            )
        elif sog_diff <= -6:
            points_and_takeaways.append(
                f"Absorbed a heavy shot deficit ({shots_str or 'N/A'}, {sog_diff:+d} SOG diff) in a {score_str} {result_code or 'result'}."
            )
        else:
            points_and_takeaways.append(
                f"Contested an even shot battle ({shots_str or 'N/A'}, {sog_diff:+d} SOG diff) resulting in a {score_str} {result_code or 'game'}."
            )
    else:
        points_and_takeaways.append(f"Finished Game {game_val} vs {opp} ({result_code or 'Result'} {score_str}).")

    if fo_diff is not None and fo_str:
        if fo_diff >= 5:
            points_and_takeaways.append(f"Controlled faceoffs ({fo_str}, {fo_diff:+d} FO diff) to support cleaner puck possession.")
        elif fo_diff <= -5:
            points_and_takeaways.append(f"Dropped the faceoff battle ({fo_str}, {fo_diff:+d} FO diff), forcing extra puck pursuit.")
            practice_focus.append("Run faceoff-win & support-wing breakout drills from both offensive and defensive circles.")

    if pp_gf > 0 or sh_gf > 0:
        st_bits = []
        if pp_gf > 0:
            st_bits.append(f"{pp_gf} PP goal{'s' if pp_gf != 1 else ''}")
        if sh_gf > 0:
            st_bits.append(f"{sh_gf} SH goal{'s' if sh_gf != 1 else ''}")
        points_and_takeaways.append(f"Special teams contributed {', '.join(st_bits)} for.")

    for g in goalies_active:
        pct_txt = f" ({g['svPct']} SV%)" if g.get("svPct") else ""
        points_and_takeaways.append(
            f"Goalie #{g['goalie']} stopped {g.get('sv') or 0} of {(to_int(g.get('sv')) + to_int(g.get('ga')))} shots ({g.get('ga') or 0} GA){pct_txt}."
        )

    if p1 is not None and p2 is not None and p3 is not None:
        if p1 < min(p2, p3):
            practice_focus.append(
                f"Address slow starts—1st-period shots ({p1}) trailed later periods ({p2} in 2nd, {p3} in 3rd); focus on early pace and first-shift execution."
            )
        elif p3 > max(p1, p2):
            points_and_takeaways.append(
                f"Finished strong on the shot clock in the 3rd period ({p3} SOG vs. {p1} in 1st and {p2} in 2nd)."
            )

    if pp_ga > 0:
        practice_focus.append(
            f"Review penalty-kill structure, lane discipline, and first clears after allowing {pp_ga} PP goal{'s' if pp_ga != 1 else ''}."
        )

    if ga_count >= 4 or (sog_diff is not None and sog_diff <= -6):
        practice_focus.append(
            "Emphasize defensive-zone coverage, net-front boxing out, and controlled exits under pressure."
        )

    if not practice_focus:
        practice_focus.append(
            "Reinforce puck support, crisp tape-to-tape transitions, and net-front traffic on 5v5 entries."
        )

    return signals, points_and_takeaways, practice_focus


def _compute_season_signals_and_fallback(games_ctx, kpis, player_season_totals, special_teams):
    total_games = len(games_ctx)
    sog_diffs = [g["sogDiff"] for g in games_ctx if g["sogDiff"] is not None]
    fo_diffs = [g["foDiff"] for g in games_ctx if g["foDiff"] is not None]
    avg_sog_diff = round(sum(sog_diffs) / len(sog_diffs), 1) if sog_diffs else None
    avg_fo_diff = round(sum(fo_diffs) / len(fo_diffs), 1) if fo_diffs else None

    slow_starts = sum(
        1
        for g in games_ctx
        if g["sog1st"] is not None
        and g["sog2nd"] is not None
        and g["sog3rd"] is not None
        and g["sog1st"] < min(g["sog2nd"], g["sog3rd"])
    )
    high_ga_games = sum(1 for g in games_ctx if g["goalsAgainstCount"] >= 4)
    total_pp_gf = sum(g["ppGoalsFor"] for g in games_ctx)
    total_pp_ga = sum(g["ppGoalsAgainst"] for g in games_ctx)

    top_scorers = [
        f"#{p['player']} ({p['pts']} PTS: {p['g']}G, {p['a']}A)"
        for p in (player_season_totals or [])[:3]
    ]

    season_signals = {
        "gamesTracked": total_games,
        "record": kpis.get("record", "-"),
        "goalsScoredAgainst": kpis.get("goalsScoredAgainst", "-"),
        "totalPowerPlayTime": kpis.get("totalPowerPlayTime", "-"),
        "powerPlayGoalsScored": kpis.get("powerPlayGoalsScored", "-"),
        "avgSogDiff": avg_sog_diff,
        "avgFoDiff": avg_fo_diff,
        "slowStartGames": slow_starts,
        "highGaGames": high_ga_games,
        "totalPpGoalsFor": total_pp_gf,
        "totalPpGoalsAgainst": total_pp_ga,
        "topScorers": top_scorers,
    }

    highlights = [
        f"Current record stands at {kpis.get('record', '-')} with {kpis.get('goalsScoredAgainst', '-')} (GF - GA) across {total_games} tracked games.",
        f"Power-play unit has logged {kpis.get('totalPowerPlayTime', '-')} of PP time with {kpis.get('powerPlayGoalsScored', '-')} PP goals for.",
    ]
    if top_scorers:
        highlights.append("Top offensive producers so far: " + ", ".join(top_scorers) + ".")
    if avg_sog_diff is not None and avg_sog_diff > 0:
        highlights.append(f"Averaging a {avg_sog_diff:+.1f} shot differential per game.")
    if avg_fo_diff is not None and avg_fo_diff > 0:
        highlights.append(f"Averaging a {avg_fo_diff:+.1f} faceoff differential per game.")

    improvements = []
    if avg_sog_diff is not None and avg_sog_diff < 0:
        improvements.append(f"Average shot differential sits at {avg_sog_diff:+.1f} per game—prioritize shot volume and territorial control.")
    if avg_fo_diff is not None and avg_fo_diff < 0:
        improvements.append(f"Average faceoff differential sits at {avg_fo_diff:+.1f} per game—sharpen draw execution and support timing.")
    if slow_starts > 0:
        improvements.append(f"Slow starts appeared in {slow_starts} game{'s' if slow_starts != 1 else ''} (lowest shot output in the 1st period).")
    if high_ga_games > 0 or total_pp_ga > 0:
        improvements.append(
            f"Cut down defensive leaks ({high_ga_games} game{'s' if high_ga_games != 1 else ''} with 4+ GA; {total_pp_ga} PP goal{'s' if total_pp_ga != 1 else ''} against)."
        )
    if not improvements:
        improvements.append("Maintain consistent 60-minute effort, disciplined puck management, and net-front execution.")

    return season_signals, highlights, improvements


def _payload_hash(obj):
    raw = json.dumps(obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _load_existing_coaches_corner():
    if not os.path.exists("data.json"):
        return {}, {}
    try:
        with open("data.json", "r", encoding="utf-8") as f:
            existing = json.load(f)
        cc = existing.get("coachesCorner") or {}
        game_cache = {}
        for g in cc.get("games") or []:
            gk = normalize_game_key(g.get("game", ""))
            if gk and g.get("_hash"):
                game_cache[gk] = g
        season_cache = cc.get("seasonAnalysis") or {}
        return season_cache, game_cache
    except Exception:
        return {}, {}


def _polish_with_gemini(client, model_name, prompt):
    config_kwargs = {
        "response_mime_type": "application/json",
        "temperature": 0.35,
    }
    if types is not None:
        config = types.GenerateContentConfig(**config_kwargs)
    else:
        config = config_kwargs

    resp = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=config,
    )
    txt = (getattr(resp, "text", None) or "").strip()
    if not txt:
        raise ValueError("Empty response from Gemini")
    # Strip markdown code fences if present
    txt = re.sub(r"^```(?:json)?\s*|\s*```$", "", txt, flags=re.IGNORECASE | re.DOTALL).strip()
    return json.loads(txt)


def build_coaches_corner(
    summary,
    kpis,
    player_season_totals,
    game_details,
    goals_for,
    goals_against,
    goalie_season_totals,
    goalie_game_by_game,
    special_teams,
):
    gf_by_game = {}
    for row in goals_for or []:
        gk = normalize_game_key(row.get("game", ""))
        if gk:
            gf_by_game.setdefault(gk, []).append(row)

    ga_by_game = {}
    for row in goals_against or []:
        gk = normalize_game_key(row.get("game", ""))
        if gk:
            ga_by_game.setdefault(gk, []).append(row)

    players_by_game = {}
    for row in game_details or []:
        p_num = str(row.get("player", "")).lstrip("#").strip()
        if p_num in ("30", "33"):
            continue
        gk = normalize_game_key(row.get("game", ""))
        if gk:
            players_by_game.setdefault(gk, []).append(row)

    goalie_gb_by_game = {}
    for row in goalie_game_by_game or []:
        gk = normalize_game_key(row.get("game", ""))
        if gk:
            goalie_gb_by_game[gk] = row

    prev_season, prev_games = _load_existing_coaches_corner()

    api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    model_name = (os.environ.get("GEMINI_MODEL") or DEFAULT_GEMINI_MODEL).strip()
    gemini_client = None
    if api_key and genai is not None:
        try:
            gemini_client = genai.Client(api_key=api_key)
        except Exception as exc:
            print(f"[CoachesCorner] Could not initialize Gemini client: {exc}")
            gemini_client = None

    games_ctx = []
    for s in summary or []:
        game_val = str(s.get("game", "")).strip()
        gk = normalize_game_key(game_val)
        opp = str(s.get("opponent", "")).strip()
        result_code, score_str = parse_game_result_and_score(s.get("result", ""))
        if not game_val and not opp:
            continue

        g_gf = gf_by_game.get(gk, [])
        g_ga = ga_by_game.get(gk, [])
        g_players = players_by_game.get(gk, [])
        g_goalies = goalie_gb_by_game.get(gk, {})

        active_goalies = []
        for g_num, prefix in (("30", "g30"), ("33", "g33")):
            sv_raw = str(g_goalies.get(f"{prefix}Sv", "")).strip()
            ga_raw = str(g_goalies.get(f"{prefix}Ga", "")).strip()
            pct_raw = str(g_goalies.get(f"{prefix}SvPct", "")).strip()
            if sv_raw != "" or ga_raw != "":
                active_goalies.append({
                    "goalie": g_num,
                    "sv": sv_raw,
                    "ga": ga_raw,
                    "svPct": pct_raw,
                })

        pp_gf = sum(1 for r in g_gf if "pp" in str(r.get("goalType", "")).lower())
        sh_gf = sum(1 for r in g_gf if "sh" in str(r.get("goalType", "")).lower())
        pp_ga = sum(1 for r in g_ga if "pp" in str(r.get("goalType", "")).lower())

        games_ctx.append({
            "key": gk,
            "game": game_val,
            "opponent": opp,
            "result": result_code,
            "score": score_str,
            "shots": str(s.get("shots", "")).strip(),
            "faceoffs": str(s.get("faceoffs", "")).strip(),
            "sogDiff": _parse_signed_int(s.get("shotsDiff")),
            "foDiff": _parse_signed_int(s.get("foDiff")),
            "sog1st": _sum_game_period_shots(g_players, "sog1st"),
            "sog2nd": _sum_game_period_shots(g_players, "sog2nd"),
            "sog3rd": _sum_game_period_shots(g_players, "sog3rd"),
            "goalsForCount": len(g_gf),
            "goalsAgainstCount": len(g_ga),
            "ppGoalsFor": pp_gf,
            "shGoalsFor": sh_gf,
            "ppGoalsAgainst": pp_ga,
            "goaliesActive": active_goalies,
            "scoringSummary": _build_scoring_summary_for_game(g_gf, g_ga),
        })

    games_out = []
    for g_ctx in games_ctx:
        gk = g_ctx["key"]
        signals, fb_points, fb_practice = _compute_game_signals_and_fallback(g_ctx)
        h = _payload_hash({"signals": signals, "scoringSummary": g_ctx["scoringSummary"], "model": model_name})

        cached = prev_games.get(gk)
        if cached and cached.get("_hash") == h and cached.get("keyPointsAndTakeaways") and cached.get("practiceAndTacticalFocus"):
            games_out.append({
                "game": g_ctx["game"],
                "opponent": g_ctx["opponent"],
                "result": g_ctx["result"],
                "score": g_ctx["score"],
                "scoringSummary": g_ctx["scoringSummary"],
                "keyPointsAndTakeaways": cached["keyPointsAndTakeaways"],
                "practiceAndTacticalFocus": cached["practiceAndTacticalFocus"],
                "_hash": h,
            })
            continue

        points_list = fb_points
        practice_list = fb_practice

        if gemini_client is not None:
            prompt = (
                "You are a youth U14A ice hockey coaching assistant for the Wolverines. "
                "Using ONLY the computed game signals and scoring facts below, write concise, practical coaching bullets. "
                "Do not invent statistics not present in the input.\n"
                "Return strict JSON matching this schema:\n"
                '{"keyPointsAndTakeaways": ["..."], "practiceAndTacticalFocus": ["..."]}\n'
                "Keep each array to 2-4 crisp, actionable bullets.\n\n"
                f"Game: {g_ctx['game']} vs {g_ctx['opponent']}\n"
                f"Signals: {json.dumps(signals, ensure_ascii=False)}\n"
                f"Scoring Summary: {json.dumps(g_ctx['scoringSummary'], ensure_ascii=False)}"
            )
            try:
                parsed = _polish_with_gemini(gemini_client, model_name, prompt)
                p_items = [str(x).strip() for x in (parsed.get("keyPointsAndTakeaways") or []) if str(x).strip()]
                t_items = [str(x).strip() for x in (parsed.get("practiceAndTacticalFocus") or []) if str(x).strip()]
                if p_items and t_items:
                    points_list = p_items
                    practice_list = t_items
            except Exception as exc:
                print(f"[CoachesCorner] Game {g_ctx['game']} fallback to signals: {exc}")

        games_out.append({
            "game": g_ctx["game"],
            "opponent": g_ctx["opponent"],
            "result": g_ctx["result"],
            "score": g_ctx["score"],
            "scoringSummary": g_ctx["scoringSummary"],
            "keyPointsAndTakeaways": points_list,
            "practiceAndTacticalFocus": practice_list,
            "_hash": h,
        })

    season_signals, fb_highlights, fb_improvements = _compute_season_signals_and_fallback(
        games_ctx, kpis, player_season_totals, special_teams
    )
    season_hash = _payload_hash({"seasonSignals": season_signals, "model": model_name})

    if (
        prev_season.get("_hash") == season_hash
        and prev_season.get("keyHighlights")
        and prev_season.get("pointsOfImprovement")
    ):
        season_analysis = {
            "keyHighlights": prev_season["keyHighlights"],
            "pointsOfImprovement": prev_season["pointsOfImprovement"],
            "_hash": season_hash,
        }
    else:
        highlights_out = fb_highlights
        improvements_out = fb_improvements

        if gemini_client is not None:
            prompt = (
                "You are a youth U14A ice hockey coaching assistant for the Wolverines. "
                "Using ONLY the season summary signals below, write two concise coaching sections:\n"
                "1. keyHighlights: What's working well (record, scoring, special teams, shot/faceoff trends, top contributors).\n"
                "2. pointsOfImprovement: Where to focus (defensive/faceoff/period/special-team trends).\n"
                "Do not invent numbers or facts not in the input.\n"
                "Return strict JSON matching this schema:\n"
                '{"keyHighlights": ["..."], "pointsOfImprovement": ["..."]}\n'
                "Keep each array to 3-5 clear, concise bullets.\n\n"
                f"Season Signals: {json.dumps(season_signals, ensure_ascii=False)}"
            )
            try:
                parsed = _polish_with_gemini(gemini_client, model_name, prompt)
                h_items = [str(x).strip() for x in (parsed.get("keyHighlights") or []) if str(x).strip()]
                i_items = [str(x).strip() for x in (parsed.get("pointsOfImprovement") or []) if str(x).strip()]
                if h_items and i_items:
                    highlights_out = h_items
                    improvements_out = i_items
            except Exception as exc:
                print(f"[CoachesCorner] Season analysis fallback to signals: {exc}")

        season_analysis = {
            "keyHighlights": highlights_out,
            "pointsOfImprovement": improvements_out,
            "_hash": season_hash,
        }

    def _game_sort_key(item):
            gk = normalize_game_key(item.get("game", ""))
            if gk.isdigit():
                return (0, int(gk))
            return (1, gk)

    games_out.sort(key=_game_sort_key, reverse=True)

    return {
        "seasonAnalysis": season_analysis,
        "games": games_out,
    }


def main():
    spreadsheet_id = os.environ.get("SPREADSHEET_ID") or DEFAULT_SPREADSHEET_ID
    tabs = fetch_all_tabs(spreadsheet_id, TAB_NAMES)

    player_season_totals, goalie_season_totals, game_details, goalies, goalie_by_game = parse_player_stats_tab(
        tabs.get("PlayerStats", [])
    )
    special_teams, summary = parse_team_stats_tab(tabs.get("TeamStats", []))
    goalie_game_by_game = build_goalies_game_by_game(summary, goalie_by_game)
    kpis = compute_kpis(
        tabs.get("TeamStats", []),
        tabs.get("GoalsFor", []),
        tabs.get("GoalsAgainst", []),
    )
    goals_for = parse_goals_for_tab(tabs.get("GoalsFor", []))
    goals_against = parse_goals_against_tab(tabs.get("GoalsAgainst", []))
    scoring = parse_scoring_tabs(goals_for, goals_against)
    coaches_corner = build_coaches_corner(
        summary=summary,
        kpis=kpis,
        player_season_totals=player_season_totals,
        game_details=game_details,
        goals_for=goals_for,
        goals_against=goals_against,
        goalie_season_totals=goalie_season_totals,
        goalie_game_by_game=goalie_game_by_game,
        special_teams=special_teams,
    )

    payload = {
        "meta": {
            "team": "Wolverines",
            "subtitle": "U14A (2013)",
            "spreadsheetId": spreadsheet_id,
            "tabs": SHEET_TABS,
            "gamesPlayed": len(summary),
        },
        "kpis": kpis,
        "playerSeasonTotals": player_season_totals,
        "gameDetails": game_details,
        "goalsFor": goals_for,
        "goalsAgainst": goals_against,
        "scoring": scoring,
        "specialTeams": special_teams,
        "goalies": goalies,
        "goalieSeasonTotals": goalie_season_totals,
        "goalieGameByGame": goalie_game_by_game,
        "summary": summary,
        "coachesCorner": coaches_corner,
    }

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    matched_g33 = sum(1 for r in goalie_game_by_game if r.get("g33Sv") != "")
    matched_g30 = sum(1 for r in goalie_game_by_game if r.get("g30Sv") != "")
    print(
        f"Wrote data.json: {len(player_season_totals)} players, {len(game_details)} game detail rows, "
        f"{len(goals_for)} goals for, {len(goals_against)} goals against, "
        f"{len(goalies)} goalies, {len(summary)} summary rows "
        f"(goalie game rows: #30={matched_g30}, #33={matched_g33})."
    )


if __name__ == "__main__":
    main()