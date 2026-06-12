export type Phase =
  | "group"
  | "round32"
  | "round16"
  | "quarter"
  | "semi"
  | "third"
  | "final";

export type GroupId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type Team = {
  id: string;
  name: string;
  group: GroupId;
  position: 1 | 2 | 3 | 4;
  flag: string;
  confederation: string;
};

export type Match = {
  id: string;
  phase: Phase;
  group?: GroupId;
  date: string;
  timeCO: string;
  venue: string;
  home: string;
  away: string;
  label?: string;
};

export type GroupPrediction = "home" | "draw" | "away";
export type KnockoutPrediction = "home" | "away";

export type Predictions = {
  nickname: string;
  group: Record<string, GroupPrediction>;
  knockout: Record<string, KnockoutPrediction>;
  manualOrders: Partial<Record<GroupId | "thirds", string[]>>;
  favoriteTeamIds: string[];
  theme: "dark" | "light";
};

export type Standing = {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
};

export type KnockoutSlot = {
  id: string;
  phase: Exclude<Phase, "group">;
  title: string;
  date: string;
  timeCO: string;
  venue: string;
  homeSeed?: string;
  awaySeed?: string;
  home?: Team;
  away?: Team;
  winner?: Team;
  sourceHome?: string;
  sourceAway?: string;
};
