function App() {
  const [route, setRoute] = useState("home");
  const [people, setPeople] = useState(SEED);
  const [feed, setFeed] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [submitted, setSubmitted] = useState(null);
  const [missing, setMissing] = useState(null);
  const [fire, setFire] = useState(0);
  const reg = useRef(people);

  useEffect(() => { reg.current = people; }, [people]);
  useEffect(() => { document.documentElement.dataset.mode = route === "desk" ? "staff" : "guest"; }, [route]);

  const toast = useCallback((message, kind = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, message, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3400);
  }, []);

  const stats = useMemo(() => ({
    total: people.length,
    approved: people.filter(p => p.status === "approved").length,
    inside: people.filter(p => p.attended).length,
    waiting: people.filter(p => p.status === "pending").length,
  }), [people]);

  const apply = useCallback((data) => {
    const dupe = reg.current.find(p => p.email.toLowerCase() === data.email.trim().toLowerCase());
    if (dupe) return { ok: false, message: "That email already has application " + dupe.ref + "." };
    const p = mk({
      id: Date.now(), name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(),
      org: data.org.trim(), domain: data.domain, photo: data.photo, ref: newRef(),
      status: "pending", applied: new Date().toISOString(),
    });
    setPeople(prev => [p, ...prev]);
    setSubmitted(p);
    setRoute("submitted");
    soundOk();
    toast("Application " + p.ref + " sent for review", "ok");
    return { ok: true };
  }, [toast]);

  const approve = useCallback((id) => {
    const p = reg.current.find(x => x.id === id);
    if (!p) return;
    let code = newCode();
    while (reg.current.some(x => x.code === code)) code = newCode();
    const slot = slotAt(reg.current.filter(x => x.status === "approved").length);
    setPeople(prev => prev.map(x => x.id === id
      ? Object.assign({}, x, { status: "approved", code, slot, decided: new Date().toISOString() })
      : x));
    setFire(Date.now());
    soundOk();
    toast(p.name + " shortlisted · pass " + code, "ok");
  }, [toast]);

  const decline = useCallback((id) => {
    const p = reg.current.find(x => x.id === id);
    if (!p) return;
    setPeople(prev => prev.map(x => x.id === id
      ? Object.assign({}, x, { status: "declined", decided: new Date().toISOString() })
      : x));
    soundDup();
    toast(p.name + " marked not shortlisted", "warn");
  }, [toast]);

  const checkIn = useCallback((raw) => {
    let code = String(raw || "").trim();
    if (code === "__UNREADABLE__") {
      soundBad(); toast("No QR code found in that image", "bad");
      return { status: "unread" };
    }
    if (code.startsWith("{")) { try { code = JSON.parse(code).code || code; } catch (e) {} }
    code = code.toUpperCase();
    const p = reg.current.find(x => x.code === code);
    if (!p) { soundBad(); toast("No pass matches that code", "bad"); return { status: "bad", raw: code }; }
    if (p.attended) { soundDup(); toast(p.name + " already entered at " + clock(p.at), "warn"); return { status: "dup", p }; }
    const at = new Date().toISOString();
    const updated = Object.assign({}, p, { attended: true, at });
    setPeople(prev => prev.map(x => x.id === p.id ? updated : x));
    setFeed(prev => [{ name: p.name, code: p.code, email: p.email, photo: p.photo, at }, ...prev].slice(0, 25));
    setFire(Date.now());
    soundOk();
    toast(p.name + " checked in", "ok");
    return { status: "ok", p: updated };
  }, [toast]);

  const reset = useCallback(() => {
    setPeople(SEED); setFeed([]); setSubmitted(null);
    toast("Demo data restored", "ok");
  }, [toast]);

  const NAV = [
    ["home", "Home", "home"],
    ["apply", "Apply", "add"],
    ["pass", "My pass", "ticket"],
    ["desk", "Coordinator", "shield"],
  ];

  return (
    <div className="shell">
      <header className="topbar">
        <div className="mark" onClick={() => setRoute("home")}>
          <div className="mark-badge">V</div>
          <div className="mark-txt"><b>{CLUB.name}</b><span>{CLUB.edition}</span></div>
        </div>
        <nav>
          {NAV.map(([r, label, icon]) => (
            <button key={r}
              className={route === r || (r === "apply" && route === "submitted") ? "on" : ""}
              onClick={() => setRoute(r)}>
              <Ic n={icon} s={15} />{label}
              {r === "desk" && stats.waiting > 0 && <span className="badge">{stats.waiting}</span>}
            </button>
          ))}
        </nav>
        <div className="live"><span className="dot" />{stats.inside}/{stats.approved} IN</div>
      </header>

      <main key={route}>
        {route === "home" && <Home stats={stats} go={setRoute} />}
        {route === "apply" && <Apply onApply={apply} toast={toast} />}
        {route === "submitted" && submitted && <Submitted p={submitted} go={setRoute} />}
        {route === "pass" && <Lookup people={people} notFound={setMissing} />}
        {route === "desk" && <Desk people={people} feed={feed} checkIn={checkIn}
          approve={approve} decline={decline} onReset={reset} toast={toast} pending={stats.waiting} />}
      </main>

      <footer className="foot">
        <span>{CLUB.name} · {CLUB.venue} · {CLUB.day}</span>
        <span>Passes are single-use · duplicate scans are refused</span>
      </footer>

      <div className="toasts">
        {toasts.map(t => (
          <div className={"toast " + t.kind} key={t.id}>
            <Ic n={t.kind === "ok" ? "check" : t.kind === "warn" ? "bang" : "x"} s={16} />{t.message}
          </div>
        ))}
      </div>
      {missing && <NotFound query={missing} onClose={() => setMissing(null)} />}
      <Confetti fire={fire} />
    </div>
  );
}
