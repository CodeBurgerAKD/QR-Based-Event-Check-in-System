const mk = (o) => Object.assign({ photo: null, code: null, slot: null, attended: false, at: null, decided: null }, o);
const SEED = [
  mk({ id: 1, name: "Ananya Raghav", email: "ananya.raghav@dtu.ac.in", phone: "9810045221", org: "B.Tech CSE, 2nd Year", domain: "Design", ref: "REQ-K7P2M", status: "approved", code: "VIV-K7P2-M4XQ", slot: "10:00", attended: true, at: new Date(Date.now() - 42 * 60000).toISOString(), applied: new Date(Date.now() - 6 * 864e5).toISOString() }),
  mk({ id: 2, name: "Vikram Sethi", email: "vikram.sethi@dtu.ac.in", phone: "9900123408", org: "B.Tech ECE, 3rd Year", domain: "Events", ref: "REQ-B3RD9", status: "approved", code: "VIV-B3RD-9HTL", slot: "10:15", attended: true, at: new Date(Date.now() - 19 * 60000).toISOString(), applied: new Date(Date.now() - 6 * 864e5).toISOString() }),
  mk({ id: 3, name: "Meera Krishnan", email: "meera.k@dtu.ac.in", phone: "9741188203", org: "B.Des, 2nd Year", domain: "Design", ref: "REQ-XQ48V", status: "approved", code: "VIV-XQ48-VN2C", slot: "10:30", applied: new Date(Date.now() - 5 * 864e5).toISOString() }),
  mk({ id: 4, name: "Rohit Bansal", email: "rohit.bansal@dtu.ac.in", phone: "9634570912", org: "B.Tech IT, 1st Year", domain: "Technical", ref: "REQ-P9WM3", status: "approved", code: "VIV-P9WM-3JD7", slot: "10:45", applied: new Date(Date.now() - 4 * 864e5).toISOString() }),
  mk({ id: 5, name: "Fatima Sheikh", email: "fatima.sheikh@dtu.ac.in", phone: "9022874150", org: "BBA, 2nd Year", domain: "Outreach", ref: "REQ-2HYKQ", status: "pending", applied: new Date(Date.now() - 5 * 36e5).toISOString() }),
  mk({ id: 6, name: "Daniel Mathew", email: "daniel.mathew@dtu.ac.in", phone: "9448210937", org: "B.Tech ME, 3rd Year", domain: "Content", ref: "REQ-LT538", status: "pending", applied: new Date(Date.now() - 2 * 36e5).toISOString() }),
  mk({ id: 7, name: "Priya Nambiar", email: "priya.n@dtu.ac.in", phone: "9812446703", org: "B.Tech CSE, 1st Year", domain: "Technical", ref: "REQ-Z6NW4", status: "pending", applied: new Date(Date.now() - 40 * 60000).toISOString() }),
];

const SPECIMEN = mk({
  id: 0, name: "Meera Krishnan", org: "B.Des, 2nd Year", domain: "Design", slot: "10:30",
  email: "specimen@vividhata.club", ref: "REQ-SAMPLE", status: "approved",
  code: "VIV-SPEC-IMEN", specimen: true, applied: new Date().toISOString(),
});
