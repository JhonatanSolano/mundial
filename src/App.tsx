import {
  CalendarDays,
  Download,
  LogOut,
  Moon,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  Share2,
  Sun,
  Trophy,
  Upload,
} from "lucide-react";
import { ChangeEvent, CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { groupIds, groupMatches, groups, teams } from "./data/tournament";
import { usePredictions } from "./hooks/usePredictions";
import {
  buildKnockout,
  calculateStandings,
  completedCount,
  getTeam,
  hasPointTies,
  thirdPlaceTable,
  totalAvailableMatches,
} from "./lib/tournament";
import type { GroupId, KnockoutSlot, Match, Predictions, Standing, Team } from "./types";
import { formatDate, formatTime } from "./utils/format";

type Tab = "home" | "calendar" | "groups" | "knockout" | "bracket" | "champion";

const phases = {
  group: "Fase de grupos",
  round32: "Dieciseisavos",
  round16: "Octavos",
  quarter: "Cuartos",
  semi: "Semifinales",
  third: "Tercer puesto",
  final: "Final",
};

export function App() {
  const store = usePredictions();
  const { accountEmail, predictions } = store;
  const [tab, setTab] = useState<Tab>("home");
  const standings = useMemo(() => calculateStandings(predictions), [predictions]);
  const knockout = useMemo(() => buildKnockout(predictions), [predictions]);
  const total = totalAvailableMatches(predictions);
  const completed = completedCount(predictions);
  const progress = total ? Math.round((completed / total) * 100) : 0;
  const champion = knockout.find((slot) => slot.phase === "final")?.winner;

  if (!store.firebaseConfigured) {
    return <FirebaseSetupScreen />;
  }

  if (store.authLoading) {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <span className="logo-mark">26</span>
          <h1>Cargando sesión</h1>
          <p>Estamos conectando con Firebase.</p>
        </section>
      </main>
    );
  }

  if (!accountEmail) {
    return (
      <LoginScreen
        onLogin={store.login}
        onRegister={store.register}
        onGoogle={store.loginWithGoogle}
        theme={predictions.theme}
        toggleTheme={store.toggleTheme}
      />
    );
  }

  if (!predictions.nickname) {
    return (
      <NicknameSetup
        accountEmail={accountEmail}
        onSave={store.setNickname}
        onLogout={store.logout}
      />
    );
  }

  if (predictions.favoriteTeamIds.length < 2) {
    return (
      <FavoritesSetup
        accountEmail={accountEmail}
        nickname={predictions.nickname}
        selected={predictions.favoriteTeamIds}
        onSave={store.setFavoriteTeams}
        onLogout={store.logout}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-main">
          <button className="brand" onClick={() => setTab("home")} aria-label="Ir al inicio">
            <span className="logo-mark">26</span>
            <span>
              <strong>Mundial Predictor</strong>
              <small>Hora Colombia</small>
            </span>
          </button>
          <div className="profile-pill">
            <span>{predictions.nickname}</span>
            <small>Analista estrella · {store.syncStatus === "saving" ? "Guardando" : "Guardado"}</small>
          </div>
        </div>
        <div className="top-actions">
          <button className="icon-button" onClick={store.toggleTheme} aria-label="Cambiar tema">
            {predictions.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-button danger"
            onClick={() => {
              if (confirm("¿Reiniciar todas tus predicciones del Mundial?")) store.reset();
            }}
            aria-label="Reiniciar Mundial"
          >
            <RotateCcw size={18} />
          </button>
          <button className="icon-button" onClick={store.logout} aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main>
        {tab === "home" && (
          <Home
            completed={completed}
            total={total}
            progress={progress}
            champion={champion}
            onStart={() => setTab("calendar")}
            predictions={predictions}
            accountEmail={accountEmail}
            standings={standings}
            knockout={knockout}
            importPredictions={store.importPredictions}
            setFavoriteTeams={store.setFavoriteTeams}
          />
        )}
        {tab === "calendar" && (
          <CalendarView
            predictions={predictions}
            knockout={knockout}
            pickGroup={store.pickGroup}
            pickKnockout={store.pickKnockout}
          />
        )}
        {tab === "groups" && (
          <GroupsView
            predictions={predictions}
            standings={standings}
            setManualOrder={store.setManualOrder}
          />
        )}
        {tab === "knockout" && (
          <KnockoutView knockout={knockout} predictions={predictions} pickKnockout={store.pickKnockout} />
        )}
        {tab === "bracket" && (
          <BracketView knockout={knockout} predictions={predictions} pickKnockout={store.pickKnockout} />
        )}
        {tab === "champion" && <ChampionView champion={champion} />}
      </main>

      <nav className="tabs" aria-label="Navegación principal">
        {[
          ["home", "Inicio"],
          ["calendar", "Calendario"],
          ["groups", "Grupos"],
          ["knockout", "Llaves"],
          ["bracket", "Bracket"],
          ["champion", "Campeón"],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id as Tab)}>
            {label}
          </button>
        ))}
      </nav>
      <footer className="app-footer">
        Todos los derechos reservados · Autor: Jhonatan Solano
      </footer>
    </div>
  );
}

function FirebaseSetupScreen() {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <span className="logo-mark">26</span>
        <p className="eyebrow">Configuración requerida</p>
        <h1>Conecta Firebase</h1>
        <p>
          Crea un archivo <code>.env</code> en la raíz con las variables de <code>.env.example</code>.
          Luego reinicia <code>npm run dev</code>.
        </p>
      </section>
    </main>
  );
}

function NicknameSetup({
  accountEmail,
  onSave,
  onLogout,
}: {
  accountEmail: string;
  onSave: (nickname: string) => void;
  onLogout: () => void;
}) {
  const [nickname, setNickname] = useState("");

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-head">
          <span className="logo-mark">26</span>
          <button className="secondary slim" onClick={onLogout}>
            Cambiar correo
          </button>
        </div>
        <p className="eyebrow">{accountEmail}</p>
        <h1>¿Cómo quieres que te llamemos?</h1>
        <p>Ese será tu nombre dentro de la app. Desde ahora eres nuestro analista estrella.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(nickname);
          }}
        >
          <label className="field">
            Apodo
            <input
              required
              maxLength={32}
              value={nickname}
              placeholder="Ej: Profe del bracket"
              onChange={(event) => setNickname(event.target.value)}
            />
          </label>
          <button className="primary full" type="submit">
            Guardar apodo
          </button>
        </form>
      </section>
    </main>
  );
}

function LoginScreen({
  onLogin,
  onRegister,
  onGoogle,
  theme,
  toggleTheme,
}: {
  onLogin: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  onRegister: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  onGoogle: () => Promise<{ ok: boolean; message?: string }>;
  theme: "dark" | "light";
  toggleTheme: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setMessage("");
    setSubmitting(true);
    const result = mode === "login" ? await onLogin(email, password) : await onRegister(email, password);
    setSubmitting(false);
    if (result.message) setMessage(result.message);
  }

  async function submitGoogle() {
    setMessage("");
    setSubmitting(true);
    const result = await onGoogle();
    setSubmitting(false);
    if (result.message) setMessage(result.message);
  }

  function switchMode(nextMode: "login" | "register") {
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setMessage("");
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="auth-head">
          <span className="logo-mark">26</span>
          <button className="icon-button" onClick={toggleTheme} aria-label="Cambiar tema">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <p className="eyebrow">Predicción Mundial 2026</p>
        <h1>{mode === "login" ? "Entra a tu cuenta" : "Crea tu cuenta"}</h1>
        <p>
          Tu progreso se guardará en Firebase para que puedas recuperarlo con tu cuenta.
        </p>
        <button className="google-button" onClick={submitGoogle} disabled={submitting}>
          <span>G</span>
          Entrar con Google
        </button>
        <div className="divider"><span>o usa correo y contraseña</span></div>
        <div className="auth-toggle" role="tablist" aria-label="Modo de cuenta">
          <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>
            Entrar
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}>
            Registrarme
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="field">
            Correo
            <input
              type="email"
              required
              value={email}
              placeholder="tu@email.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="field">
            Contraseña
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                placeholder="Mínimo 6 caracteres"
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {message && <p className={message.includes("creada") || message.includes("Revisa") ? "form-success" : "form-error"}>{message}</p>}
          <button className="primary full" type="submit" disabled={submitting}>
            {submitting ? "Procesando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>
      </section>
    </main>
  );
}

function FavoritesSetup({
  accountEmail,
  nickname,
  selected,
  onSave,
  onLogout,
}: {
  accountEmail: string;
  nickname: string;
  selected: string[];
  onSave: (teamIds: string[]) => void;
  onLogout: () => void;
}) {
  const [draft, setDraft] = useState<string[]>(selected);

  function toggleTeam(teamId: string) {
    setDraft((current) => {
      if (current.includes(teamId)) return current.filter((id) => id !== teamId);
      if (current.length >= 2) return [current[1], teamId];
      return [...current, teamId];
    });
  }

  return (
    <main className="favorites-screen">
      <section className="panel favorites-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">{accountEmail}</p>
            <h1>{nickname}, escoge tus 2 selecciones favoritas</h1>
            <p>Después tendrás acceso directo para seguir su camino en grupos y eliminatorias.</p>
          </div>
        </div>
        <div className="team-picker">
          {teams.map((team) => (
            <button
              key={team.id}
              className={draft.includes(team.id) ? "team-choice active" : "team-choice"}
              onClick={() => toggleTeam(team.id)}
            >
              <TeamLine team={team} />
              <small>Grupo {team.group}</small>
            </button>
          ))}
        </div>
        <div className="action-row">
          <button className="secondary" onClick={onLogout}>
            Cambiar correo
          </button>
          <button className="primary full" disabled={draft.length !== 2} onClick={() => onSave(draft)}>
            Continuar con mis favoritas
          </button>
        </div>
      </section>
    </main>
  );
}

function Home({
  completed,
  total,
  progress,
  champion,
  onStart,
  predictions,
  accountEmail,
  standings,
  knockout,
  importPredictions,
  setFavoriteTeams,
}: {
  completed: number;
  total: number;
  progress: number;
  champion?: Team;
  onStart: () => void;
  predictions: Predictions;
  accountEmail: string;
  standings: Record<GroupId, Standing[]>;
  knockout: KnockoutSlot[];
  importPredictions: (next: Predictions) => void;
  setFavoriteTeams: (teamIds: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pending = Math.max(total - completed, 0);

  function exportJson() {
    const blob = new Blob([JSON.stringify(predictions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "prediccion-mundial-2026.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function shareSummary() {
    const text = champion
      ? `Mi campeón del Mundial 2026 es ${champion.flag} ${champion.name}.`
      : `Llevo ${progress}% de mi predicción del Mundial 2026.`;
    if (navigator.share) await navigator.share({ title: "Predicción Mundial 2026", text });
    else await navigator.clipboard.writeText(text);
  }

  function onImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((content) => importPredictions(JSON.parse(content)));
  }

  return (
    <section className="home-grid">
      <div className="hero">
        <div className="cup-orb">
          <Trophy size={54} />
        </div>
        <p className="eyebrow">FIFA World Cup 2026</p>
        <h1>{predictions.nickname}, analista estrella</h1>
        <p>Arma tu camino completo hacia la final. Tu sesión está guardada para {accountEmail}.</p>
        <button className="primary" onClick={onStart}>
          Comenzar
        </button>
      </div>
      <div className="panel">
        <div className="progress-ring" style={{ "--progress": `${progress}%` } as CSSProperties}>
          <strong>{progress}%</strong>
          <span>completado</span>
        </div>
        <div className="stats-grid">
          <Stat label="Pronosticados" value={completed} />
          <Stat label="Pendientes" value={pending} />
          <Stat label="Partidos activos" value={total} />
        </div>
        {champion && (
          <div className="mini-champion">
            <span>{champion.flag}</span>
            <div>
              <small>Campeón proyectado</small>
              <strong>{champion.name}</strong>
            </div>
          </div>
        )}
        <FavoriteTracker
          predictions={predictions}
          standings={standings}
          knockout={knockout}
          setFavoriteTeams={setFavoriteTeams}
        />
        <div className="action-row">
          <button className="secondary" onClick={exportJson}>
            <Download size={16} /> Exportar
          </button>
          <button className="secondary" onClick={() => inputRef.current?.click()}>
            <Upload size={16} /> Importar
          </button>
          <button className="secondary" onClick={shareSummary}>
            <Share2 size={16} /> Compartir
          </button>
          <input ref={inputRef} type="file" accept="application/json" hidden onChange={onImport} />
        </div>
      </div>
    </section>
  );
}

function FavoriteTracker({
  predictions,
  standings,
  knockout,
  setFavoriteTeams,
}: {
  predictions: Predictions;
  standings: Record<GroupId, Standing[]>;
  knockout: KnockoutSlot[];
  setFavoriteTeams: (teamIds: string[]) => void;
}) {
  const favorites = predictions.favoriteTeamIds
    .map((id) => getTeam(id))
    .filter((team): team is Team => Boolean(team));

  return (
    <div className="favorites-tracker">
      <div className="tracker-head">
        <strong>Mis favoritas</strong>
        <button onClick={() => setFavoriteTeams([])}>Cambiar</button>
      </div>
      {favorites.map((team) => {
        const row = standings[team.group].find((candidate) => candidate.team.id === team.id);
        const path = knockout.filter(
          (slot) =>
            slot.home?.id === team.id ||
            slot.away?.id === team.id ||
            slot.winner?.id === team.id,
        );
        const lastMatch = path.at(-1);
        return (
          <div className="favorite-card" key={team.id}>
            <TeamLine team={team} />
            <span>
              Grupo {team.group} · {row?.points ?? 0} pts · {row?.played ?? 0}/3 PJ
            </span>
            <small>
              {lastMatch
                ? `Último acceso: ${lastMatch.title}`
                : "Aún está en fase de grupos o pendiente de clasificar."}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function CalendarView({
  predictions,
  knockout,
  pickGroup,
  pickKnockout,
}: {
  predictions: Predictions;
  knockout: KnockoutSlot[];
  pickGroup: (id: string, value: "home" | "draw" | "away") => void;
  pickKnockout: (id: string, value: "home" | "away") => void;
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<GroupId | "all">("all");
  const [phase, setPhase] = useState<"all" | KnockoutSlot["phase"] | "group">("all");
  const [status, setStatus] = useState<"all" | "pending" | "done">("all");
  const [selectedDate, setSelectedDate] = useState("");

  const groupEvents = useMemo(
    () => groupMatches.map((match) => ({ type: "group" as const, date: match.date, timeCO: match.timeCO, match })),
    [],
  );
  const knockoutEvents = useMemo(
    () => knockout.map((slot) => ({ type: "knockout" as const, date: slot.date, timeCO: slot.timeCO, slot })),
    [knockout],
  );
  const events = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return [...groupEvents, ...knockoutEvents].filter((event) => {
      if (phase !== "all" && event.type === "group" && phase !== "group") return false;
      if (phase !== "all" && event.type === "knockout" && event.slot.phase !== phase) return false;

      if (event.type === "knockout") {
        const text = `${event.slot.title} ${event.slot.venue} ${event.slot.sourceHome} ${event.slot.sourceAway} ${event.slot.home?.name ?? ""} ${event.slot.away?.name ?? ""}`.toLowerCase();
        if (normalizedQuery && !text.includes(normalizedQuery)) return false;
        if (group !== "all") return false;
        if (status === "pending" && predictions.knockout[event.slot.id]) return false;
        if (status === "done" && !predictions.knockout[event.slot.id]) return false;
        return true;
      }

      const match = event.match;
      const home = getTeam(match.home)!;
      const away = getTeam(match.away)!;
      const text = `partido ${match.id} grupo ${match.group} ${home.name} ${away.name} ${match.venue}`.toLowerCase();
      if (normalizedQuery && !text.includes(normalizedQuery)) return false;
      if (group !== "all" && match.group !== group) return false;
      if (status === "pending" && predictions.group[match.id]) return false;
      if (status === "done" && !predictions.group[match.id]) return false;
      return true;
    }).sort((a, b) => `${a.date} ${a.timeCO}`.localeCompare(`${b.date} ${b.timeCO}`));
  }, [group, groupEvents, knockoutEvents, phase, predictions.group, predictions.knockout, query, status]);

  const byDate = useMemo(() => groupBy(events, (event) => event.date), [events]);
  const dateEntries = useMemo(() => Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)), [byDate]);
  const activeDate = selectedDate && byDate[selectedDate] ? selectedDate : dateEntries[0]?.[0] ?? "";
  const activeEvents = activeDate ? byDate[activeDate] ?? [] : [];

  useEffect(() => {
    if (!dateEntries.length) {
      setSelectedDate("");
      return;
    }
    if (!selectedDate || !byDate[selectedDate]) {
      setSelectedDate(dateEntries[0][0]);
    }
  }, [dateEntries, byDate, selectedDate]);

  return (
    <section className="stack">
      <SectionTitle icon={<CalendarDays />} title="Calendario interactivo" subtitle="Elige una fecha para ver partidos, hora y estadio." />
      <Filters
        query={query}
        setQuery={setQuery}
        group={group}
        setGroup={setGroup}
        phase={phase}
        setPhase={setPhase}
        status={status}
        setStatus={setStatus}
      />
      {dateEntries.length ? (
        <>
          <div className="calendar-strip" aria-label="Fechas con partidos">
            {dateEntries.map(([date, dayEvents]) => (
              <button
                key={date}
                className={activeDate === date ? "date-chip active" : "date-chip"}
                onClick={() => setSelectedDate(date)}
              >
                <span>{formatDate(date)}</span>
                <strong>{dayEvents.length}</strong>
              </button>
            ))}
          </div>
          <div className="day-block selected-day">
            <div className="selected-day-head">
              <h2>{formatDate(activeDate)}</h2>
              <span>{activeEvents.length} partido{activeEvents.length === 1 ? "" : "s"}</span>
            </div>
            {activeEvents.map((event) => (
              event.type === "group" ? (
                <MatchCard
                  key={event.match.id}
                  match={event.match}
                  value={predictions.group[event.match.id]}
                  onPick={(value) => pickGroup(event.match.id, value)}
                  allowDraw
                />
              ) : (
                <KnockoutCard
                  key={event.slot.id}
                  slot={event.slot}
                  value={predictions.knockout[event.slot.id]}
                  onPick={(value) => pickKnockout(event.slot.id, value)}
                />
              )
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          No hay partidos con los filtros actuales.
        </div>
      )}
    </section>
  );
}

function GroupsView({
  predictions,
  standings,
  setManualOrder,
}: {
  predictions: Predictions;
  standings: Record<GroupId, Standing[]>;
  setManualOrder: (scope: GroupId | "thirds", order: string[]) => void;
}) {
  const thirds = thirdPlaceTable(standings, predictions.manualOrders.thirds);
  const [openGroup, setOpenGroup] = useState<GroupId | null>(null);
  return (
    <section className="groups-layout">
      {groupIds.map((groupId) => (
        <GroupPanel
          key={groupId}
          groupId={groupId}
          rows={standings[groupId]}
          isOpen={openGroup === groupId}
          onToggle={() => setOpenGroup((current) => (current === groupId ? null : groupId))}
          setManualOrder={setManualOrder}
        />
      ))}
      <div className="panel wide">
        <SectionTitle title="Mejores terceros" subtitle="Clasifican los 8 primeros. Si hay empate en puntos, ajusta el orden." />
        <StandingsTable rows={thirds} qualifiedCount={8} />
        {hasPointTies(thirds) && <ManualSorter rows={thirds} scope="thirds" setManualOrder={setManualOrder} />}
      </div>
    </section>
  );
}

function GroupPanel({
  groupId,
  rows,
  isOpen,
  onToggle,
  setManualOrder,
}: {
  groupId: GroupId;
  rows: Standing[];
  isOpen: boolean;
  onToggle: () => void;
  setManualOrder: (scope: GroupId | "thirds", order: string[]) => void;
}) {
  const leader = rows[0]?.team;
  return (
    <article className={isOpen ? "panel group-accordion open" : "panel group-accordion"}>
      <button className="group-summary" onClick={onToggle} aria-expanded={isOpen}>
        <span>
          <strong>Grupo {groupId}</strong>
          <small>{groups[groupId].map((team) => team.name).join(" · ")}</small>
        </span>
        <span className="group-meta">
          {leader ? `${leader.name} · ${rows[0].points} pts` : "Sin datos"}
        </span>
      </button>
      {isOpen && (
        <div className="group-details">
          <StandingsTable rows={rows} qualifiedCount={2} />
          {hasPointTies(rows) && <ManualSorter rows={rows} scope={groupId} setManualOrder={setManualOrder} />}
        </div>
      )}
    </article>
  );
}

function KnockoutView({
  knockout,
  predictions,
  pickKnockout,
}: {
  knockout: KnockoutSlot[];
  predictions: Predictions;
  pickKnockout: (id: string, value: "home" | "away") => void;
}) {
  return (
    <section className="stack">
      <SectionTitle title="Eliminatorias" subtitle="Sin empates. Cada ganador avanza inmediatamente." />
      {(["round32", "round16", "quarter", "semi", "third", "final"] as const).map((phase) => (
        <div className="phase-block" key={phase}>
          <h2>{phases[phase]}</h2>
          <div className="knockout-grid">
            {knockout
              .filter((slot) => slot.phase === phase)
              .map((slot) => (
                <KnockoutCard
                  key={slot.id}
                  slot={slot}
                  value={predictions.knockout[slot.id]}
                  onPick={(value) => pickKnockout(slot.id, value)}
                />
              ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function BracketView({
  knockout,
  predictions,
  pickKnockout,
}: {
  knockout: KnockoutSlot[];
  predictions: Predictions;
  pickKnockout: (id: string, value: "home" | "away") => void;
}) {
  const finalWinner = knockout.find((slot) => slot.phase === "final")?.winner;
  return (
    <section className="bracket-wrap">
      {(["round32", "round16", "quarter", "semi", "final"] as const).map((phase) => (
        <div className="bracket-column" key={phase}>
          <h2>{phases[phase]}</h2>
          {knockout
            .filter((slot) => slot.phase === phase)
            .map((slot) => (
              <KnockoutCard
                key={slot.id}
                slot={slot}
                value={predictions.knockout[slot.id]}
                onPick={(value) => pickKnockout(slot.id, value)}
                compact
              />
            ))}
        </div>
      ))}
      <div className="bracket-column champion-column">
        <h2>Campeón</h2>
        <div className="champion-card small">
          {finalWinner ? (
            <>
              <span>{finalWinner.flag}</span>
              <strong>{finalWinner.name}</strong>
            </>
          ) : (
            <p>Completa la final para revelar el campeón.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ChampionView({ champion }: { champion?: Team }) {
  return (
    <section className="champion-screen">
      <div className="champion-card">
        <Trophy size={58} />
        <p>Según tus predicciones, el campeón del Mundial es...</p>
        {champion ? (
          <>
            <span>{champion.flag}</span>
            <h1>{champion.name}</h1>
          </>
        ) : (
          <h1>Aún no definido</h1>
        )}
      </div>
    </section>
  );
}

function MatchCard({
  match,
  value,
  onPick,
  allowDraw,
  compact = false,
}: {
  match: Match;
  value?: "home" | "draw" | "away";
  onPick: (value: "home" | "draw" | "away") => void;
  allowDraw?: boolean;
  compact?: boolean;
}) {
  const home = getTeam(match.home)!;
  const away = getTeam(match.away)!;
  return (
    <article className={`match-card ${compact ? "compact" : ""}`}>
      <div className="match-meta">
        <strong>Partido {match.id} · {formatTime(match.timeCO)}</strong>
        <span>{match.venue}</span>
      </div>
      <div className="versus">
        <TeamLine team={home} />
        <span>vs</span>
        <TeamLine team={away} />
      </div>
      <div className="pick-row" role="radiogroup" aria-label={`${home.name} contra ${away.name}`}>
        <PickButton active={value === "home"} onClick={() => onPick("home")} label={home.name} />
        {allowDraw && <PickButton active={value === "draw"} onClick={() => onPick("draw")} label="Empate" />}
        <PickButton active={value === "away"} onClick={() => onPick("away")} label={away.name} />
      </div>
    </article>
  );
}

function KnockoutCard({
  slot,
  value,
  onPick,
  compact = false,
}: {
  slot: KnockoutSlot;
  value?: "home" | "away";
  onPick: (value: "home" | "away") => void;
  compact?: boolean;
}) {
  const locked = !slot.home || !slot.away;
  return (
    <article className={`match-card knockout ${compact ? "compact" : ""} ${locked ? "locked" : ""}`}>
      <div className="match-meta">
        <strong>{slot.title}</strong>
        <span>{slot.home && slot.away ? `${formatDate(slot.date)} · ${formatTime(slot.timeCO)}` : "Pendiente de clasificados"}</span>
      </div>
      <div className="versus">
        {slot.home ? <TeamLine team={slot.home} /> : <Placeholder label={slot.sourceHome} />}
        <span>vs</span>
        {slot.away ? <TeamLine team={slot.away} /> : <Placeholder label={slot.sourceAway} />}
      </div>
      <div className="pick-row">
        <PickButton active={value === "home"} disabled={locked} onClick={() => onPick("home")} label={slot.home?.name ?? "Equipo A"} />
        <PickButton active={value === "away"} disabled={locked} onClick={() => onPick("away")} label={slot.away?.name ?? "Equipo B"} />
      </div>
    </article>
  );
}

function StandingsTable({ rows, qualifiedCount }: { rows: Standing[]; qualifiedCount: number }) {
  return (
    <table className="standings">
      <thead>
        <tr>
          <th>Selección</th>
          <th>PJ</th>
          <th>PG</th>
          <th>PE</th>
          <th>PP</th>
          <th>Pts</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.team.id} className={index < qualifiedCount ? "qualified" : ""}>
            <td>
              <TeamLine team={row.team} />
            </td>
            <td>{row.played}</td>
            <td>{row.wins}</td>
            <td>{row.draws}</td>
            <td>{row.losses}</td>
            <td>
              <strong>{row.points}</strong>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ManualSorter({
  rows,
  scope,
  setManualOrder,
}: {
  rows: Standing[];
  scope: GroupId | "thirds";
  setManualOrder: (scope: GroupId | "thirds", order: string[]) => void;
}) {
  const [dragged, setDragged] = useState<string | null>(null);
  const ids = rows.map((row) => row.team.id);
  return (
    <div className="manual-sorter">
      <strong>Ajustar clasificación</strong>
      <p>Arrastra para decidir el orden definitivo cuando hay empate en puntos.</p>
      <div className="sort-list">
        {rows.map((row) => (
          <button
            key={row.team.id}
            draggable
            onDragStart={() => setDragged(row.team.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragged || dragged === row.team.id) return;
              const next = [...ids];
              next.splice(next.indexOf(dragged), 1);
              next.splice(next.indexOf(row.team.id), 0, dragged);
              setManualOrder(scope, next);
            }}
          >
            <TeamLine team={row.team} />
            <span>{row.points} pts</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Filters({
  query,
  setQuery,
  group,
  setGroup,
  phase,
  setPhase,
  status,
  setStatus,
}: {
  query: string;
  setQuery: (value: string) => void;
  group: GroupId | "all";
  setGroup: (value: GroupId | "all") => void;
  phase: "all" | KnockoutSlot["phase"] | "group";
  setPhase: (value: "all" | KnockoutSlot["phase"] | "group") => void;
  status: "all" | "pending" | "done";
  setStatus: (value: "all" | "pending" | "done") => void;
}) {
  return (
    <div className="filters">
      <label className="search-field">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar partido o sede" />
      </label>
      <select value={group} onChange={(event) => setGroup(event.target.value as GroupId | "all")}>
        <option value="all">Todos los grupos</option>
        {groupIds.map((id) => (
          <option key={id} value={id}>
            Grupo {id}
          </option>
        ))}
      </select>
      <select value={phase} onChange={(event) => setPhase(event.target.value as "all" | KnockoutSlot["phase"] | "group")}>
        <option value="all">Todas las fases</option>
        <option value="group">Fase de grupos</option>
        <option value="round32">Dieciseisavos</option>
        <option value="round16">Octavos</option>
        <option value="quarter">Cuartos</option>
        <option value="semi">Semifinales</option>
        <option value="third">Tercer puesto</option>
        <option value="final">Final</option>
      </select>
      <select value={status} onChange={(event) => setStatus(event.target.value as "all" | "pending" | "done")}>
        <option value="all">Todos</option>
        <option value="pending">Pendientes</option>
        <option value="done">Pronosticados</option>
      </select>
    </div>
  );
}

function PickButton({
  active,
  disabled,
  onClick,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button className={active ? "pick active" : "pick"} disabled={disabled} onClick={onClick} role="radio" aria-checked={active}>
      <span />
      {label}
    </button>
  );
}

function TeamLine({ team }: { team: Team }) {
  return (
    <span className="team-line">
      <span className="flag">{team.flag}</span>
      <span>{team.name}</span>
    </span>
  );
}

function Placeholder({ label }: { label?: string }) {
  return <span className="placeholder">{label ?? "Pendiente"}</span>;
}

function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="section-title">
      {icon}
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getKey(item);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});
}
