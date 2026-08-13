function PhotoPicker({ value, onChange }) {
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const take = (file) => {
    if (!file || !/^image\//.test(file.type)) return;
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 420 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      onChange(c.toDataURL("image/jpeg", .86));
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };
  return (
    <div className={"drop" + (over ? " over" : "")}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}>
      {value
        ? <img className="drop-thumb" src={value} alt="" style={{ objectFit: "cover" }} />
        : <div className="drop-thumb"><Ic n="image" s={20} /></div>}
      <div className="drop-txt">
        <b>{value ? "Photo ready" : "Add your photo"}</b>
        <span>{value ? "This is what prints on your pass." : "Drop a file or browse. Leave it empty and we'll place a stock portrait."}</span>
        <button className="link-btn" onClick={() => value ? onChange(null) : input.current.click()}>
          {value ? "Remove photo" : "Browse files"}
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => { take(e.target.files[0]); e.target.value = ""; }} />
    </div>
  );
}

function Home({ stats, go }) {
  return (
    <div className="view">
      <div className="hero-grid">
        <div>
          <div className="eyebrow rise" style={{ "--i": 0 }}>{CLUB.day} · {CLUB.venue}</div>
          <h1 className="hero rise" style={{ "--i": 1 }}>Apply once.<br />Get shortlisted. <em>Walk in.</em></h1>
          <p className="lede rise" style={{ "--i": 2 }}>
            Vividhata runs its interviews on passes, not lists. Apply, wait for a coordinator to shortlist you,
            then pull up your pass by email. One QR, one scan, one entry.
          </p>
          <div className="cta-row rise" style={{ "--i": 3 }}>
            <button className="btn btn-primary" onClick={() => go("apply")}><Ic n="add" />Apply for an interview</button>
            <button className="btn btn-ghost" onClick={() => go("pass")}><Ic n="find" />Check my pass</button>
          </div>
        </div>
        <div className="pass-stage rise" style={{ "--i": 2 }}><Pass p={SPECIMEN} tilt /></div>
      </div>

      <div className="eyebrow">Live from the door</div>
      <div className="stat-strip">
        <div className="stat-cell"><div className="n"><Counter to={stats.total} /></div><div className="l">Applications</div></div>
        <div className="stat-cell"><div className="n" style={{ color: "var(--accent)" }}><Counter to={stats.waiting} /></div><div className="l">Awaiting review</div></div>
        <div className="stat-cell"><div className="n"><Counter to={stats.approved} /></div><div className="l">Shortlisted</div></div>
        <div className="stat-cell"><div className="n" style={{ color: "var(--jade)" }}><Counter to={stats.inside} /></div><div className="l">Interviewed</div></div>
      </div>

      <div className="flow">
        {[
          ["Apply", "Fill the form with your domain and photo. You get a reference number straight away."],
          ["Shortlist", "A coordinator reviews every application by hand and approves or declines it."],
          ["Pass issued", "Approval mints a unique QR and books your slot. Search your email to pull it up."],
          ["Scan", "Show it at SHD Hall, AB 1. The pass burns on first scan, so nobody enters twice."],
        ].map(([h, p], i) => (
          <div className="step" key={h}>
            <div className="num">STAGE {String(i + 1).padStart(2, "0")}</div>
            <h4>{h}</h4><p>{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Apply({ onApply, toast }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", org: "", domain: "Design", photo: null });
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErrs({ ...errs, [k]: null }); };

  const submit = () => {
    const e = {};
    if (f.name.trim().length < 3) e.name = "Enter your full name as it should print on the pass.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "You'll search for your pass with this address, so check it.";
    if (!/^\d{10}$/.test(f.phone.replace(/\D/g, ""))) e.phone = "Phone number needs 10 digits.";
    if (f.org.trim().length < 2) e.org = "Add your course and year, like B.Tech CSE, 2nd Year.";
    setErrs(e);
    if (Object.keys(e).length) { soundBad(); return; }
    setBusy(true);
    setTimeout(() => {
      const r = onApply(f);
      setBusy(false);
      if (!r.ok) { setErrs({ email: r.message }); soundBad(); toast(r.message, "warn"); }
    }, 640);
  };

  return (
    <div className="view split">
      <div className="card">
        <div className="eyebrow">Application</div>
        <h2>Apply for an interview</h2>
        <p className="sub">Coordinators review applications by hand. Nothing is issued until one of them approves yours.</p>

        <div className={"field" + (errs.name ? " bad" : "")}>
          <label>Full name</label>
          <input value={f.name} onChange={set("name")} placeholder="Meera Krishnan" />
          {errs.name && <div className="err">{errs.name}</div>}
        </div>
        <div className={"field" + (errs.email ? " bad" : "")}>
          <label>College email</label>
          <input value={f.email} onChange={set("email")} placeholder="you@dtu.ac.in" />
          {errs.email && <div className="err">{errs.email}</div>}
        </div>
        <div className={"field" + (errs.phone ? " bad" : "")}>
          <label>Phone</label>
          <input value={f.phone} onChange={set("phone")} placeholder="98100 45221" />
          {errs.phone && <div className="err">{errs.phone}</div>}
        </div>
        <div className={"field" + (errs.org ? " bad" : "")}>
          <label>Course and year</label>
          <input value={f.org} onChange={set("org")} placeholder="B.Des, 2nd Year" />
          {errs.org && <div className="err">{errs.org}</div>}
        </div>
        <div className="field">
          <label>Domain you're applying to</label>
          <div className="chips">
            {DOMAINS.map(d => <button key={d} className={f.domain === d ? "on" : ""} onClick={() => setF({ ...f, domain: d })}>{d}</button>)}
          </div>
        </div>
        <div className="field">
          <label>Pass photo</label>
          <PhotoPicker value={f.photo} onChange={(photo) => setF({ ...f, photo })} />
        </div>

        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={submit} disabled={busy}>
          {busy ? "Sending application…" : <React.Fragment><Ic n="mail" />Send application</React.Fragment>}
        </button>
      </div>

      <div>
        <div className="eyebrow">Live preview</div>
        <div className="pass-stage"><Pass p={f} /></div>
      </div>
    </div>
  );
}

function Submitted({ p, go }) {
  return (
    <div className="view" style={{ maxWidth: 620, margin: "0 auto", paddingTop: 20 }}>
      <div className="card state-card">
        <div className="pulser"><i /><i /><i /><Ic n="clock" s={30} /></div>
        <h3>Application received</h3>
        <p>Coordinators review in batches, usually within a few hours. Nothing lands in your inbox yet — come back to
          <b> Check my pass</b> and search with <b>{p.email}</b>.</p>
        <div className="refbox">{p.ref}</div>
        <div className="ticker">Status · awaiting review</div>
        <div className="cta-row" style={{ justifyContent: "center", marginTop: 28 }}>
          <button className="btn btn-primary" onClick={() => go("pass")}><Ic n="find" />Check my pass</button>
          <button className="btn btn-ghost" onClick={() => go("apply")}><Ic n="add" />Apply for someone else</button>
        </div>
      </div>
    </div>
  );
}

function Waiting({ p }) {
  return (
    <div className="card state-card">
      <div className="pulser"><i /><i /><i /><Ic n="clock" s={30} /></div>
      <h3>Still under review</h3>
      <p>Your application for <b>{p.domain}</b> is in the coordinators' queue. A pass and QR code are issued the moment it's approved.</p>
      <div className="refbox">{p.ref}</div>
      <div className="ticker">Applied {ago(p.applied)}</div>
    </div>
  );
}

function Declined({ p }) {
  return (
    <div className="card state-card">
      <div className="pulser" style={{ color: "var(--vermilion)" }}><Ic n="x" s={32} /></div>
      <h3 style={{ color: "#FF6A5C" }}>Not shortlisted</h3>
      <p>The coordinators didn't shortlist this application for <b>{p.domain}</b> this round. Vividhata recruits again next semester.</p>
      <div className="refbox">{p.ref}</div>
      <div className="ticker" style={{ color: "var(--fg-soft)" }}>Decided {ago(p.decided || p.applied)}</div>
    </div>
  );
}

function Lookup({ people, notFound }) {
  const [q, setQ] = useState("");
  const [hit, setHit] = useState(null);
  const find = () => {
    const t = q.trim().toLowerCase();
    if (!t) return;
    const p = people.find(x => x.email.toLowerCase() === t || (x.code || "").toLowerCase() === t || x.ref.toLowerCase() === t);
    if (p) { setHit(p); soundOk(); }
    else { setHit(null); soundBad(); notFound(q.trim()); }
  };
  const live = hit ? people.find(x => x.id === hit.id) : null;
  return (
    <div className="view split">
      <div className="card">
        <div className="eyebrow">Pass lookup</div>
        <h2>Check my pass</h2>
        <p className="sub">Search with the email you applied from. Your reference number or pass ID works too.</p>
        <div className="field">
          <label>Email, reference or pass ID</label>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && find()} placeholder="you@dtu.ac.in" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={find}><Ic n="find" />Find my pass</button>
        <div className="hint">Approved: <b>meera.k@dtu.ac.in</b> · Waiting: <b>priya.n@dtu.ac.in</b></div>
      </div>
      <div>
        <div className="eyebrow">{live ? "Result" : "Nothing loaded"}</div>
        <div className="pass-stage">
          {!live && <div className="card state-card" style={{ width: "100%" }}>
            <div className="pulser" style={{ color: "var(--fg-soft)" }}><Ic n="ticket" s={30} /></div>
            <h3 style={{ fontSize: 21 }}>Search to see your status</h3>
            <p>Approved passes show a QR here. Applications still in review show where they stand.</p>
          </div>}
          {live && live.status === "pending" && <Waiting p={live} />}
          {live && live.status === "declined" && <Declined p={live} />}
          {live && live.status === "approved" && <Pass key={live.code + live.attended} p={live} />}
        </div>
      </div>
    </div>
  );
}
