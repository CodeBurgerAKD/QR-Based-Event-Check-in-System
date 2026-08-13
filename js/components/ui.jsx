const Ic = ({ n, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {(ICONS[n] || []).map((d, i) => <path key={i} d={d} />)}
  </svg>
);

function Face({ src, seed, name, cls = "" }) {
  const url = src || faceFor(seed || name);
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [url]);
  if (bad) return <div className={"face mono " + cls}>{initials(name)}</div>;
  const remote = /^https?:/.test(url);
  return <img className={"face " + cls} src={url} alt=""
    crossOrigin={remote ? "anonymous" : undefined} onError={() => setBad(true)} />;
}

function Qr({ value, size = 142 }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!value || !window.QRious) { setUrl(""); return; }
    const c = document.createElement("canvas");
    new window.QRious({ element: c, value, size, level: "M", padding: 8, background: "#ffffff", foreground: "#0B1120" });
    setUrl(c.toDataURL("image/png"));
  }, [value, size]);
  if (!value) return <div className="qr-empty">CODE<br />ISSUED ON<br />APPROVAL</div>;
  if (!url) return <div className="qr-empty">{value}</div>;
  return <img src={url} width={size} height={size} alt={value} />;
}

function Flip({ text }) {
  return (
    <span className="flip" key={text}>
      {text.split("").map((c, i) => <span key={i} style={{ "--c": i }}>{c === " " ? "\u00A0" : c}</span>)}
    </span>
  );
}

function Counter({ to, dur = 900 }) {
  const [v, setV] = useState(to);
  const from = useRef(to);
  useEffect(() => {
    const a = from.current, b = to;
    if (a === b) return;
    const t0 = performance.now();
    let raf;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(a + (b - a) * e));
      if (p < 1) raf = requestAnimationFrame(step); else from.current = b;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return <React.Fragment>{v}</React.Fragment>;
}

function Confetti({ fire }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!fire || !ref.current) return;
    const cv = ref.current, ctx = cv.getContext("2d");
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const cols = ["#F5A524", "#17B57E", "#5B8CFF", "#FBF8F1", "#FF4B3E"];
    const bits = Array.from({ length: 130 }, () => ({
      x: cv.width / 2 + (Math.random() - .5) * 340, y: cv.height * .34,
      vx: (Math.random() - .5) * 13, vy: Math.random() * -15 - 5,
      w: 5 + Math.random() * 7, h: 8 + Math.random() * 10,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      c: cols[Math.floor(Math.random() * cols.length)], life: 1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      let alive = false;
      bits.forEach(b => {
        b.vy += .42; b.vx *= .992; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        if (b.y > cv.height * .62) b.life -= .016;
        if (b.life > 0) {
          alive = true;
          ctx.save(); ctx.globalAlpha = Math.max(0, b.life);
          ctx.translate(b.x, b.y); ctx.rotate(b.r);
          ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
          ctx.restore();
        }
      });
      if (alive) raf = requestAnimationFrame(draw); else ctx.clearRect(0, 0, cv.width, cv.height);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas className="confetti" ref={ref} />;
}

function NotFound({ query, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => { clearTimeout(t); window.removeEventListener("keydown", k); };
  }, [onClose]);
  return (
    <div className="nf-wrap" onClick={onClose}>
      <div className="nf-card" onClick={e => e.stopPropagation()}>
        <svg className="nf-mark" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" />
          <path className="s1" d="M44 44 L76 76" />
          <path className="s2" d="M76 44 L44 76" />
        </svg>
        <h3>Ticket not found</h3>
        <p>No interview pass is registered under<br /><b>{query}</b></p>
        <button className="btn btn-ghost btn-sm nf-close" onClick={onClose}><Ic n="x" s={15} />Close</button>
        <div className="nf-timer"><i /></div>
      </div>
    </div>
  );
}
