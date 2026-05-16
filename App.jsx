import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5WRC372Qs-BogkUDEVbqwfxBTw3YeehA",
  authDomain: "sama-poulet.firebaseapp.com",
  projectId: "sama-poulet",
  storageBucket: "sama-poulet.firebasestorage.app",
  messagingSenderId: "763618619854",
  appId: "1:763618619854:web:7b4b9a50991b639fc1bb9f"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const USERS = {
  "fondateur@samapoulet.com": { nom: "Alune", role: "admin", parts: 59, couleur: "#1A5276" },
  "laye@samapoulet.com": { nom: "Laye", role: "production", parts: 25, couleur: "#1E8449" },
  "daff@samapoulet.com": { nom: "Daff", role: "finances", parts: 16, couleur: "#784212" },
};

const PERMS = {
  admin:      { suivi: true, finances: true, sante: true, strategie: true, associes: true, bandes: true  },
  production: { suivi: true, finances: true, sante: true, strategie: true, associes: true, bandes: true  },
  finances:   { suivi: true, finances: true, sante: true, strategie: true, associes: true, bandes: true  },
};

// Permissions d'écriture (peut modifier/ajouter/supprimer)
const WRITE_PERMS = {
  admin:      { suivi: true,  finances: true,  sante: true  },
  production: { suivi: true,  finances: false, sante: true  },
  finances:   { suivi: false, finances: true,  sante: false },
};

const ASSOCIES = [
  { id: 1, nom: "Alune", role: "Fondateur & Investisseur", parts: 59, couleur: "#1A5276" },
  { id: 2, nom: "Laye", role: "Responsable Production", parts: 25, couleur: "#1E8449" },
  { id: 3, nom: "Daff", role: "Responsable Finances", parts: 16, couleur: "#784212" },
];

const PHASES_INIT = [
  { id: 1, titre: "Étude de faisabilité & cadrage", statut: "done", icon: "📊" },
  { id: 2, titre: "Construction & aménagement", statut: "done", icon: "🏗️" },
  { id: 3, titre: "Plan opérationnel", statut: "active", icon: "⚙️" },
  { id: 4, titre: "Déclarations & cadre légal", statut: "todo", icon: "📝" },
  { id: 5, titre: "Gestion financière", statut: "active", icon: "💰" },
  { id: 6, titre: "Plan marketing", statut: "todo", icon: "📣" },
  { id: 7, titre: "Gestion du personnel", statut: "todo", icon: "👥" },
  { id: 8, titre: "Logiciel de suivi", statut: "active", icon: "💻" },
  { id: 9, titre: "Gestion des risques", statut: "todo", icon: "⚠️" },
  { id: 10, titre: "Répartition des parts & dividendes", statut: "done", icon: "🤝" },
  { id: 11, titre: "Approvisionnement & fournisseurs", statut: "todo", icon: "🛒" },
  { id: 12, titre: "Communication & image de marque", statut: "todo", icon: "🎨" },
  { id: 13, titre: "Stratégie de croissance & scaling", statut: "todo", icon: "🚀" },
  { id: 14, titre: "Plan de sortie & succession", statut: "todo", icon: "🔚" },
];

const RISQUES = [
  { id: 1, risque: "Mauvaise qualité poussins", impact: "Élevé", probabilite: "Haute", mitigation: "Changer fournisseur, exiger certificat sanitaire", couleur: "#C0392B" },
  { id: 2, risque: "Écoulement difficile", impact: "Élevé", probabilite: "Moyenne", mitigation: "3 canaux minimum, pas tout miser sur une fête", couleur: "#E67E22" },
  { id: 3, risque: "Maladie (Newcastle, Gumboro)", impact: "Élevé", probabilite: "Moyenne", mitigation: "Programme vaccination strict, biosécurité", couleur: "#E67E22" },
  { id: 4, risque: "Hausse prix aliments", impact: "Moyen", probabilite: "Haute", mitigation: "Acheter en gros, négocier contrats fournisseurs", couleur: "#F39C12" },
  { id: 5, risque: "Récupération poulailler", impact: "Élevé", probabilite: "Faible", mitigation: "Formaliser contrat avec Gde Sœur Laye", couleur: "#E67E22" },
];

const CANAUX = [
  { id: 1, canal: "Restaurant Eggette (Mbour)", statut: "Contrat signé", priorite: "haute" },
  { id: 2, canal: "Particuliers / marché local", statut: "À développer", priorite: "haute" },
  { id: 3, canal: "Revendeurs / bana-bana Thiès", statut: "À contacter", priorite: "moyenne" },
  { id: 4, canal: "Restaurants & gargotes Thiès", statut: "À prospecter", priorite: "moyenne" },
];

const VACCINS_INIT = [
  { id: "v1", vaccin: "Newcastle (Hitchner B1)", semaine: 1, datePrevue: "21/05/2026", fait: false, dateReelle: "" },
  { id: "v2", vaccin: "Gumboro (IBD)", semaine: 2, datePrevue: "28/05/2026", fait: false, dateReelle: "" },
  { id: "v3", vaccin: "Newcastle (Clone 30)", semaine: 3, datePrevue: "04/06/2026", fait: false, dateReelle: "" },
  { id: "v4", vaccin: "Gumboro rappel", semaine: 3, datePrevue: "04/06/2026", fait: false, dateReelle: "" },
  { id: "v5", vaccin: "Newcastle rappel", semaine: 5, datePrevue: "18/06/2026", fait: false, dateReelle: "" },
];

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " F";
const fmtN = (n) => Number(n || 0).toLocaleString("fr-FR");
const nowTime = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const makeSig = (u) => ({ auteur: u?.nom || "—", heureAction: nowTime(), createdAt: new Date().toISOString() });

const S = {
  app: { fontFamily: "'Segoe UI', sans-serif", background: "#F0F4F8", minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 80 },
  header: { background: "linear-gradient(135deg, #0F2940, #1A4A7A)", padding: "20px 16px 16px", color: "#fff" },
  card: { background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#0F2940", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  kpiRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 },
  kpi: (c) => ({ background: c, borderRadius: 12, padding: "12px 14px", color: "#fff" }),
  kpiVal: { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  kpiLbl: { fontSize: 11, opacity: 0.85, marginTop: 3 },
  nav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #E8ECF0", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 200, boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" },
  navItem: (a) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", opacity: a ? 1 : 0.45 }),
  input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E0E6ED", fontSize: 14, background: "#F8FAFC", boxSizing: "border-box", marginBottom: 8, outline: "none" },
  btn: (c = "#1A5276") => ({ background: c, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 4 }),
  btnSm: (c = "#1A5276") => ({ background: c, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }),
  btnIcon: (c = "#EBF5FB") => ({ background: c, border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontSize: 14 }),
  tag: (c) => ({ background: c + "22", color: c, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-block" }),
  section: { padding: "16px 16px 0" },
  sectionTitle: { fontSize: 16, fontWeight: 800, color: "#0F2940", marginBottom: 12 },
  alert: (c) => ({ background: c + "15", border: `1.5px solid ${c}40`, borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 13 }),
  bar: (p, c) => ({ height: "100%", width: Math.min(Number(p) || 0, 100) + "%", background: c, borderRadius: 4, transition: "width 0.5s" }),
};

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, maxHeight: "88vh", overflow: "auto", padding: 20, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#0F2940" }}>{title}</span>
          <button onClick={onClose} style={{ background: "#F0F4F8", border: "none", borderRadius: 20, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, type = "text", val, set, options }) {
  if (options) return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>{label}</label>
      <select value={val} onChange={e => set(e.target.value)} style={S.input}>
        <option value="">-- Choisir --</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>{label}</label>
      <input type={type} value={val} onChange={e => set(e.target.value)} style={S.input} />
    </div>
  );
}

function SigLine({ auteur, heureAction, modifiePar, heureModif }) {
  return (
    <p style={{ fontSize: 10, color: "#AAB7B8", marginTop: 4, marginBottom: 0 }}>
      ✍️ {auteur || "—"} • {heureAction || ""}
      {modifiePar && <span style={{ color: "#E67E22" }}> • ✏️ {modifiePar} à {heureModif}</span>}
    </p>
  );
}

function AccessDenied() {
  return (
    <div style={{ ...S.card, textAlign: "center", padding: 32, margin: 16 }}>
      <div style={{ fontSize: 40 }}>🔒</div>
      <p style={{ fontWeight: 700, color: "#C0392B", marginTop: 8 }}>Accès non autorisé</p>
      <p style={{ fontSize: 13, color: "#888" }}>Vous n'avez pas les droits pour cette section</p>
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [mode, setMode] = useState("login"); // login | register | reset
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const go = async () => {
    setLoading(true); setErr(""); setMsg("");
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, email);
        setMsg("✅ Email envoyé ! Vérifiez votre boîte mail.");
        setMode("login");
      } else if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, pwd);
      } else {
        await signInWithEmailAndPassword(auth, email, pwd);
      }
    } catch (e) {
      const m = { "auth/invalid-credential": "Email ou mot de passe incorrect", "auth/email-already-in-use": "Email déjà utilisé", "auth/weak-password": "Mot de passe trop court (6 car. min)" };
      setErr(m[e.code] || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0F2940, #1A4A7A 60%, #0F2940)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 70 }}>🐓</div>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: "10px 0 0" }}>SAMA POULET</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 6 }}>Keur Madaro, Thiès • v2.0</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.09)", borderRadius: 20, padding: 24 }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, marginBottom: 14 }}>
            {mode === "reset" ? "🔑 Mot de passe oublié" : mode === "register" ? "Créer un compte" : "Connexion"}
          </p>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ ...S.input, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
          {mode !== "reset" && <input type="password" placeholder="Mot de passe" value={pwd} onChange={e => setPwd(e.target.value)}
            style={{ ...S.input, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />}
          {err && <p style={{ color: "#FF6B6B", fontSize: 12, marginBottom: 8 }}>⚠️ {err}</p>}
          {msg && <p style={{ color: "#51CF66", fontSize: 12, marginBottom: 8 }}>{msg}</p>}
          <button onClick={go} disabled={loading} style={{ ...S.btn("#C9A84C"), opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳..." : mode === "reset" ? "Envoyer l'email" : mode === "register" ? "Créer" : "Se connecter"}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <p onClick={() => setMode(mode === "register" ? "login" : "register")} style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", margin: 0 }}>
              {mode === "register" ? "← Connexion" : "Créer un compte"}
            </p>
            <p onClick={() => setMode(mode === "reset" ? "login" : "reset")} style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: "pointer", margin: 0 }}>
              {mode === "reset" ? "← Retour" : "Mot de passe oublié ?"}
            </p>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 12, marginTop: 14 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0, textAlign: "center", lineHeight: 1.8 }}>
            fondateur@samapoulet.com (Alune — Admin)<br />laye@samapoulet.com (Laye — Production)<br />daff@samapoulet.com (Daff — Finances)
          </p>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ suivi, depenses, ventes, vaccins, userInfo, bandeCfg }) {
  const poussins = bandeCfg?.poussinsDepart || 450;
  const totalMorts = suivi.reduce((s, j) => s + Number(j.morts || 0), 0);
  const effectif = poussins - totalMorts;
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const resultat = totalV - totalDep;
  const nbVendus = ventes.reduce((s, v) => s + Number(v.nbPoulets || 0), 0);
  const dateDebut = bandeCfg?.dateDebut || "2026-05-15";
  const joursEcoules = Math.max(Math.floor((new Date() - new Date(dateDebut)) / 86400000) + 1, 1);
  const semaine = Math.min(Math.ceil(joursEcoules / 7), 8);
  const tauxMort = ((totalMorts / poussins) * 100).toFixed(1);
  const progPct = Math.min((joursEcoules / 42) * 100, 100).toFixed(0);
  const vaccsRestants = vaccins.filter(v => !v.fait).length;
  const stock = bandeCfg?.stockAliments || 0;

  return (
    <div>
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🐓 Sama Poulet v2.0</p>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0" }}>Bonjour {userInfo?.nom} • {bandeCfg?.objectif || "Bande active"}</p>
          </div>
          <span style={{ background: "#C9A84C", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>Sem. {semaine}/6</span>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Progression bande</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{progPct}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.2)" }}>
            <div style={S.bar(progPct, "#C9A84C")} />
          </div>
        </div>
      </div>

      <div style={S.section}>
        {vaccsRestants > 0 && <div style={S.alert("#E67E22")}><span style={{ fontWeight: 700, color: "#E67E22" }}>💉 {vaccsRestants} vaccination(s)</span> à faire — voir onglet Santé</div>}
        {Number(tauxMort) > 5 && <div style={S.alert("#C0392B")}><span style={{ fontWeight: 700, color: "#C0392B" }}>🚨 Mortalité {tauxMort}%</span> — seuil critique dépassé !</div>}
        {stock > 0 && stock < 50 && <div style={S.alert("#C0392B")}><span style={{ fontWeight: 700, color: "#C0392B" }}>⚠️ Stock aliments critique :</span> {fmtN(stock)} kg restants — approvisionner urgent !</div>}

        <div style={S.kpiRow}>
          <div style={S.kpi("#1A5276")}><div style={S.kpiVal}>{fmtN(effectif)}</div><div style={S.kpiLbl}>Effectif actuel</div></div>
          <div style={S.kpi("#C0392B")}><div style={S.kpiVal}>{fmtN(totalMorts)}</div><div style={S.kpiLbl}>Morts ({tauxMort}%)</div></div>
        </div>
        <div style={S.kpiRow}>
          <div style={S.kpi("#1E8449")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(totalV)}</div><div style={S.kpiLbl}>Total ventes</div></div>
          <div style={S.kpi(resultat >= 0 ? "#0F2940" : "#8B1A1A")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(Math.abs(resultat))}</div><div style={S.kpiLbl}>{resultat >= 0 ? "✅ Bénéfice" : "❌ Perte"}</div></div>
        </div>

        {stock > 0 && (
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 12, color: "#888", margin: "0 0 2px" }}>📦 Stock Aliments</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: stock < 50 ? "#C0392B" : "#1E8449", margin: 0 }}>{fmtN(stock)} kg</p>
              </div>
              <span style={S.tag(stock < 50 ? "#C0392B" : stock < 100 ? "#E67E22" : "#1E8449")}>
                {stock < 50 ? "🚨 Critique" : stock < 100 ? "⚠️ Bas" : "✅ OK"}
              </span>
            </div>
          </div>
        )}

        <div style={{ ...S.card, background: "linear-gradient(135deg, #0F2940, #1A4A7A)", color: "#fff" }}>
          <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 8px" }}>🎯 {bandeCfg?.objectif}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: 8 }}>
            {[["Vendus", nbVendus], ["Restants", Math.max(effectif - nbVendus, 0)], ["Départ", poussins]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 20, fontWeight: 800 }}>{fmtN(v)}</div><div style={{ fontSize: 10, opacity: 0.65 }}>{l}</div></div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <p style={S.cardTitle}>📅 Calendrier Bande</p>
          {[
            ["S1 — 15-21 Mai", "Démarrage, eau sucrée, Newcastle"],
            ["S2 — 22-28 Mai", "Aliment démarrage, Gumboro"],
            ["S3 — 29 Mai-4 Juin", "Passage aliment croissance"],
            ["S4 — 5-11 Juin", "Peser les poulets, surveiller"],
            ["S5 — 12-18 Juin", "Aliment finition, contacter acheteurs"],
            ["S6 — 19-26 Juin", "🐔 VENTE — Tamkharite !"],
          ].map(([sem, action], i) => (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{i + 1 < semaine ? "✅" : i + 1 === semaine ? "▶️" : "⏳"}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: i + 1 === semaine ? "#1A5276" : "#666" }}>{sem}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{action}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SUIVI QUOTIDIEN ───────────────────────────────────────────────
function SuiviQuotidien({ suivi, userInfo, bandeCfg, bandeActive }) {
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState({ date: new Date().toISOString().split("T")[0], morts: "", alimentKg: "", poidsMoyen: "", temperature: "", observations: "" });
  const totalMorts = suivi.reduce((s, j) => s + Number(j.morts || 0), 0);
  const effectif = (bandeCfg?.poussinsDepart || 450) - totalMorts;

  if (!PERMS[userInfo?.role]?.suivi) return <AccessDenied />;
  const canWrite = WRITE_PERMS[userInfo?.role]?.suivi;

  const openNew = () => { setEditId(null); setF({ date: new Date().toISOString().split("T")[0], morts: "", alimentKg: "", poidsMoyen: "", temperature: "", observations: "" }); setShow(true); };
  const openEdit = (j) => { setF({ date: j.date, morts: j.morts, alimentKg: j.alimentKg || "", poidsMoyen: j.poidsMoyen || "", temperature: j.temperature || "", observations: j.observations || "" }); setEditId(j.id); setShow(true); };

  const save = async () => {
    if (!f.date) return;
    const data = { ...f, morts: Number(f.morts || 0), effectifFin: effectif - Number(f.morts || 0) };
    if (editId) {
      await updateDoc(doc(db, "samapoulet", bandeActive, "suiviQuotidien", editId), { ...data, modifiePar: userInfo?.nom, heureModif: nowTime() });
    } else {
      await addDoc(collection(db, "samapoulet", bandeActive, "suiviQuotidien"), { ...data, ...makeSig(userInfo) });
    }
    setShow(false); setEditId(null);
  };

  const del = async (id) => { if (window.confirm("Supprimer cette saisie ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "suiviQuotidien", id)); };

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={S.sectionTitle}>🐔 Suivi Quotidien</p>
        {canWrite && <button onClick={openNew} style={S.btnSm("#1E8449")}>+ Saisir</button>}
        {!canWrite && <span style={S.tag("#AAB7B8")}>👁️ Lecture seule</span>}
      </div>
      <div style={S.kpiRow}>
        <div style={S.kpi("#1A5276")}><div style={S.kpiVal}>{fmtN(effectif)}</div><div style={S.kpiLbl}>Effectif actuel</div></div>
        <div style={S.kpi("#C0392B")}><div style={S.kpiVal}>{fmtN(totalMorts)}</div><div style={S.kpiLbl}>Total morts</div></div>
      </div>
      {suivi.length === 0
        ? <div style={{ ...S.card, textAlign: "center", padding: 32, color: "#AAB7B8" }}><div style={{ fontSize: 40 }}>📋</div><p>Aucune saisie</p></div>
        : suivi.slice(0, 15).map(j => (
          <div key={j.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#0F2940" }}>📅 {j.date}</span>
              <div style={{ display: "flex", gap: 5 }}>
                <span style={S.tag(j.morts > 5 ? "#C0392B" : "#1E8449")}>{j.morts} mort(s)</span>
                {canWrite && <button onClick={() => openEdit(j)} style={S.btnIcon()}>✏️</button>}
                {canWrite && <button onClick={() => del(j.id)} style={S.btnIcon("#FFF0F0")}>🗑️</button>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[["Effectif", j.effectifFin], ["Aliment kg", j.alimentKg || "—"], ["Temp °C", j.temperature || "—"]].map(([l, v]) => (
                <div key={l} style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{l}</div>
                </div>
              ))}
            </div>
            {j.observations && <p style={{ fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic", marginBottom: 2 }}>"{j.observations}"</p>}
            <SigLine auteur={j.auteur} heureAction={j.heureAction} modifiePar={j.modifiePar} heureModif={j.heureModif} />
          </div>
        ))
      }
      {show && (
        <Modal title={editId ? "✏️ Modifier la saisie" : "Saisie journalière"} onClose={() => { setShow(false); setEditId(null); }}>
          {[["Date", "date", "date"], ["Nombre de morts", "morts", "number"], ["Aliment consommé (kg)", "alimentKg", "number"], ["Poids moyen (g)", "poidsMoyen", "number"], ["Température (°C)", "temperature", "number"]].map(([l, k, t]) => (
            <Field key={k} label={l} type={t} val={f[k]} set={v => setF(p => ({ ...p, [k]: v }))} />
          ))}
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>Observations</label>
          <textarea value={f.observations} onChange={e => setF(p => ({ ...p, observations: e.target.value }))} style={{ ...S.input, height: 70, resize: "none" }} />
          <button onClick={save} style={S.btn("#1E8449")}>{editId ? "✅ Modifier" : "✅ Enregistrer"}</button>
        </Modal>
      )}
    </div>
  );
}

// ── FINANCES ──────────────────────────────────────────────────────
function Finances({ depenses, ventes, userInfo, bandeActive, bandeCfg, setBandeCfg }) {
  const [tab, setTab] = useState("depenses");
  const [showDep, setShowDep] = useState(false);
  const [showVente, setShowVente] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [dep, setDep] = useState({ date: "", categorie: "", description: "", montant: "" });
  const [vente, setVente] = useState({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "" });
  const [stockAjout, setStockAjout] = useState({ qte: "", type: "Aliment Démarrage" });
  const [editDepId, setEditDepId] = useState(null);
  const [editVenteId, setEditVenteId] = useState(null);

  if (!PERMS[userInfo?.role]?.finances) return <AccessDenied />;
  const canWrite = WRITE_PERMS[userInfo?.role]?.finances;

  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const resultat = totalV - totalDep;
  const benefice = Math.max(resultat, 0);
  const stock = bandeCfg?.stockAliments || 0;
  const cats = ["Poussins", "Aliment Démarrage", "Aliment Croissance", "Aliment Finition", "Vaccins", "Médicaments", "Litière", "Transport", "Autres"];

  const saveDep = async () => {
    if (!dep.montant) return;
    const data = { ...dep, montant: Number(dep.montant) };
    if (editDepId) {
      await updateDoc(doc(db, "samapoulet", bandeActive, "depenses", editDepId), { ...data, modifiePar: userInfo?.nom, heureModif: nowTime() });
      setEditDepId(null);
    } else {
      await addDoc(collection(db, "samapoulet", bandeActive, "depenses"), { ...data, ...makeSig(userInfo) });
    }
    setDep({ date: "", categorie: "", description: "", montant: "" }); setShowDep(false);
  };

  const saveVente = async () => {
    if (!vente.nbPoulets || !vente.prixUnit) return;
    const total = Number(vente.nbPoulets) * Number(vente.prixUnit);
    const data = { ...vente, nbPoulets: Number(vente.nbPoulets), prixUnit: Number(vente.prixUnit), total };
    if (editVenteId) {
      await updateDoc(doc(db, "samapoulet", bandeActive, "ventes", editVenteId), { ...data, modifiePar: userInfo?.nom, heureModif: nowTime() });
      setEditVenteId(null);
    } else {
      await addDoc(collection(db, "samapoulet", bandeActive, "ventes"), { ...data, ...makeSig(userInfo) });
    }
    setVente({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "" }); setShowVente(false);
  };

  const updateStock = async () => {
    const newStock = stock + Number(stockAjout.qte || 0);
    await updateDoc(doc(db, "samapoulet", bandeActive), { stockAliments: newStock });
    setBandeCfg(p => ({ ...p, stockAliments: newStock }));
    setStockAjout({ qte: "", type: "Aliment Démarrage" }); setShowStock(false);
  };

  const delDep = async (id) => { if (window.confirm("Supprimer ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "depenses", id)); };
  const delVente = async (id) => { if (window.confirm("Supprimer ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "ventes", id)); };

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>💰 Finances</p>

      <div style={{ ...S.card, background: "linear-gradient(135deg, #0F2940, #1A4A7A)", color: "#fff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: 8 }}>
          {[["Dépenses", fmt(totalDep), "#FF6B6B"], ["Recettes", fmt(totalV), "#51CF66"], ["Résultat", fmt(Math.abs(resultat)), resultat >= 0 ? "#51CF66" : "#FF6B6B"]].map(([l, v, c]) => (
            <div key={l}><div style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{l}</div></div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, fontWeight: 700, color: resultat >= 0 ? "#51CF66" : "#FF6B6B" }}>
          {resultat >= 0 ? "✅ Bénéfice" : "❌ Perte"} : {fmt(Math.abs(resultat))}
        </div>
      </div>

      {/* Stock Aliments */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ ...S.cardTitle, marginBottom: 0 }}>📦 Stock Aliments</p>
          {canWrite && <button onClick={() => setShowStock(true)} style={S.btnSm("#1A5276")}>+ Approvisionner</button>}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stock < 50 ? "#C0392B" : "#1E8449" }}>{fmtN(stock)} kg</div>
            <div style={{ fontSize: 11, color: "#888" }}>disponibles • seuil alerte : 50 kg</div>
          </div>
          <span style={S.tag(stock < 50 ? "#C0392B" : stock < 100 ? "#E67E22" : "#1E8449")}>
            {stock < 50 ? "🚨 Critique" : stock < 100 ? "⚠️ Bas" : "✅ OK"}
          </span>
        </div>
        <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: "#E8ECF0" }}>
          <div style={S.bar(Math.min(stock / 5, 100), stock < 50 ? "#C0392B" : "#1E8449")} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["depenses", "Dépenses"], ["ventes", "Ventes"], ["dividendes", "Dividendes"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: tab === id ? "#0F2940" : "#E8ECF0", color: tab === id ? "#fff" : "#666" }}>{label}</button>
        ))}
      </div>

      {tab === "depenses" && <>
        {canWrite && <button onClick={() => { setEditDepId(null); setDep({ date: "", categorie: "", description: "", montant: "" }); setShowDep(true); }} style={S.btn("#C0392B")}>+ Ajouter une dépense</button>}
        {!canWrite && <div style={S.alert("#AAB7B8")}><span style={{ color: "#888" }}>👁️ Lecture seule — vous pouvez consulter mais pas modifier</span></div>}
        {depenses.length === 0
          ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#AAB7B8" }}><div style={{ fontSize: 36 }}>💸</div><p>Aucune dépense</p></div>
          : depenses.map(d => (
            <div key={d.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.description || d.categorie}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{d.categorie} • {d.date}</div>
                  <SigLine auteur={d.auteur} heureAction={d.heureAction} modifiePar={d.modifiePar} heureModif={d.heureModif} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontWeight: 800, color: "#C0392B", fontSize: 13 }}>{fmt(d.montant)}</span>
                  {canWrite && <button onClick={() => { setDep({ date: d.date, categorie: d.categorie, description: d.description, montant: d.montant }); setEditDepId(d.id); setShowDep(true); }} style={S.btnIcon()}>✏️</button>}
                  {canWrite && <button onClick={() => delDep(d.id)} style={S.btnIcon("#FFF0F0")}>🗑️</button>}
                </div>
              </div>
            </div>
          ))
        }
      </>}

      {tab === "ventes" && <>
        {canWrite && <button onClick={() => { setEditVenteId(null); setVente({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "" }); setShowVente(true); }} style={S.btn("#1E8449")}>+ Enregistrer une vente</button>}
        {!canWrite && <div style={S.alert("#AAB7B8")}><span style={{ color: "#888" }}>👁️ Lecture seule — vous pouvez consulter mais pas modifier</span></div>}
        {ventes.length === 0
          ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#AAB7B8" }}><div style={{ fontSize: 36 }}>🛒</div><p>Aucune vente</p></div>
          : ventes.map(v => (
            <div key={v.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{v.client}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{v.nbPoulets} poulets × {fmt(v.prixUnit)} • {v.date}</div>
                  <span style={S.tag("#1A5276")}>{v.canal}</span>
                  <SigLine auteur={v.auteur} heureAction={v.heureAction} modifiePar={v.modifiePar} heureModif={v.heureModif} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontWeight: 800, color: "#1E8449", fontSize: 13 }}>{fmt(v.total)}</span>
                  {canWrite && <button onClick={() => { setVente({ date: v.date, client: v.client, canal: v.canal, nbPoulets: v.nbPoulets, prixUnit: v.prixUnit }); setEditVenteId(v.id); setShowVente(true); }} style={S.btnIcon()}>✏️</button>}
                  {canWrite && <button onClick={() => delVente(v.id)} style={S.btnIcon("#FFF0F0")}>🗑️</button>}
                </div>
              </div>
            </div>
          ))
        }
      </>}

      {tab === "dividendes" && <>
        <div style={{ ...S.card, background: benefice > 0 ? "#F0FFF4" : "#FFF5F5", border: `1.5px solid ${benefice > 0 ? "#1E8449" : "#C0392B"}` }}>
          <p style={{ fontWeight: 700, color: "#0F2940", marginBottom: 6 }}>Résultat net distribuable</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: benefice > 0 ? "#1E8449" : "#C0392B", margin: 0 }}>{fmt(benefice)}</p>
          {benefice === 0 && <p style={{ fontSize: 11, color: "#C0392B", marginTop: 4 }}>⚠️ Pas de dividendes tant que le résultat est négatif</p>}
        </div>
        {ASSOCIES.map(a => (
          <div key={a.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: a.couleur, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>{a.parts}%</div>
                <div><div style={{ fontWeight: 700 }}>{a.nom}</div><div style={{ fontSize: 11, color: "#888" }}>{a.role}</div></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: "#1E8449", fontSize: 15 }}>{fmt(benefice * a.parts / 100)}</div>
                <div style={{ fontSize: 10, color: "#888" }}>dividende estimé</div>
              </div>
            </div>
          </div>
        ))}
      </>}

      {showDep && (
        <Modal title={editDepId ? "✏️ Modifier la dépense" : "Nouvelle dépense"} onClose={() => { setShowDep(false); setEditDepId(null); }}>
          <Field label="Catégorie" val={dep.categorie} set={v => setDep(p => ({ ...p, categorie: v }))} options={cats} />
          <Field label="Date" type="date" val={dep.date} set={v => setDep(p => ({ ...p, date: v }))} />
          <Field label="Description" type="text" val={dep.description} set={v => setDep(p => ({ ...p, description: v }))} />
          <Field label="Montant (FCFA)" type="number" val={dep.montant} set={v => setDep(p => ({ ...p, montant: v }))} />
          <button onClick={saveDep} style={S.btn("#C0392B")}>{editDepId ? "✅ Modifier" : "✅ Enregistrer"}</button>
        </Modal>
      )}

      {showVente && (
        <Modal title={editVenteId ? "✏️ Modifier la vente" : "Nouvelle vente"} onClose={() => { setShowVente(false); setEditVenteId(null); }}>
          <Field label="Date" type="date" val={vente.date} set={v => setVente(p => ({ ...p, date: v }))} />
          <Field label="Client / Acheteur" type="text" val={vente.client} set={v => setVente(p => ({ ...p, client: v }))} />
          <Field label="Canal de vente" type="text" val={vente.canal} set={v => setVente(p => ({ ...p, canal: v }))} />
          <Field label="Nombre de poulets" type="number" val={vente.nbPoulets} set={v => setVente(p => ({ ...p, nbPoulets: v }))} />
          <Field label="Prix unitaire (FCFA)" type="number" val={vente.prixUnit} set={v => setVente(p => ({ ...p, prixUnit: v }))} />
          {vente.nbPoulets && vente.prixUnit && <div style={S.alert("#1E8449")}><span style={{ fontWeight: 800, color: "#1E8449" }}>Total : {fmt(Number(vente.nbPoulets) * Number(vente.prixUnit))}</span></div>}
          <button onClick={saveVente} style={S.btn("#1E8449")}>{editVenteId ? "✅ Modifier" : "✅ Enregistrer"}</button>
        </Modal>
      )}

      {showStock && (
        <Modal title="📦 Approvisionner le stock" onClose={() => setShowStock(false)}>
          <Field label="Type d'aliment" val={stockAjout.type} set={v => setStockAjout(p => ({ ...p, type: v }))}
            options={["Aliment Démarrage", "Aliment Croissance", "Aliment Finition"]} />
          <Field label="Quantité ajoutée (kg)" type="number" val={stockAjout.qte} set={v => setStockAjout(p => ({ ...p, qte: v }))} />
          {stockAjout.qte && <div style={S.alert("#1E8449")}><span style={{ fontWeight: 700, color: "#1E8449" }}>Nouveau stock : {fmtN(stock + Number(stockAjout.qte))} kg</span></div>}
          <button onClick={updateStock} style={S.btn("#1A5276")}>✅ Mettre à jour</button>
        </Modal>
      )}
    </div>
  );
}

// ── SANTÉ ─────────────────────────────────────────────────────────
function Sante({ vaccins, incidents, userInfo, bandeActive }) {
  const [showInc, setShowInc] = useState(false);
  const [inc, setInc] = useState({ date: "", symptomes: "", nbAnimaux: "", traitement: "" });

  if (!PERMS[userInfo?.role]?.sante) return <AccessDenied />;
  const canWrite = WRITE_PERMS[userInfo?.role]?.sante;

  const toggleVacc = async (v) => {
    await setDoc(doc(db, "samapoulet", bandeActive, "vaccinations", v.id), {
      ...v, fait: !v.fait, dateReelle: !v.fait ? new Date().toLocaleDateString("fr-FR") : "",
      auteur: userInfo?.nom, heureAction: nowTime()
    });
  };

  const saveInc = async () => {
    await addDoc(collection(db, "samapoulet", bandeActive, "incidents"), { ...inc, ...makeSig(userInfo) });
    setInc({ date: "", symptomes: "", nbAnimaux: "", traitement: "" }); setShowInc(false);
  };

  const delInc = async (id) => { if (window.confirm("Supprimer cet incident ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "incidents", id)); };

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>💉 Santé</p>
      <div style={S.card}>
        <p style={S.cardTitle}>Programme de Vaccination</p>
        {vaccins.map(v => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F0F4F8" }}>
            <button onClick={() => canWrite && toggleVacc(v)} style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${v.fait ? "#1E8449" : "#DDD"}`, background: v.fait ? "#1E8449" : "#fff", cursor: canWrite ? "pointer" : "default", color: "#fff", fontWeight: 800, flexShrink: 0, fontSize: 14, opacity: canWrite ? 1 : 0.6 }}>{v.fait ? "✓" : ""}</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: v.fait ? "#888" : "#0F2940", textDecoration: v.fait ? "line-through" : "none" }}>{v.vaccin}</div>
              <div style={{ fontSize: 11, color: "#AAB7B8" }}>Sem. {v.semaine} • {v.fait ? `Fait le ${v.dateReelle}` : `Prévu : ${v.datePrevue}`}</div>
              {v.fait && v.auteur && <div style={{ fontSize: 10, color: "#AAB7B8" }}>✍️ {v.auteur} • {v.heureAction}</div>}
            </div>
            <span style={S.tag(v.fait ? "#1E8449" : "#E67E22")}>{v.fait ? "Fait ✓" : "À faire"}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ ...S.sectionTitle, marginBottom: 0 }}>🚨 Incidents sanitaires</p>
        {canWrite && <button onClick={() => setShowInc(true)} style={S.btnSm("#C0392B")}>+ Signaler</button>}
        {!canWrite && <span style={S.tag("#AAB7B8")}>👁️ Lecture seule</span>}
      </div>

      {incidents.length === 0
        ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#1E8449" }}><div style={{ fontSize: 40 }}>✅</div><p style={{ fontWeight: 700 }}>Aucun incident sanitaire</p></div>
        : incidents.map(i => (
          <div key={i.id} style={{ ...S.card, borderLeft: "4px solid #C0392B" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 700, color: "#C0392B" }}>{i.date} — {i.nbAnimaux} animal(aux)</div>
              {canWrite && <button onClick={() => delInc(i.id)} style={S.btnIcon("#FFF0F0")}>🗑️</button>}
            </div>
            <p style={{ fontSize: 13, marginTop: 4 }}>{i.symptomes}</p>
            {i.traitement && <p style={{ fontSize: 12, color: "#1E8449", margin: 0 }}>🩺 {i.traitement}</p>}
            <SigLine auteur={i.auteur} heureAction={i.heureAction} />
          </div>
        ))
      }

      {showInc && (
        <Modal title="Signaler un incident" onClose={() => setShowInc(false)}>
          <Field label="Date" type="date" val={inc.date} set={v => setInc(p => ({ ...p, date: v }))} />
          <Field label="Nb animaux touchés" type="number" val={inc.nbAnimaux} set={v => setInc(p => ({ ...p, nbAnimaux: v }))} />
          <Field label="Symptômes observés" type="text" val={inc.symptomes} set={v => setInc(p => ({ ...p, symptomes: v }))} />
          <Field label="Traitement prescrit" type="text" val={inc.traitement} set={v => setInc(p => ({ ...p, traitement: v }))} />
          <button onClick={saveInc} style={S.btn("#C0392B")}>🚨 Enregistrer l'incident</button>
        </Modal>
      )}
    </div>
  );
}

// ── STRATÉGIE ─────────────────────────────────────────────────────
function Strategie({ phases, setPhases, userInfo }) {
  const [tab, setTab] = useState("phases");
  if (!PERMS[userInfo?.role]?.strategie) return <AccessDenied />;
  const done = phases.filter(p => p.statut === "done").length;
  const active = phases.filter(p => p.statut === "active").length;
  const SC = { done: "#1E8449", active: "#E67E22", todo: "#AAB7B8" };
  const SL = { done: "✅ Terminé", active: "⚡ En cours", todo: "⏳ À faire" };

  const togglePhase = async (phase) => {
    const next = phase.statut === "done" ? "todo" : phase.statut === "active" ? "done" : "active";
    const updated = phases.map(p => p.id === phase.id ? { ...p, statut: next } : p);
    setPhases(updated);
    await setDoc(doc(db, "samapoulet", "config", "global", "phases"), { data: updated });
  };

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>🚀 Stratégie</p>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1A5276, #2E86C1)", color: "#fff" }}>
        <p style={{ fontSize: 12, opacity: 0.8, margin: "0 0 8px" }}>Plan de développement — 14 phases</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: 8 }}>
          {[["Terminées", done, "#51CF66"], ["En cours", active, "#FCC419"], ["À faire", 14 - done - active, "#AAB7B8"]].map(([l, v, c]) => (
            <div key={l}><div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 10, opacity: 0.8 }}>{l}</div></div>
          ))}
        </div>
        <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.2)" }}>
          <div style={S.bar(done / 14 * 100, "#51CF66")} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["phases", "Phases"], ["risques", "Risques"], ["canaux", "Canaux"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, cursor: "pointer", background: tab === id ? "#0F2940" : "#E8ECF0", color: tab === id ? "#fff" : "#666" }}>{label}</button>
        ))}
      </div>

      {tab === "phases" && phases.map(p => (
        <div key={p.id} onClick={() => togglePhase(p)} style={{ ...S.card, cursor: "pointer", border: `1.5px solid ${p.statut === "done" ? "#C8E6C9" : p.statut === "active" ? "#FFE0B2" : "#F0F4F8"}`, opacity: p.statut === "done" ? 0.75 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <div><div style={{ fontSize: 11, color: "#888" }}>Phase {p.id}</div><div style={{ fontSize: 13, fontWeight: 700 }}>{p.titre}</div></div>
            </div>
            <span style={S.tag(SC[p.statut])}>{SL[p.statut]}</span>
          </div>
        </div>
      ))}

      {tab === "risques" && RISQUES.map(r => (
        <div key={r.id} style={{ ...S.card, borderLeft: `4px solid ${r.couleur}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{r.risque}</span>
            <span style={S.tag(r.couleur)}>Impact {r.impact}</span>
          </div>
          <p style={{ fontSize: 12, color: "#666", margin: "2px 0" }}>Probabilité : <strong>{r.probabilite}</strong></p>
          <p style={{ fontSize: 12, color: "#1E8449", margin: 0 }}>✅ {r.mitigation}</p>
        </div>
      ))}

      {tab === "canaux" && CANAUX.map(c => (
        <div key={c.id} style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{c.canal}</span>
            <span style={S.tag(c.priorite === "haute" ? "#C0392B" : "#E67E22")}>{c.priorite === "haute" ? "🔴 Haute" : "🟡 Moyenne"}</span>
          </div>
          <p style={{ fontSize: 12, color: "#888", marginTop: 4, marginBottom: 0 }}>{c.statut}</p>
        </div>
      ))}
    </div>
  );
}

// ── ASSOCIÉS ──────────────────────────────────────────────────────
function Associes({ depenses, ventes, userInfo, onLogout }) {
  if (!PERMS[userInfo?.role]?.associes) return <AccessDenied />;
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const benefice = Math.max(totalV - totalDep, 0);

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ ...S.sectionTitle, marginBottom: 0 }}>🤝 Associés</p>
        <button onClick={onLogout} style={S.btnSm("#888")}>Déconnexion</button>
      </div>

      <div style={{ ...S.card, background: "#EBF5FB", border: "1.5px solid #1A5276" }}>
        <p style={{ fontWeight: 700, color: "#1A5276", fontSize: 13, marginBottom: 4 }}>🔐 {userInfo?.nom} — {userInfo?.role === "admin" ? "Administrateur" : userInfo?.role === "production" ? "Production" : "Finances"}</p>
        <p style={{ fontSize: 12, color: "#555", margin: 0 }}>
          {userInfo?.role === "admin" && "✅ Accès complet à toutes les sections"}
          {userInfo?.role === "production" && "✅ Accès : Suivi quotidien + Santé"}
          {userInfo?.role === "finances" && "✅ Accès : Finances uniquement"}
        </p>
      </div>

      <div style={S.card}>
        <p style={S.cardTitle}>Répartition du capital</p>
        <div style={{ display: "flex", height: 22, borderRadius: 11, overflow: "hidden", marginBottom: 12 }}>
          {ASSOCIES.map(a => <div key={a.id} style={{ width: a.parts + "%", background: a.couleur }} />)}
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {ASSOCIES.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: a.couleur }} />
              <span style={{ fontSize: 12 }}>{a.nom} ({a.parts}%)</span>
            </div>
          ))}
        </div>
      </div>

      {ASSOCIES.map(a => (
        <div key={a.id} style={{ ...S.card, borderTop: `4px solid ${a.couleur}` }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: a.couleur, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>{a.parts}%</div>
            <div><div style={{ fontWeight: 800, fontSize: 15 }}>{a.nom}</div><div style={{ fontSize: 12, color: "#888" }}>{a.role}</div></div>
          </div>
          <div style={{ background: "#F8F9FA", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#666" }}>Dividende estimé</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: benefice > 0 ? "#1E8449" : "#AAB7B8" }}>{fmt(benefice * a.parts / 100)}</span>
          </div>
        </div>
      ))}

      <div style={{ ...S.card, background: "#FFFBEB", border: "1.5px solid #F59E0B" }}>
        <p style={{ fontWeight: 700, color: "#92400E", fontSize: 13, marginBottom: 8 }}>📋 Règles de gouvernance</p>
        {["Alune garde toujours le contrôle majoritaire (59%)", "Aucun retrait sans accord des 3 associés", "Distribution uniquement en fin de bande", "10% du bénéfice mis en réserve avant distribution", "Tout nouvel associé approuvé à l'unanimité"].map((r, i) => (
          <p key={i} style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>• {r}</p>
        ))}
      </div>
    </div>
  );
}

// ── GESTION BANDES ────────────────────────────────────────────────
function GestionBandes({ bandes, bandeActive, setBandeActive, userInfo }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ numero: "", dateDebut: "", poussinsDepart: "", objectif: "", fournisseur: "" });

  if (!PERMS[userInfo?.role]?.bandes) return <AccessDenied />;

  const creerBande = async () => {
    if (!form.numero || !form.dateDebut || !form.poussinsDepart) return;
    const id = `bande${form.numero}`;
    await setDoc(doc(db, "samapoulet", id), { ...form, poussinsDepart: Number(form.poussinsDepart), statut: "active", stockAliments: 0, ...makeSig(userInfo) });
    setBandeActive(id);
    setShow(false);
    setForm({ numero: "", dateDebut: "", poussinsDepart: "", objectif: "", fournisseur: "" });
  };

  const cloturer = async (id) => {
    if (!window.confirm("Clôturer cette bande ?")) return;
    await updateDoc(doc(db, "samapoulet", id), { statut: "archivee" });
    if (bandeActive === id) {
      const autre = bandes.find(b => b.id !== id && b.statut === "active");
      if (autre) setBandeActive(autre.id);
    }
  };

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={S.sectionTitle}>🐣 Gestion des Bandes</p>
        <button onClick={() => setShow(true)} style={S.btnSm("#1A5276")}>+ Nouvelle bande</button>
      </div>

      {bandes.map(b => (
        <div key={b.id} style={{ ...S.card, border: `2px solid ${b.id === bandeActive ? "#1A5276" : "#eee"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 15 }}>Bande {b.numero}</span>
                {b.id === bandeActive && <span style={S.tag("#1A5276")}>Active</span>}
                <span style={S.tag(b.statut === "active" ? "#1E8449" : "#AAB7B8")}>{b.statut === "active" ? "En cours" : "Archivée"}</span>
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>📅 Démarrage : {b.dateDebut}</div>
              <div style={{ fontSize: 12, color: "#888" }}>🐔 {fmtN(b.poussinsDepart)} poussins • {b.fournisseur}</div>
              {b.objectif && <div style={{ fontSize: 12, color: "#1A5276", marginTop: 2 }}>🎯 {b.objectif}</div>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {b.id !== bandeActive && b.statut === "active" && <button onClick={() => setBandeActive(b.id)} style={S.btnSm("#1E8449")}>Activer</button>}
              {b.statut === "active" && <button onClick={() => cloturer(b.id)} style={S.btnSm("#E67E22")}>Clôturer</button>}
            </div>
          </div>
        </div>
      ))}

      {bandes.length === 0 && <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#AAB7B8" }}><p>Aucune bande créée</p></div>}

      {show && (
        <Modal title="Nouvelle Bande" onClose={() => setShow(false)}>
          <Field label="Numéro de bande (ex: 3)" type="number" val={form.numero} set={v => setForm(p => ({ ...p, numero: v }))} />
          <Field label="Date de démarrage" type="date" val={form.dateDebut} set={v => setForm(p => ({ ...p, dateDebut: v }))} />
          <Field label="Nombre de poussins" type="number" val={form.poussinsDepart} set={v => setForm(p => ({ ...p, poussinsDepart: v }))} />
          <Field label="Objectif de vente" type="text" val={form.objectif} set={v => setForm(p => ({ ...p, objectif: v }))} />
          <Field label="Fournisseur poussins" type="text" val={form.fournisseur} set={v => setForm(p => ({ ...p, fournisseur: v }))} />
          <button onClick={creerBande} style={S.btn("#1A5276")}>✅ Créer la bande</button>
        </Modal>
      )}
    </div>
  );
}

// ── GRAPHIQUES & ANALYTICS ────────────────────────────────────────
function Analytics({ suivi, depenses, ventes, bandeCfg }) {
  const poussins = bandeCfg?.poussinsDepart || 450;

  // Données mortalité par semaine
  const mortaliteParSemaine = Array(6).fill(0).map((_, i) => {
    const dateDebut = new Date(bandeCfg?.dateDebut || "2026-05-15");
    const debut = new Date(dateDebut.getTime() + i * 7 * 86400000);
    const fin = new Date(dateDebut.getTime() + (i + 1) * 7 * 86400000);
    const morts = suivi.filter(j => { const d = new Date(j.date); return d >= debut && d < fin; }).reduce((s, j) => s + Number(j.morts || 0), 0);
    return { sem: `S${i + 1}`, morts };
  });

  // CA par semaine
  const caParSemaine = Array(6).fill(0).map((_, i) => {
    const dateDebut = new Date(bandeCfg?.dateDebut || "2026-05-15");
    const debut = new Date(dateDebut.getTime() + i * 7 * 86400000);
    const fin = new Date(dateDebut.getTime() + (i + 1) * 7 * 86400000);
    const ca = ventes.filter(v => { const d = new Date(v.date); return d >= debut && d < fin; }).reduce((s, v) => s + Number(v.total || 0), 0);
    return { sem: `S${i + 1}`, ca };
  });

  // Dépenses par catégorie
  const depParCat = {};
  depenses.forEach(d => { depParCat[d.categorie] = (depParCat[d.categorie] || 0) + Number(d.montant || 0); });
  const cats = Object.entries(depParCat).sort((a, b) => b[1] - a[1]);
  const totalDep = cats.reduce((s, [, v]) => s + v, 0);

  const maxMorts = Math.max(...mortaliteParSemaine.map(s => s.morts), 1);
  const maxCA = Math.max(...caParSemaine.map(s => s.ca), 1);
  const catColors = ["#1A5276", "#1E8449", "#784212", "#C0392B", "#E67E22", "#6C3483", "#2C3E50", "#AAB7B8"];

  const totalMorts = suivi.reduce((s, j) => s + Number(j.morts || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const nbVendus = ventes.reduce((s, v) => s + Number(v.nbPoulets || 0), 0);
  const prixMoyen = nbVendus > 0 ? totalV / nbVendus : 0;

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>📈 Analytics</p>

      {/* KPIs résumé */}
      <div style={S.kpiRow}>
        <div style={S.kpi("#1A5276")}>
          <div style={S.kpiVal}>{((totalMorts / poussins) * 100).toFixed(1)}%</div>
          <div style={S.kpiLbl}>Taux mortalité</div>
        </div>
        <div style={S.kpi("#1E8449")}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(prixMoyen)}</div>
          <div style={S.kpiLbl}>Prix moy/poulet</div>
        </div>
      </div>
      <div style={S.kpiRow}>
        <div style={S.kpi("#784212")}>
          <div style={S.kpiVal}>{fmtN(nbVendus)}</div>
          <div style={S.kpiLbl}>Poulets vendus</div>
        </div>
        <div style={S.kpi("#0F2940")}>
          <div style={S.kpiVal}>{fmtN(poussins - totalMorts - nbVendus)}</div>
          <div style={S.kpiLbl}>Restants</div>
        </div>
      </div>

      {/* Graphique mortalité */}
      <div style={S.card}>
        <p style={S.cardTitle}>💀 Mortalité par semaine</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginBottom: 8 }}>
          {mortaliteParSemaine.map((s, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "#888", fontWeight: 700 }}>{s.morts}</span>
              <div style={{ width: "100%", background: s.morts > 10 ? "#C0392B" : s.morts > 5 ? "#E67E22" : "#1E8449", borderRadius: "4px 4px 0 0", height: Math.max((s.morts / maxMorts) * 80, s.morts > 0 ? 4 : 0) }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {mortaliteParSemaine.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#888" }}>{s.sem}</div>
          ))}
        </div>
      </div>

      {/* Graphique CA */}
      <div style={S.card}>
        <p style={S.cardTitle}>💰 Chiffre d'affaires par semaine</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, marginBottom: 8 }}>
          {caParSemaine.map((s, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {s.ca > 0 && <span style={{ fontSize: 9, color: "#1E8449", fontWeight: 700 }}>{(s.ca / 1000).toFixed(0)}k</span>}
              <div style={{ width: "100%", background: s.ca > 0 ? "#1E8449" : "#E8ECF0", borderRadius: "4px 4px 0 0", height: Math.max((s.ca / maxCA) * 80, s.ca > 0 ? 4 : 2) }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {caParSemaine.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#888" }}>{s.sem}</div>
          ))}
        </div>
      </div>

      {/* Répartition dépenses */}
      {cats.length > 0 && (
        <div style={S.card}>
          <p style={S.cardTitle}>💸 Répartition des dépenses</p>
          {/* Barre empilée */}
          <div style={{ display: "flex", height: 20, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
            {cats.map(([cat, val], i) => (
              <div key={cat} style={{ width: (val / totalDep * 100) + "%", background: catColors[i % catColors.length] }} title={cat} />
            ))}
          </div>
          {cats.map(([cat, val], i) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #F0F4F8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: catColors[i % catColors.length], flexShrink: 0 }} />
                <span style={{ fontSize: 12 }}>{cat}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(val)}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{(val / totalDep * 100).toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ventes par canal */}
      {ventes.length > 0 && (() => {
        const parCanal = {};
        ventes.forEach(v => { parCanal[v.canal || "Autre"] = (parCanal[v.canal || "Autre"] || 0) + Number(v.total || 0); });
        const totalCA = Object.values(parCanal).reduce((s, v) => s + v, 0);
        return (
          <div style={S.card}>
            <p style={S.cardTitle}>🛒 Ventes par canal</p>
            {Object.entries(parCanal).sort((a, b) => b[1] - a[1]).map(([canal, val], i) => (
              <div key={canal} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{canal}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1E8449" }}>{fmt(val)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "#E8ECF0" }}>
                  <div style={{ height: "100%", width: (val / totalCA * 100) + "%", background: catColors[i % catColors.length], borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ── CALCULATEUR RENTABILITÉ ───────────────────────────────────────
function Calculateur({ depenses, suivi, bandeCfg }) {
  const totalMorts = suivi.reduce((s, j) => s + Number(j.morts || 0), 0);
  const effectif = (bandeCfg?.poussinsDepart || 450) - totalMorts;
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);

  const [nbVente, setNbVente] = useState(String(effectif));
  const [prix, setPrix] = useState("3500");
  const [reserve, setReserve] = useState("10");

  const nbN = Number(nbVente) || 0;
  const prixN = Number(prix) || 0;
  const reservePct = Number(reserve) || 0;

  const ca = nbN * prixN;
  const resultat = ca - totalDep;
  const reserveMontant = Math.max(resultat, 0) * reservePct / 100;
  const netDistribuable = Math.max(resultat - reserveMontant, 0);
  const parPoulet = nbN > 0 ? (resultat / nbN) : 0;

  const ASSOCIES_CALC = [
    { nom: "Alune", parts: 59, couleur: "#1A5276" },
    { nom: "Laye", parts: 25, couleur: "#1E8449" },
    { nom: "Daff", parts: 16, couleur: "#784212" },
  ];

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>🧮 Calculateur de rentabilité</p>

      <div style={{ ...S.card, background: "#F8F9FA" }}>
        <p style={S.cardTitle}>Paramètres de simulation</p>
        <Field label={`Nombre de poulets à vendre (disponibles : ${fmtN(effectif)})`} type="number" val={nbVente} set={setNbVente} />
        <Field label="Prix de vente par poulet (FCFA)" type="number" val={prix} set={setPrix} />
        <Field label="Réserve à garder (%)" type="number" val={reserve} set={setReserve} />
        <div style={{ ...S.alert("#1A5276"), marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "#888" }}>Investissement total : </span>
          <span style={{ fontWeight: 700, color: "#1A5276" }}>{fmt(totalDep)}</span>
        </div>
      </div>

      {/* Résultat simulation */}
      <div style={{ ...S.card, background: resultat >= 0 ? "linear-gradient(135deg, #1E8449, #27AE60)" : "linear-gradient(135deg, #C0392B, #E74C3C)", color: "#fff" }}>
        <p style={{ fontSize: 13, opacity: 0.85, margin: "0 0 8px" }}>Résultat simulé</p>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{fmt(Math.abs(resultat))}</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>{resultat >= 0 ? "✅ Bénéfice" : "❌ Perte"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          {[["CA simulé", fmt(ca)], ["Coûts totaux", fmt(totalDep)], ["Réserve", fmt(reserveMontant)], ["Net distribuable", fmt(netDistribuable)]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(255,255,255,0.15)", borderRadius: 8 }}>
          <span style={{ fontSize: 12, opacity: 0.85 }}>Gain/perte par poulet : </span>
          <span style={{ fontWeight: 800, fontSize: 14 }}>{fmt(Math.abs(parPoulet))} {parPoulet >= 0 ? "✅" : "❌"}</span>
        </div>
      </div>

      {/* Dividendes simulés */}
      {netDistribuable > 0 && (
        <div style={S.card}>
          <p style={S.cardTitle}>🤝 Dividendes simulés</p>
          {ASSOCIES_CALC.map(a => (
            <div key={a.nom} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0F4F8" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 16, background: a.couleur, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 12 }}>{a.parts}%</div>
                <span style={{ fontWeight: 600 }}>{a.nom}</span>
              </div>
              <span style={{ fontWeight: 800, color: "#1E8449", fontSize: 15 }}>{fmt(netDistribuable * a.parts / 100)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Seuil de rentabilité */}
      <div style={S.card}>
        <p style={S.cardTitle}>📊 Seuil de rentabilité</p>
        {prixN > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>Poulets min. à vendre pour rentrer dans les frais</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1A5276" }}>{fmtN(Math.ceil(totalDep / prixN))} poulets</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>à {fmt(prixN)} FCFA/poulet</div>
            <div style={{ marginTop: 10, height: 8, borderRadius: 4, background: "#E8ECF0" }}>
              <div style={S.bar(Math.min((nbN / Math.ceil(totalDep / prixN)) * 100, 100), nbN >= Math.ceil(totalDep / prixN) ? "#1E8449" : "#E67E22")} />
            </div>
            <div style={{ fontSize: 11, color: nbN >= Math.ceil(totalDep / prixN) ? "#1E8449" : "#E67E22", marginTop: 4, fontWeight: 700 }}>
              {nbN >= Math.ceil(totalDep / prixN) ? `✅ Vous dépassez le seuil de ${fmtN(nbN - Math.ceil(totalDep / prixN))} poulets` : `⚠️ Il manque ${fmtN(Math.ceil(totalDep / prixN) - nbN)} poulets pour rentrer dans les frais`}
            </div>
          </>
        ) : <p style={{ color: "#888", fontSize: 13 }}>Entrez un prix de vente pour calculer</p>}
      </div>
    </div>
  );
}

// ── CLIENTS ───────────────────────────────────────────────────────
function Clients({ userInfo, bandeActive, ventes }) {
  const [show, setShow] = useState(false);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ nom: "", telephone: "", localisation: "", type: "", notes: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "samapoulet", "config", "clients"), snap => {
      setClients(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const save = async () => {
    if (!form.nom) return;
    if (editId) {
      await updateDoc(doc(db, "samapoulet", "config", "clients", editId), { ...form, modifiePar: userInfo?.nom, heureModif: nowTime() });
      setEditId(null);
    } else {
      await addDoc(collection(db, "samapoulet", "config", "clients"), { ...form, ...makeSig(userInfo) });
    }
    setForm({ nom: "", telephone: "", localisation: "", type: "", notes: "" });
    setShow(false);
  };

  const del = async (id) => { if (window.confirm("Supprimer ce client ?")) await deleteDoc(doc(db, "samapoulet", "config", "clients", id)); };

  // Calculer CA par client depuis les ventes
  const caParClient = {};
  ventes.forEach(v => { caParClient[v.client] = (caParClient[v.client] || 0) + Number(v.total || 0); });

  const types = ["Particulier", "Restaurant", "Revendeur / Bana-bana", "Hôtel", "Entreprise", "Autre"];

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={S.sectionTitle}>👥 Clients</p>
        <button onClick={() => { setEditId(null); setForm({ nom: "", telephone: "", localisation: "", type: "", notes: "" }); setShow(true); }} style={S.btnSm("#1A5276")}>+ Ajouter</button>
      </div>

      {/* Résumé */}
      <div style={S.kpiRow}>
        <div style={S.kpi("#1A5276")}><div style={S.kpiVal}>{clients.length}</div><div style={S.kpiLbl}>Clients enregistrés</div></div>
        <div style={S.kpi("#1E8449")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(Object.values(caParClient).reduce((s, v) => s + v, 0))}</div><div style={S.kpiLbl}>CA total clients</div></div>
      </div>

      {clients.length === 0
        ? <div style={{ ...S.card, textAlign: "center", padding: 32, color: "#AAB7B8" }}><div style={{ fontSize: 40 }}>👥</div><p>Aucun client enregistré</p></div>
        : clients.map(c => (
          <div key={c.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.nom}</div>
                {c.type && <span style={S.tag("#1A5276")}>{c.type}</span>}
                {c.telephone && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>📞 {c.telephone}</div>}
                {c.localisation && <div style={{ fontSize: 12, color: "#888" }}>📍 {c.localisation}</div>}
                {caParClient[c.nom] > 0 && <div style={{ fontSize: 12, color: "#1E8449", fontWeight: 700, marginTop: 4 }}>💰 CA : {fmt(caParClient[c.nom])}</div>}
                {c.notes && <div style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 4 }}>"{c.notes}"</div>}
                <SigLine auteur={c.auteur} heureAction={c.heureAction} modifiePar={c.modifiePar} heureModif={c.heureModif} />
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => { setForm({ nom: c.nom, telephone: c.telephone || "", localisation: c.localisation || "", type: c.type || "", notes: c.notes || "" }); setEditId(c.id); setShow(true); }} style={S.btnIcon()}>✏️</button>
                <button onClick={() => del(c.id)} style={S.btnIcon("#FFF0F0")}>🗑️</button>
              </div>
            </div>
          </div>
        ))
      }

      {show && (
        <Modal title={editId ? "✏️ Modifier le client" : "Nouveau client"} onClose={() => { setShow(false); setEditId(null); }}>
          <Field label="Nom / Raison sociale" type="text" val={form.nom} set={v => setForm(p => ({ ...p, nom: v }))} />
          <Field label="Type de client" val={form.type} set={v => setForm(p => ({ ...p, type: v }))} options={types} />
          <Field label="Téléphone" type="tel" val={form.telephone} set={v => setForm(p => ({ ...p, telephone: v }))} />
          <Field label="Localisation" type="text" val={form.localisation} set={v => setForm(p => ({ ...p, localisation: v }))} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, height: 60, resize: "none" }} placeholder="Préférences, remarques..." />
          <button onClick={save} style={S.btn("#1A5276")}>{editId ? "✅ Modifier" : "✅ Enregistrer"}</button>
        </Modal>
      )}
    </div>
  );
}

// ── FOURNISSEURS ──────────────────────────────────────────────────
function Fournisseurs({ userInfo }) {
  const [show, setShow] = useState(false);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [form, setForm] = useState({ nom: "", categorie: "", telephone: "", localisation: "", prixNegocies: "", notes: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "samapoulet", "config", "fournisseurs"), snap => {
      setFournisseurs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const save = async () => {
    if (!form.nom) return;
    if (editId) {
      await updateDoc(doc(db, "samapoulet", "config", "fournisseurs", editId), { ...form, modifiePar: userInfo?.nom, heureModif: nowTime() });
      setEditId(null);
    } else {
      await addDoc(collection(db, "samapoulet", "config", "fournisseurs"), { ...form, ...makeSig(userInfo) });
    }
    setForm({ nom: "", categorie: "", telephone: "", localisation: "", prixNegocies: "", notes: "" });
    setShow(false);
  };

  const del = async (id) => { if (window.confirm("Supprimer ce fournisseur ?")) await deleteDoc(doc(db, "samapoulet", "config", "fournisseurs", id)); };
  const cats = ["Poussins", "Aliments", "Vaccins & Médicaments", "Équipements", "Transport", "Autre"];
  const catColors = { "Poussins": "#E67E22", "Aliments": "#1E8449", "Vaccins & Médicaments": "#C0392B", "Équipements": "#1A5276", "Transport": "#784212", "Autre": "#AAB7B8" };

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={S.sectionTitle}>🏪 Fournisseurs</p>
        <button onClick={() => { setEditId(null); setForm({ nom: "", categorie: "", telephone: "", localisation: "", prixNegocies: "", notes: "" }); setShow(true); }} style={S.btnSm("#1A5276")}>+ Ajouter</button>
      </div>

      <div style={S.kpi("#1A5276")}><div style={S.kpiVal}>{fournisseurs.length}</div><div style={S.kpiLbl}>Fournisseurs enregistrés</div></div>
      <div style={{ height: 12 }} />

      {/* Grouper par catégorie */}
      {cats.map(cat => {
        const items = fournisseurs.filter(f => f.categorie === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 6px" }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: catColors[cat] || "#AAB7B8" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 0.5 }}>{cat}</span>
            </div>
            {items.map(f => (
              <div key={f.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{f.nom}</div>
                    {f.telephone && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>📞 {f.telephone}</div>}
                    {f.localisation && <div style={{ fontSize: 12, color: "#888" }}>📍 {f.localisation}</div>}
                    {f.prixNegocies && <div style={{ fontSize: 12, color: "#1E8449", fontWeight: 700, marginTop: 4 }}>💰 Prix négociés : {f.prixNegocies}</div>}
                    {f.notes && <div style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 4 }}>"{f.notes}"</div>}
                    <SigLine auteur={f.auteur} heureAction={f.heureAction} modifiePar={f.modifiePar} heureModif={f.heureModif} />
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button onClick={() => { setForm({ nom: f.nom, categorie: f.categorie || "", telephone: f.telephone || "", localisation: f.localisation || "", prixNegocies: f.prixNegocies || "", notes: f.notes || "" }); setEditId(f.id); setShow(true); }} style={S.btnIcon()}>✏️</button>
                    <button onClick={() => del(f.id)} style={S.btnIcon("#FFF0F0")}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {fournisseurs.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: 32, color: "#AAB7B8" }}>
          <div style={{ fontSize: 40 }}>🏪</div>
          <p>Aucun fournisseur enregistré</p>
        </div>
      )}

      {show && (
        <Modal title={editId ? "✏️ Modifier le fournisseur" : "Nouveau fournisseur"} onClose={() => { setShow(false); setEditId(null); }}>
          <Field label="Nom du fournisseur" type="text" val={form.nom} set={v => setForm(p => ({ ...p, nom: v }))} />
          <Field label="Catégorie" val={form.categorie} set={v => setForm(p => ({ ...p, categorie: v }))} options={cats} />
          <Field label="Téléphone" type="tel" val={form.telephone} set={v => setForm(p => ({ ...p, telephone: v }))} />
          <Field label="Localisation" type="text" val={form.localisation} set={v => setForm(p => ({ ...p, localisation: v }))} />
          <Field label="Prix négociés" type="text" val={form.prixNegocies} set={v => setForm(p => ({ ...p, prixNegocies: v }))} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, height: 60, resize: "none" }} placeholder="Qualité, délais, conditions..." />
          <button onClick={save} style={S.btn("#1A5276")}>{editId ? "✅ Modifier" : "✅ Enregistrer"}</button>
        </Modal>
      )}
    </div>
  );
}

// ── APP PRINCIPALE ────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [bandeActive, setBandeActive] = useState("bande2");
  const [bandes, setBandes] = useState([]);
  const [bandeCfg, setBandeCfg] = useState({ dateDebut: "2026-05-15", poussinsDepart: 450, objectif: "Tamkharite ~25 Juin 2026", stockAliments: 0 });
  const [suivi, setSuivi] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [vaccins, setVaccins] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [phases, setPhases] = useState(PHASES_INIT);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setUserInfo(USERS[u.email] || { nom: u.email.split("@")[0], role: "production", parts: 0, couleur: "#888" });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const ref = doc(db, "samapoulet", "bande2");
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { numero: 2, dateDebut: "2026-05-15", poussinsDepart: 450, objectif: "Tamkharite ~25 Juin 2026", fournisseur: "À définir", statut: "active", stockAliments: 0 });
      }
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    unsubs.push(onSnapshot(doc(db, "samapoulet", bandeActive), snap => { if (snap.exists()) setBandeCfg(snap.data()); }));
    unsubs.push(onSnapshot(collection(db, "samapoulet"), snap => {
      setBandes(snap.docs.filter(d => d.id.startsWith("bande") && d.id !== "config").map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.numero || 0) - (b.numero || 0)));
    }));

    const q1 = query(collection(db, "samapoulet", bandeActive, "suiviQuotidien"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q1, s => setSuivi(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    const q2 = query(collection(db, "samapoulet", bandeActive, "depenses"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q2, s => setDepenses(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    const q3 = query(collection(db, "samapoulet", bandeActive, "ventes"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q3, s => setVentes(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    unsubs.push(onSnapshot(collection(db, "samapoulet", bandeActive, "vaccinations"), async snap => {
      if (snap.empty) {
        for (const v of VACCINS_INIT) await setDoc(doc(db, "samapoulet", bandeActive, "vaccinations", v.id), v);
      } else {
        setVaccins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }));

    const q5 = query(collection(db, "samapoulet", bandeActive, "incidents"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q5, s => setIncidents(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    unsubs.push(onSnapshot(doc(db, "samapoulet", "config", "global", "phases"), snap => {
      if (snap.exists()) setPhases(snap.data().data);
    }));

    return () => unsubs.forEach(u => u());
  }, [user, bandeActive]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0F2940", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 60 }}>🐓</div>
      <p style={{ color: "#C9A84C", fontSize: 22, fontWeight: 800, marginTop: 16 }}>Sama Poulet</p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>v2.1 — Chargement...</p>
    </div>
  );

  if (!user) return <Login />;

  const tabs = [
    { id: "dashboard", icon: "📊", label: "Accueil" },
    { id: "suivi", icon: "🐔", label: "Suivi" },
    { id: "finances", icon: "💰", label: "Finances" },
    { id: "analytics", icon: "📈", label: "Stats" },
    { id: "calcul", icon: "🧮", label: "Calcul" },
    { id: "clients", icon: "👥", label: "Clients" },
    { id: "fournisseurs", icon: "🏪", label: "Fourniss." },
    { id: "sante", icon: "💉", label: "Santé" },
    { id: "strategie", icon: "🚀", label: "Stratégie" },
    { id: "associes", icon: "🤝", label: "Associés" },
    { id: "bandes", icon: "🐣", label: "Bandes" },
  ];

  // Nav visible max 6 tabs + scroll
  const mainTabs = tabs.slice(0, 6);
  const moreTabs = tabs.slice(6);

  return (
    <div style={S.app}>
      {tab === "dashboard" && <Dashboard suivi={suivi} depenses={depenses} ventes={ventes} vaccins={vaccins} userInfo={userInfo} bandeCfg={bandeCfg} />}
      {tab === "suivi" && <SuiviQuotidien suivi={suivi} userInfo={userInfo} bandeCfg={bandeCfg} bandeActive={bandeActive} />}
      {tab === "finances" && <Finances depenses={depenses} ventes={ventes} userInfo={userInfo} bandeActive={bandeActive} bandeCfg={bandeCfg} setBandeCfg={setBandeCfg} />}
      {tab === "analytics" && <Analytics suivi={suivi} depenses={depenses} ventes={ventes} bandeCfg={bandeCfg} />}
      {tab === "calcul" && <Calculateur depenses={depenses} suivi={suivi} bandeCfg={bandeCfg} />}
      {tab === "clients" && <Clients userInfo={userInfo} bandeActive={bandeActive} ventes={ventes} />}
      {tab === "fournisseurs" && <Fournisseurs userInfo={userInfo} />}
      {tab === "sante" && <Sante vaccins={vaccins} incidents={incidents} userInfo={userInfo} bandeActive={bandeActive} />}
      {tab === "strategie" && <Strategie phases={phases} setPhases={setPhases} userInfo={userInfo} />}
      {tab === "associes" && <Associes depenses={depenses} ventes={ventes} userInfo={userInfo} onLogout={() => signOut(auth)} />}
      {tab === "bandes" && <GestionBandes bandes={bandes} bandeActive={bandeActive} setBandeActive={setBandeActive} userInfo={userInfo} />}

      <div style={{ ...S.nav, overflowX: "auto", justifyContent: "flex-start", gap: 0, padding: "8px 8px 12px" }}>
        {tabs.map(t => (
          <div key={t.id} style={{ ...S.navItem(tab === t.id), minWidth: 52, padding: "0 4px" }} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 8, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#1A5276" : "#888", whiteSpace: "nowrap" }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
