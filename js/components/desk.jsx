function Scanner({ onRead }) {
  const vid = useRef(null), buf = useRef(null), stream = useRef(null), raf = useRef(0), lock = useRef(0), cb = useRef(onRead);
  const native = useRef(null), beat = useRef(0), turn = useRef(0);
  const [engine, setEngine] = useState("jsQR");
  const [state, setState] = useState("idle");
  const [flash, setFlash] = useState(0);
  const [why, setWhy] = useState("");
  const [cams, setCams] = useState([]);
  const [camId, setCamId] = useState("");
  useEffect(() => { cb.current = onRead; });

  useEffect(() => {
    if (!("BarcodeDetector" in window)) return;
    window.BarcodeDetector.getSupportedFormats().then(list => {
      if (list.indexOf("qr_code") >= 0) {
        native.current = new window.BarcodeDetector({ formats: ["qr_code"] });
        setEngine("native");
      }
    }).catch(() => {});
  }, []);

  const explain = (e) => {
    const n = e && e.name ? e.name : "";
    if (n === "NotAllowedError" || n === "PermissionDeniedError")
      return "Permission was denied. Click the camera icon in the address bar, allow access, then start again.";
    if (n === "NotFoundError" || n === "DevicesNotFoundError")
      return "No camera is attached to this device.";
    if (n === "NotReadableError" || n === "TrackStartError")
      return "Another app is holding the camera. Close Zoom, Teams, Meet or any other tab using it, then retry.";
    if (n === "OverconstrainedError") return "No camera matched the requested settings.";
    if (n === "SecurityError") return "Blocked because this page is not on a secure origin.";
    return (n || "Error") + (e && e.message ? " — " + e.message : "");
  };

  const loop = async (ts) => {
    raf.current = requestAnimationFrame(loop);
    const v = vid.current, c = buf.current;
    if (!v || !c || v.readyState < 2 || !v.videoWidth) return;
    if (ts - beat.current < 80 || Date.now() < lock.current) return;
    beat.current = ts;

    const w = v.videoWidth, h = v.videoHeight;
    let hit = null;

    if (native.current) {
      try {
        const codes = await native.current.detect(v);
        if (codes && codes.length && codes[0].rawValue) hit = codes[0].rawValue;
      } catch (e) {}
    }

    if (!hit && window.jsQR) {
      const ctx = c.getContext("2d", { willReadFrequently: true });
      const zoom = (turn.current++ % 2) === 0;
      if (zoom) {
        const side = Math.floor(Math.min(w, h) * 0.7);
        c.width = side; c.height = side;
        ctx.drawImage(v, Math.floor((w - side) / 2), Math.floor((h - side) / 2), side, side, 0, 0, side, side);
      } else {
        const k = Math.min(1, 800 / w);
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        ctx.drawImage(v, 0, 0, c.width, c.height);
      }
      try {
        const d = ctx.getImageData(0, 0, c.width, c.height);
        const r = window.jsQR(d.data, c.width, c.height, { inversionAttempts: "attemptBoth" });
        if (r && r.data) hit = r.data;
      } catch (e) {}
    }

    if (hit && Date.now() > lock.current) {
      lock.current = Date.now() + 2600;
      setFlash(Date.now());
      cb.current(hit);
    }
  };

  const start = async (deviceId) => {
    setState("starting"); setWhy("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setWhy(window.isSecureContext
        ? "This browser exposes no camera API."
        : "Browsers only hand out the camera on a secure origin. Open this page through http://localhost or https://, not by double-clicking the file.");
      setState("blocked"); return;
    }
    if (stream.current) stream.current.getTracks().forEach(t => t.stop());
    const attempts = deviceId
      ? [{ video: { deviceId: { exact: deviceId } } }]
      : [{ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } } }, { video: true }];
    let got = null, last = null;
    for (let i = 0; i < attempts.length; i++) {
      try { got = await navigator.mediaDevices.getUserMedia(attempts[i]); break; }
      catch (e) { last = e; }
    }
    if (!got) { setWhy(explain(last)); setState("blocked"); return; }
    stream.current = got;
    const v = vid.current;
    v.srcObject = got;
    v.muted = true;
    v.setAttribute("playsinline", "");
    try { await v.play(); } catch (e) {}
    setState("live");
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setCams(list.filter(d => d.kind === "videoinput"));
      const t = got.getVideoTracks()[0];
      if (t && t.getSettings) setCamId(t.getSettings().deviceId || "");
    } catch (e) {}
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    if (stream.current) stream.current.getTracks().forEach(t => t.stop());
    stream.current = null;
    setState("idle");
  };
  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (stream.current) stream.current.getTracks().forEach(t => t.stop());
  }, []);

  const readImage = async (img) => {
    if (native.current) {
      try {
        const codes = await native.current.detect(img);
        if (codes && codes.length && codes[0].rawValue) return codes[0].rawValue;
      } catch (e) {}
    }
    if (!window.jsQR) return null;
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d", { willReadFrequently: true });
    const fit = Math.min(1, 1400 / Math.max(img.width, img.height));
    const scales = [1, 1.7, 0.6, 2.6];
    for (let i = 0; i < scales.length; i++) {
      const k = fit * scales[i];
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      try {
        const d = ctx.getImageData(0, 0, c.width, c.height);
        const r = window.jsQR(d.data, c.width, c.height, { inversionAttempts: "attemptBoth" });
        if (r && r.data) return r.data;
      } catch (e) {}
    }
    return null;
  };

  const fromFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = async () => {
      const hit = await readImage(img);
      URL.revokeObjectURL(url);
      cb.current(hit || "__UNREADABLE__");
    };
    img.onerror = () => { URL.revokeObjectURL(url); cb.current("__UNREADABLE__"); };
    img.src = url;
    e.target.value = "";
  };

  return (
    <div>
      <div className="viewport">
        <video ref={vid} playsInline muted style={{ opacity: state === "live" ? 1 : 0 }} />
        <canvas ref={buf} style={{ display: "none" }} />
        {state === "live" && (
          <React.Fragment>
            <div className="reticle"><i /><i /><i /><i /></div>
            <div className="laser" />
            {flash > 0 && <div className="flash" key={flash} />}
          </React.Fragment>
        )}
        {state !== "live" && (
          <div className="vp-idle">
            <Ic n={state === "blocked" ? "bang" : "cam"} s={30} />
            <p>{state === "blocked"
              ? why + " Meanwhile the pass ID field and QR upload below check in exactly the same way."
              : state === "starting" ? "Waiting for camera permission…" : "Camera is off. Start it to read passes at the door."}</p>
            {state !== "starting" && <button className="btn btn-primary btn-sm" onClick={() => start()}><Ic n="cam" s={15} />{state === "blocked" ? "Try again" : "Start camera"}</button>}
          </div>
        )}
      </div>
      <div className="tools">
        {state === "live"
          ? <button className="btn btn-ghost btn-sm" onClick={stop}><Ic n="x" s={15} />Stop camera</button>
          : <button className="btn btn-ghost btn-sm" onClick={() => start()}><Ic n="cam" s={15} />Start camera</button>}
        {state === "live" && cams.length > 1 && (
          <select className="cam-pick" value={camId} onChange={e => { setCamId(e.target.value); start(e.target.value); }}>
            {cams.map((c, i) => <option key={c.deviceId || i} value={c.deviceId}>{c.label || "Camera " + (i + 1)}</option>)}
          </select>
        )}
        <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
          <Ic n="up" s={15} />Upload QR image
          <input type="file" accept="image/*" onChange={fromFile} style={{ display: "none" }} />
        </label>
        {state === "live" && <span className="engine">READER · {engine.toUpperCase()}</span>}
      </div>
    </div>
  );
}

function Verdict({ r }) {
  if (!r) return <div className="ro-empty">Point the camera at a pass. The result lands here and the register updates everywhere at once.</div>;
  if (r.status === "ok") return (
    <div className="verdict v-ok" key={r.k}>
      <div className="seal"><Ic n="check" s={36} /></div>
      <h3>ADMITTED</h3>
      <div className="who">{r.p.name}</div>
      <div className="meta">{r.p.code} · {r.p.domain.toUpperCase()}<br />SLOT {r.p.slot} · {r.p.org.toUpperCase()}<br />ENTERED {clock(r.p.at)}</div>
    </div>
  );
  if (r.status === "dup") return (
    <div className="verdict v-dup" key={r.k}>
      <div className="seal"><Ic n="bang" s={32} /></div>
      <h3>ALREADY IN</h3>
      <div className="who">{r.p.name}</div>
      <div className="meta">DUPLICATE SCAN BLOCKED<br />{r.p.code}<br />FIRST ENTRY {stamp(r.p.at)}</div>
    </div>
  );
  if (r.status === "unread") return (
    <div className="verdict v-bad" key={r.k}>
      <div className="seal"><Ic n="image" s={32} /></div>
      <h3>NO CODE FOUND</h3>
      <div className="who">That image has no readable QR</div>
      <div className="meta">UPLOAD THE PASS PNG OR A PHOTO<br />OF THE QR ITSELF<br />OR TYPE THE PASS ID BELOW</div>
    </div>
  );
  return (
    <div className="verdict v-bad" key={r.k}>
      <div className="seal"><Ic n="x" s={32} /></div>
      <h3>NOT VALID</h3>
      <div className="who">No pass matches this code</div>
      <div className="meta">READ: {r.raw ? r.raw.slice(0, 32) : "UNREADABLE"}<br />SEND TO THE HELP DESK</div>
    </div>
  );
}

function Gate({ onOpen }) {
  const [k, setK] = useState(""), [bad, setBad] = useState(false);
  const go = () => {
    if (k.trim().toUpperCase() === ADMIN_KEY) { soundOk(); onOpen(); }
    else { setBad(true); soundBad(); setTimeout(() => setBad(false), 700); }
  };
  return (
    <div className="view gate">
      <div className="lockring"><Ic n="key" s={26} /></div>
      <h2 style={{ fontFamily: "var(--display)", fontSize: 31, fontWeight: 800, letterSpacing: "-.035em", marginBottom: 8 }}>Coordinator desk</h2>
      <p style={{ color: "var(--fg-soft)", fontSize: 14.5, lineHeight: 1.6, marginBottom: 26 }}>
        Shortlisting, scanning and the attendance register live behind this key, separate from the candidate side.
      </p>
      <div className={"field" + (bad ? " bad" : "")} style={{ textAlign: "left" }}>
        <label>Coordinator key</label>
        <input type="password" value={k} onChange={e => setK(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="•••••••••" />
        {bad && <div className="err">Wrong key. Ask the club secretary for this round's key.</div>}
      </div>
      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={go}><Ic n="shield" />Open desk</button>
      <div className="hint">Demo key: <b>{ADMIN_KEY}</b></div>
    </div>
  );
}

function Requests({ people, approve, decline }) {
  const queue = people.filter(p => p.status === "pending");
  if (!queue.length) return (
    <div className="empty-state">
      <div className="pulser" style={{ color: "var(--jade)", marginBottom: 18 }}><Ic n="check" s={30} /></div>
      Queue is clear. Every application has been decided.<br />New ones appear here the moment a candidate applies.
    </div>
  );
  return (
    <div className="req-grid">
      {queue.map((p, i) => (
        <div className="req" key={p.id} style={{ "--i": i }}>
          <div className="req-head">
            <Face src={p.photo} seed={p.email} name={p.name} />
            <div style={{ minWidth: 0 }}>
              <b>{p.name}</b>
              <span>{p.org}</span>
              <span style={{ marginTop: 4 }}>{p.email}</span>
            </div>
          </div>
          <div className="req-meta">
            REF {p.ref}<br />DOMAIN · {p.domain.toUpperCase()}<br />APPLIED {ago(p.applied)}
          </div>
          <div className="req-actions">
            <button className="btn btn-jade btn-sm" onClick={() => approve(p.id)}><Ic n="check" s={15} />Approve</button>
            <button className="btn btn-red btn-sm" onClick={() => decline(p.id)}><Ic n="x" s={15} />Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Register({ people, feed, onReset, toast }) {
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const s = useMemo(() => {
    const total = people.length;
    const approved = people.filter(p => p.status === "approved").length;
    const inside = people.filter(p => p.attended).length;
    const waiting = people.filter(p => p.status === "pending").length;
    return { total, approved, inside, waiting, pct: approved ? Math.round(inside / approved * 100) : 0 };
  }, [people]);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return people.filter(p => {
      if (filter === "in" && !p.attended) return false;
      if (filter === "out" && !(p.status === "approved" && !p.attended)) return false;
      if (filter === "wait" && p.status !== "pending") return false;
      if (!t) return true;
      return (p.name + p.email + (p.code || "") + p.ref + p.org).toLowerCase().includes(t);
    });
  }, [people, filter, q]);
  const C = 2 * Math.PI * 44;

  const exportCsv = () => {
    const head = "Reference,PassID,Name,Email,Phone,CourseYear,Domain,Approval,Slot,Attendance,AppliedAt,CheckedInAt";
    const body = people.map(p => [p.ref, p.code || "", p.name, p.email, p.phone, p.org, p.domain,
      p.status, p.slot || "", p.attended ? "Attended" : "Not attended", p.applied, p.at || ""]
      .map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","));
    const blob = new Blob([[head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vividhata-interviews.csv";
    a.click();
    toast("Register exported as CSV", "ok");
  };

  const tagFor = (p) => {
    if (p.status === "pending") return <span className="tag wait">IN REVIEW</span>;
    if (p.status === "declined") return <span className="tag no">DECLINED</span>;
    if (p.attended) return <span className="tag ok">ATTENDED</span>;
    return <span className="tag pend">SHORTLISTED</span>;
  };

  return (
    <div>
      <div className="dash-top">
        <div className="metrics">
          <div className="metric"><div className="n"><Counter to={s.total} /></div><div className="l">Applications</div></div>
          <div className="metric"><div className="n" style={{ color: "var(--accent)" }}><Counter to={s.waiting} /></div><div className="l">Awaiting review</div></div>
          <div className="metric"><div className="n"><Counter to={s.approved} /></div><div className="l">Shortlisted</div></div>
          <div className="metric"><div className="n" style={{ color: "var(--jade)" }}><Counter to={s.inside} /></div><div className="l">Interviewed</div></div>
        </div>
        <div className="donut">
          <svg width="108" height="108" viewBox="0 0 108 108">
            <circle className="trk" cx="54" cy="54" r="44" fill="none" strokeWidth="10" />
            <circle className="val" cx="54" cy="54" r="44" fill="none" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C - C * s.pct / 100} transform="rotate(-90 54 54)" />
          </svg>
          <div>
            <div className="pctn"><Counter to={s.pct} />%</div>
            <div className="pctl">Turnout of<br />shortlisted</div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panel-head">
            <h3>Interview register</h3>
            <div className="searchbox">
              <Ic n="find" s={14} />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, ref, ID" />
            </div>
            <div className="seg">
              <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
              <button className={filter === "wait" ? "on" : ""} onClick={() => setFilter("wait")}>Review</button>
              <button className={filter === "out" ? "on" : ""} onClick={() => setFilter("out")}>Expected</button>
              <button className={filter === "in" ? "on" : ""} onClick={() => setFilter("in")}>In</button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Candidate</th><th>Pass ID</th><th>Domain</th><th>Slot</th><th>Status</th><th>Entered</th></tr></thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id} style={{ "--i": i }}>
                    <td><div className="cellp">
                      <Face src={p.photo} seed={p.email} name={p.name} />
                      <div><div className="nm">{p.name}</div><div className="em">{p.org}</div></div>
                    </div></td>
                    <td className="mono">{p.code || p.ref}</td>
                    <td className="mono">{p.domain}</td>
                    <td className="mono">{p.slot || "—"}</td>
                    <td>{tagFor(p)}</td>
                    <td className="mono">{p.attended ? clock(p.at) : "—"}</td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan="6" style={{ textAlign: "center", padding: 42, color: "var(--fg-soft)" }}>Nothing matches that search.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="panel">
            <div className="panel-head"><h3>Door activity</h3><span style={{ marginLeft: "auto" }} className="dot" /></div>
            <div className="feed">
              {feed.length ? feed.map((f, i) => (
                <div className="feed-row" key={f.at + f.code} style={{ animationDelay: (i * 50) + "ms" }}>
                  <Face src={f.photo} seed={f.email} name={f.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="fn">{f.name}</div>
                    <div className="ft">{f.code}</div>
                  </div>
                  <div className="ft" style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--fg-soft)" }}>{clock(f.at)}</div>
                </div>
              )) : <div className="feed-empty">No scans yet in this session.<br />Check someone in and it appears here instantly.</div>}
            </div>
          </div>
          <div className="tools">
            <button className="btn btn-solid btn-sm" onClick={exportCsv}><Ic n="down" s={15} />Export CSV</button>
            <button className="btn btn-ghost btn-sm" onClick={onReset}><Ic n="reload" s={15} />Reset demo data</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Desk({ people, feed, checkIn, approve, decline, onReset, toast, pending }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("queue");
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState("");

  const handle = useCallback((raw) => setResult({ ...checkIn(raw), k: Date.now() }), [checkIn]);
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 4000);
    return () => clearTimeout(t);
  }, [result]);

  if (!open) return <Gate onOpen={() => setOpen(true)} />;

  return (
    <div className="view">
      <div className="panel-head" style={{ padding: "0 0 22px", border: 0 }}>
        <div className="seg" style={{ marginLeft: 0 }}>
          <button className={tab === "queue" ? "on" : ""} onClick={() => setTab("queue")}>
            Requests{pending > 0 && <span className="pip">{pending}</span>}
          </button>
          <button className={tab === "scan" ? "on" : ""} onClick={() => setTab("scan")}>Door scan</button>
          <button className={tab === "reg" ? "on" : ""} onClick={() => setTab("reg")}>Register</button>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setOpen(false)}><Ic n="out" s={15} />Lock desk</button>
      </div>

      {tab === "queue" && (
        <div>
          <div className="eyebrow">Shortlisting · approval issues the pass</div>
          <Requests people={people} approve={approve} decline={decline} />
        </div>
      )}

      {tab === "scan" && (
        <div className="scan-wrap">
          <div>
            <div className="eyebrow">{CLUB.room} · Reader</div>
            <Scanner onRead={handle} />
            <div className="manual">
              <input value={manual} onChange={e => setManual(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && manual.trim()) { handle(manual); setManual(""); } }}
                placeholder="VIV-XXXX-XXXX" />
              <button className="btn btn-primary btn-sm" onClick={() => { if (manual.trim()) { handle(manual); setManual(""); } }}><Ic n="check" s={15} />Check in</button>
            </div>
          </div>
          <div>
            <div className="eyebrow">Verdict</div>
            <div className="readout">
              <div className="ro-head"><span>Door reader</span><span>{result ? "RESULT" : "STANDBY"}</span></div>
              <div className="ro-body"><Verdict r={result} /></div>
              {result && <div className="timer" key={result.k}><i /></div>}
            </div>
          </div>
        </div>
      )}

      {tab === "reg" && <Register people={people} feed={feed} onReset={onReset} toast={toast} />}
    </div>
  );
}
