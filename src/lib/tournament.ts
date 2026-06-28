import { groupIds, groupMatches, groups, teams } from "../data/tournament";
import type {
  GroupId,
  KnockoutPrediction,
  KnockoutSlot,
  Predictions,
  Standing,
  Team,
} from "../types";

type Seed =
  | `W${GroupId}`
  | `R${GroupId}`
  | `3:${string}`
  | `TEAM:${string}`
  | `WIN:${number}`
  | `LOS:${number}`;

type KnockoutDefinition = {
  id: string;
  phase: KnockoutSlot["phase"];
  title: string;
  date: string;
  timeCO: string;
  venue: string;
  homeSeed: Seed;
  awaySeed: Seed;
  sourceHome: string;
  sourceAway: string;
};

const teamById = new Map(teams.map((team) => [team.id, team]));

const knockoutDefinitions: KnockoutDefinition[] = [
  game(73, "round32", "Partido 73", "2026-06-28", "14:00", "Los Angeles Stadium", "TEAM:south-africa", "TEAM:canada", "Sudáfrica", "Canada"),
  game(74, "round32", "Partido 74", "2026-06-29", "15:30", "Boston Stadium", "TEAM:germany", "TEAM:paraguay", "Alemania", "Paraguay"),
  game(75, "round32", "Partido 75", "2026-06-29", "20:00", "Estadio Monterrey", "TEAM:netherlands", "TEAM:morocco", "Países Bajos", "Marruecos"),
  game(76, "round32", "Partido 76", "2026-06-29", "12:00", "Houston Stadium", "TEAM:brazil", "TEAM:japan", "Brazil", "Japan"),
  game(77, "round32", "Partido 77", "2026-06-30", "16:00", "New York New Jersey Stadium", "TEAM:france", "TEAM:sweden", "Francia", "Suecia"),
  game(78, "round32", "Partido 78", "2026-06-30", "12:00", "Dallas Stadium", "TEAM:ivory-coast", "TEAM:norway", "Costa de Marfil", "Noruega"),
  game(79, "round32", "Partido 79", "2026-06-30", "20:00", "Estadio Ciudad de México", "TEAM:mexico", "TEAM:ecuador", "México", "Ecuador"),
  game(80, "round32", "Partido 80", "2026-07-01", "11:00", "Atlanta Stadium", "TEAM:england", "TEAM:dr-congo", "Inglaterra", "RD Congo"),
  game(81, "round32", "Partido 81", "2026-07-01", "19:00", "San Francisco Bay Area Stadium", "TEAM:united-states", "TEAM:bosnia", "Estados Unidos", "Bosnia y Herzegovina"),
  game(82, "round32", "Partido 82", "2026-07-01", "14:00", "Seattle Stadium", "TEAM:belgium", "TEAM:senegal", "Bélgica", "Senegal"),
  game(83, "round32", "Partido 83", "2026-07-02", "18:00", "Toronto Stadium", "TEAM:portugal", "TEAM:croatia", "Portugal", "Croacia"),
  game(84, "round32", "Partido 84", "2026-07-02", "14:00", "Los Angeles Stadium", "TEAM:spain", "TEAM:austria", "España", "Austria"),
  game(85, "round32", "Partido 85", "2026-07-02", "22:00", "BC Place, Vancouver", "TEAM:switzerland", "TEAM:algeria", "Suiza", "Argelia"),
  game(86, "round32", "Partido 86", "2026-07-03", "17:00", "Miami Stadium", "TEAM:argentina", "TEAM:cape-verde", "Argentina", "Cabo Verde"),
  game(87, "round32", "Partido 87", "2026-07-03", "20:30", "Kansas City Stadium", "TEAM:colombia", "TEAM:ghana", "Colombia", "Ghana"),
  game(88, "round32", "Partido 88", "2026-07-03", "13:00", "Dallas Stadium", "TEAM:australia", "TEAM:egypt", "Australia", "Egipto"),
  game(89, "round16", "Partido 89", "2026-07-04", "16:00", "Philadelphia Stadium", "WIN:74", "WIN:77", "Ganador Partido 74", "Ganador Partido 77"),
  game(90, "round16", "Partido 90", "2026-07-04", "12:00", "Houston Stadium", "WIN:73", "WIN:75", "Ganador Partido 73", "Ganador Partido 75"),
  game(91, "round16", "Partido 91", "2026-07-05", "14:00", "New York New Jersey Stadium", "WIN:76", "WIN:78", "Ganador Partido 76", "Ganador Partido 78"),
  game(92, "round16", "Partido 92", "2026-07-05", "19:00", "Estadio Azteca Ciudad de México", "WIN:79", "WIN:80", "Ganador Partido 79", "Ganador Partido 80"),
  game(93, "round16", "Partido 93", "2026-07-06", "14:00", "Dallas Stadium", "WIN:83", "WIN:84", "Ganador Partido 83", "Ganador Partido 84"),
  game(94, "round16", "Partido 94", "2026-07-06", "19:00", "Seattle Stadium", "WIN:81", "WIN:82", "Ganador Partido 81", "Ganador Partido 82"),
  game(95, "round16", "Partido 95", "2026-07-07", "11:00", "Atlanta Stadium", "WIN:86", "WIN:88", "Ganador Partido 86", "Ganador Partido 88"),
  game(96, "round16", "Partido 96", "2026-07-07", "15:00", "BC Place, Vancouver", "WIN:85", "WIN:87", "Ganador Partido 85", "Ganador Partido 87"),
  game(97, "quarter", "Partido 97", "2026-07-09", "14:00", "Boston Stadium", "WIN:89", "WIN:90", "Ganador Partido 89", "Ganador Partido 90"),
  game(98, "quarter", "Partido 98", "2026-07-10", "14:00", "Los Angeles Stadium", "WIN:93", "WIN:94", "Ganador Partido 93", "Ganador Partido 94"),
  game(99, "quarter", "Partido 99", "2026-07-11", "16:00", "Miami Stadium", "WIN:91", "WIN:92", "Ganador Partido 91", "Ganador Partido 92"),
  game(100, "quarter", "Partido 100", "2026-07-11", "20:00", "Kansas City Stadium", "WIN:95", "WIN:96", "Ganador Partido 95", "Ganador Partido 96"),
  game(101, "semi", "Partido 101", "2026-07-14", "14:00", "Dallas Stadium", "WIN:97", "WIN:98", "Ganador Partido 97", "Ganador Partido 98"),
  game(102, "semi", "Partido 102", "2026-07-15", "14:00", "Atlanta Stadium", "WIN:99", "WIN:100", "Ganador Partido 99", "Ganador Partido 100"),
  game(103, "third", "Partido 103 - Tercer puesto", "2026-07-18", "16:00", "Miami Stadium", "LOS:101", "LOS:102", "Perdedor Partido 101", "Perdedor Partido 102"),
  game(104, "final", "Partido 104 - Final", "2026-07-19", "14:00", "Nueva York Nueva Jersey Stadium", "WIN:101", "WIN:102", "Ganador Partido 101", "Ganador Partido 102"),
];

export function getTeam(id?: string): Team | undefined {
  return id ? teamById.get(id) : undefined;
}

export function calculateStandings(predictions: Predictions): Record<GroupId, Standing[]> {
  const result = {} as Record<GroupId, Standing[]>;
  for (const groupId of groupIds) {
    const rows = new Map<string, Standing>(
      groups[groupId].map((team) => [
        team.id,
        { team, played: 0, wins: 0, draws: 0, losses: 0, points: 0 },
      ]),
    );

    for (const match of groupMatches.filter((candidate) => candidate.group === groupId)) {
      const pick = predictions.group[match.id];
      if (!pick) continue;
      const home = rows.get(match.home)!;
      const away = rows.get(match.away)!;
      home.played += 1;
      away.played += 1;
      if (pick === "draw") {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      } else if (pick === "home") {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      }
    }

    result[groupId] = applyManualOrder(
      [...rows.values()],
      predictions.manualOrders[groupId] ?? [],
    );
  }
  return result;
}

export function hasPointTies(rows: Standing[]): boolean {
  const counts = rows.reduce<Record<number, number>>((acc, row) => {
    acc[row.points] = (acc[row.points] ?? 0) + 1;
    return acc;
  }, {});
  return Object.values(counts).some((count) => count > 1);
}

export function thirdPlaceTable(
  standings: Record<GroupId, Standing[]>,
  manualOrder: string[] = [],
): Standing[] {
  const thirds = groupIds.map((groupId) => standings[groupId][2]).filter(Boolean);
  return applyManualOrder(thirds, manualOrder);
}

export function buildKnockout(predictions: Predictions): KnockoutSlot[] {
  const standings = calculateStandings(predictions);
  const thirdRows = thirdPlaceTable(standings, predictions.manualOrders.thirds);
  const completedGroups = new Set(
    groupIds.filter((groupId) =>
      groupMatches
        .filter((match) => match.group === groupId)
        .every((match) => predictions.group[match.id]),
    ),
  );
  const allGroupsComplete = completedGroups.size === groupIds.length;
  const qualifiedThirds = allGroupsComplete ? thirdRows.slice(0, 8).map((row) => row.team) : [];
  const takenThirds = new Set<GroupId>();
  const built = new Map<string, KnockoutSlot>();

  const slots = knockoutDefinitions.map((definition) => {
    const home = resolveSeed(
      definition.homeSeed,
      standings,
      completedGroups,
      qualifiedThirds,
      takenThirds,
      built,
      predictions.knockout,
    );
    const away = resolveSeed(
      definition.awaySeed,
      standings,
      completedGroups,
      qualifiedThirds,
      takenThirds,
      built,
      predictions.knockout,
    );
    const slot: KnockoutSlot = {
      id: definition.id,
      phase: definition.phase,
      title: definition.title,
      date: definition.date,
      timeCO: definition.timeCO,
      venue: definition.venue,
      home,
      away,
      sourceHome: definition.sourceHome,
      sourceAway: definition.sourceAway,
    };
    slot.winner = winner(slot, predictions.knockout);
    built.set(slot.id, slot);
    return slot;
  });

  return slots;
}

export function completedCount(predictions: Predictions) {
  const knockout = buildKnockout(predictions);
  return Object.keys(predictions.group).length + Object.keys(predictions.knockout).filter((id) => {
    const match = knockout.find((slot) => slot.id === id);
    return match?.home && match.away;
  }).length;
}

export function totalAvailableMatches(predictions: Predictions) {
  const playableKnockouts = buildKnockout(predictions).filter((slot) => slot.home && slot.away).length;
  return groupMatches.length + playableKnockouts;
}

export function winner(slot: KnockoutSlot, picks: Record<string, KnockoutPrediction>) {
  if (!slot.home || !slot.away) return undefined;
  const pick = picks[slot.id];
  if (pick === "home") return slot.home;
  if (pick === "away") return slot.away;
  return undefined;
}

function loser(slot: KnockoutSlot | undefined, picks: Record<string, KnockoutPrediction>) {
  if (!slot?.home || !slot.away) return undefined;
  const pick = picks[slot.id];
  if (pick === "home") return slot.away;
  if (pick === "away") return slot.home;
  return undefined;
}

function resolveSeed(
  seed: Seed,
  standings: Record<GroupId, Standing[]>,
  completedGroups: Set<GroupId>,
  qualifiedThirds: Team[],
  takenThirds: Set<GroupId>,
  built: Map<string, KnockoutSlot>,
  picks: Record<string, KnockoutPrediction>,
) {
  if (seed.startsWith("WIN:")) return winner(built.get(seed.slice(4))!, picks);
  if (seed.startsWith("LOS:")) return loser(built.get(seed.slice(4)), picks);
  if (seed.startsWith("TEAM:")) return getTeam(seed.slice(5));
  if (seed.startsWith("3:")) {
    const allowed = seed.slice(2).split("") as GroupId[];
    const candidate = qualifiedThirds.find(
      (team) => allowed.includes(team.group) && !takenThirds.has(team.group),
    );
    if (candidate) takenThirds.add(candidate.group);
    return candidate;
  }

  const rank = seed[0] === "W" ? 0 : 1;
  const groupId = seed[1] as GroupId;
  if (!completedGroups.has(groupId)) return undefined;
  return standings[groupId][rank]?.team;
}

function applyManualOrder(rows: Standing[], manualOrder: string[]): Standing[] {
  const manualRank = new Map(manualOrder.map((id, index) => [id, index]));
  return rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const manualA = manualRank.get(a.team.id);
    const manualB = manualRank.get(b.team.id);
    if (manualA !== undefined && manualB !== undefined) return manualA - manualB;
    if (manualA !== undefined) return -1;
    if (manualB !== undefined) return 1;
    return a.team.position - b.team.position;
  });
}

function game(
  id: number,
  phase: KnockoutSlot["phase"],
  title: string,
  date: string,
  timeCO: string,
  venue: string,
  homeSeed: Seed,
  awaySeed: Seed,
  sourceHome: string,
  sourceAway: string,
): KnockoutDefinition {
  return {
    id: String(id),
    phase,
    title,
    date,
    timeCO,
    venue,
    homeSeed,
    awaySeed,
    sourceHome,
    sourceAway,
  };
}
