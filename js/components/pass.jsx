function Pass({ p, tilt }) {
  const card = useRef(null);
  const [saving, setSaving] = useState(false);
  const [big, setBig] = useState(false);
  const admitted = p && p.attended;

  const savePass = async () => {
    if (!card.current || !window.html2canvas || saving) return;
    setSaving(true);
    card.current.classList.add("capturing");
    try {
      const shot = await window.html2canvas(card.current, {
        scale: 3, useCORS: true, allowTaint: false, backgroundColor: "#0B1120", logging: false,
      });
      const a = document.createElement("a");
      a.href = shot.toDataURL("image/png");
      a.download = (p.code || "vividhata-pass") + ".png";
      a.click();
    } catch (e) {
      const im = card.current.querySelector(".qr-box img");
      if (im) {
        const a = document.createElement("a");
        a.href = im.src;
        a.download = (p.code || "pass") + "-qr.png";
        a.click();
      }
    }
    card.current.classList.remove("capturing");
    setSaving(false);
  };

  return (
    <React.Fragment>
    <div className={"pass" + (tilt ? " tilt" : "")} ref={card}>
      <div className="pass-top"><b>{CLUB.name} · {CLUB.edition.toUpperCase()}</b><span>{CLUB.room}</span></div>
      <div className="pass-body">
        <Face src={p && p.photo} seed={p && p.ref ? p.email : "vividhata"} name={p && p.name} />
        <div className="pass-fields">
          <div className="pf"><label>Candidate</label><p>{p && p.name ? p.name : "—"}</p></div>
          <div className="pf"><label>Course &amp; year</label><p>{p && p.org ? p.org : "—"}</p></div>
          <div className="pf-row">
            <div className="pf"><label>Domain</label><p>{p && p.domain ? p.domain : "—"}</p></div>
            <div className="pf"><label>Slot</label><p>{p && p.slot ? p.slot : "—"}</p></div>
          </div>
          <div className="pf"><label>Pass ID</label><p className="code">{p && p.code ? p.code : "VIV-••••-••••"}</p></div>
        </div>
      </div>
      <div className="perf"><i className="notch l" /><i className="notch r" /></div>
      <div className="pass-stub">
        <div>
          <div className="stub-meta">
            {CLUB.day.toUpperCase()}<br />{CLUB.venue.toUpperCase()}<br />
            {admitted ? "IN AT " + clock(p.at) : "NOT YET SCANNED"}
          </div>
          <div className={"chip " + (p && p.specimen ? "specimen" : admitted ? "admitted" : "pending")}>
            <Flip text={p && p.specimen ? "SPECIMEN" : admitted ? "ATTENDED" : "AWAITING ENTRY"} />
          </div>
        </div>
        <div className="qr-box"><Qr value={p && p.code ? p.code : ""} /></div>
      </div>
      {p && p.code && !p.specimen && (
        <div className="pass-actions">
          <button className="btn btn-solid btn-sm" onClick={savePass} disabled={saving}>
            <Ic n="down" s={15} />{saving ? "Rendering…" : "Download pass"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setBig(true)}><Ic n="expand" s={15} />Present</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard && navigator.clipboard.writeText(p.code)}><Ic n="copy" s={15} />Copy ID</button>
        </div>
      )}
    </div>
    {big && p && p.code && (
      <div className="qr-full" onClick={() => setBig(false)}>
        <div className="qr-full-card" onClick={e => e.stopPropagation()}>
          <Qr value={p.code} size={Math.min(400, Math.round(window.innerWidth * 0.74))} />
          <b>{p.code}</b>
          <span>{p.name} · {CLUB.room}</span>
          <button className="btn btn-solid btn-sm" onClick={() => setBig(false)}><Ic n="x" s={15} />Close</button>
        </div>
      </div>
    )}
    </React.Fragment>
  );
}
