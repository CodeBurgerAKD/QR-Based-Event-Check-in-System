let actx = null;
const beep = (f, dur, type = "sine", vol = 0.05) => {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) {}
};
const soundOk = () => { beep(700, .1); setTimeout(() => beep(1050, .17), 95); };
const soundDup = () => { beep(340, .16, "square", .045); setTimeout(() => beep(300, .2, "square", .04), 150); };
const soundBad = () => { beep(190, .18, "sawtooth", .045); setTimeout(() => beep(130, .3, "sawtooth", .04), 160); };

const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const rand = (n) => {
  let s = "";
  for (let i = 0; i < n; i++) s += ALPH[Math.floor(Math.random() * ALPH.length)];
  return s;
};
const newCode = () => "VIV-" + rand(4) + "-" + rand(4);
const newRef = () => "REQ-" + rand(5);
const initials = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const clock = (iso) => iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--";
const stamp = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " + clock(iso) : "—";
const ago = (iso) => {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + " min ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + (h === 1 ? " hour ago" : " hours ago");
  const d = Math.floor(h / 24);
  return d + (d === 1 ? " day ago" : " days ago");
};
const slotAt = (i) => {
  const start = 10 * 60 + i * 15;
  const h = Math.floor(start / 60), m = start % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
};
