const { useState, useEffect, useRef, useMemo, useCallback } = React;

const CLUB = {
  name: "VIVIDHATA",
  edition: "Club Interviews",
  venue: "SHD Hall, AB 1",
  day: "14 August 2026",
  room: "SHD HALL · AB 1",
};

const DOMAINS = ["Design", "Technical", "Events", "Content", "Outreach"];
const ADMIN_KEY = "VIVID2026";

const FACES = [
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61",
  "https://images.unsplash.com/photo-1521146764736-56c929d59c83",
  "https://images.unsplash.com/photo-1499996860823-5214fcc65f8f",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce",
  "https://images.unsplash.com/photo-1587397845856-e6cf49176c70",
];
const FACE_PARAMS = "?auto=format&fit=crop&crop=faces&w=240&h=300&q=70";
const faceFor = (seed) => {
  let h = 5381;
  const s = String(seed || "x");
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return FACES[h % FACES.length] + FACE_PARAMS;
};

const ICONS = {
  home:["M3 10.6 12 3.4l9 7.2","M5.4 9.4V20a.8.8 0 0 0 .8.8h11.6a.8.8 0 0 0 .8-.8V9.4"],
  add:["M16 20v-1.6a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.4V20","M9.5 3.6a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4","M18.5 8v6","M21.5 11h-6"],
  ticket:["M3 8.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.9a2.1 2.1 0 0 0 0 3.2v1.9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.9a2.1 2.1 0 0 0 0-3.2z","M14 6.5v11"],
  shield:["M12 3.2 19.4 6v6.1c0 4.6-3.2 7.7-7.4 8.7-4.2-1-7.4-4.1-7.4-8.7V6z"],
  scan:["M4 8.4V5.6A1.6 1.6 0 0 1 5.6 4h2.8","M15.6 4h2.8A1.6 1.6 0 0 1 20 5.6v2.8","M20 15.6v2.8a1.6 1.6 0 0 1-1.6 1.6h-2.8","M8.4 20H5.6A1.6 1.6 0 0 1 4 18.4v-2.8","M4 12h16"],
  inbox:["M20.6 12.6h-5l-1.6 2.4h-4l-1.6-2.4h-5","M6.2 4.6h11.6l2.8 8v5.2a1.6 1.6 0 0 1-1.6 1.6H5a1.6 1.6 0 0 1-1.6-1.6v-5.2z"],
  chart:["M4.5 20V11","M9.8 20V4.5","M15.1 20v-6","M20.4 20V8.6"],
  check:["M20 6.4 9.4 17 4.6 12.2"],
  bang:["M12 8.6v4.6","M12 16.8h.01","M10.4 3.9 1.9 18.3a1.8 1.8 0 0 0 1.6 2.7h17a1.8 1.8 0 0 0 1.6-2.7L13.6 3.9a1.8 1.8 0 0 0-3.2 0z"],
  x:["M18.4 5.6 5.6 18.4","M5.6 5.6l12.8 12.8"],
  down:["M12 3.4v11.4","M7.4 10.6 12 15.2l4.6-4.6","M4 20.6h16"],
  find:["M11 18.6a7.6 7.6 0 1 0 0-15.2 7.6 7.6 0 0 0 0 15.2","M20.6 20.6l-4.2-4.2"],
  cam:["M21.4 18.8a1.8 1.8 0 0 1-1.8 1.8H4.4a1.8 1.8 0 0 1-1.8-1.8V8.6a1.8 1.8 0 0 1 1.8-1.8h3L9 4h6l1.6 2.8h3a1.8 1.8 0 0 1 1.8 1.8z","M12 17.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2"],
  up:["M12 20.6V9.2","M7.4 13.4 12 8.8l4.6 4.6","M4 4h16"],
  out:["M9.4 20.6H5.6A1.6 1.6 0 0 1 4 19V5A1.6 1.6 0 0 1 5.6 3.4h3.8","M16 16.6l4.6-4.6L16 7.4","M20.6 12H9.4"],
  mail:["M3.4 6.4h17.2v11.2H3.4z","M3.4 7.2 12 13l8.6-5.8"],
  key:["M14.6 3.4a6 6 0 1 0-4.4 10.2L9 14.8H6.6v2.4H4.2v2.4H2.4v-3l7-7a6 6 0 0 1 5.2-6.2","M16.4 7.6h.01"],
  clock:["M12 20.6a8.6 8.6 0 1 0 0-17.2 8.6 8.6 0 0 0 0 17.2","M12 7.2V12l3.2 2.1"],
  reload:["M20.6 12a8.6 8.6 0 1 1-2.9-6.4","M20.6 3.4v5.8h-5.8"],
  copy:["M9.4 9.4h9.2a1.4 1.4 0 0 1 1.4 1.4v9.2a1.4 1.4 0 0 1-1.4 1.4H9.4A1.4 1.4 0 0 1 8 20V10.8a1.4 1.4 0 0 1 1.4-1.4","M5.4 15.4H4.6A1.6 1.6 0 0 1 3 13.8V4.6A1.6 1.6 0 0 1 4.6 3h9.2a1.6 1.6 0 0 1 1.6 1.6v.8"],
  image:["M4.6 3.6h14.8a1 1 0 0 1 1 1v14.8a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1","M8.8 10.4a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2","M20.4 15.4 15.6 11 4.6 20.4"],
  expand:["M9.4 3.6H4.6a1 1 0 0 0-1 1v4.8","M14.6 3.6h4.8a1 1 0 0 1 1 1v4.8","M20.4 14.6v4.8a1 1 0 0 1-1 1h-4.8","M9.4 20.4H4.6a1 1 0 0 1-1-1v-4.8"],
};
