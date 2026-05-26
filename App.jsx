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

// ── CARTE CRÉDIT (composant séparé pour éviter useState dans map) ─
function CreditCard({ c, canWrite, marquerPayé, delCredit, creditStatutColor, creditStatutLabel }) {
  const [showPaiement, setShowPaiement] = useState(false);
  const [montantSupp, setMontantSupp] = useState("");
  return (
    <div style={{ ...S.card, borderLeft: `4px solid ${creditStatutColor[c.statut] || "#888"}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>{c.client}</span>
            <span style={S.tag(creditStatutColor[c.statut] || "#888")}>{creditStatutLabel[c.statut] || c.statut}</span>
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>{c.nbPoulets} poulets × {fmt(c.prixUnit)} • {c.date}</div>
          <span style={S.tag("#1A5276")}>{c.canal}</span>
          {c.dateEcheance && <div style={{ fontSize: 11, color: "#E67E22", marginTop: 4 }}>📅 Échéance : {c.dateEcheance}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#0F2940" }}>Total : {fmt(c.total)}</div>
          <div style={{ fontSize: 12, color: "#1E8449" }}>Reçu : {fmt(c.montantRecu)}</div>
          <div style={{ fontSize: 12, color: "#C0392B", fontWeight: 700 }}>Dû : {fmt(c.resteDu)}</div>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#E8ECF0", marginBottom: 8 }}>
        <div style={S.bar(c.total > 0 ? (c.montantRecu / c.total * 100) : 0, "#1E8449")} />
      </div>
      {canWrite && c.statut !== "payé" && (
        <div>
          {!showPaiement
            ? <button onClick={() => setShowPaiement(true)} style={{ ...S.btnSm("#1E8449"), width: "100%", padding: "8px" }}>💰 Enregistrer un paiement</button>
            : <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <input type="number" value={montantSupp} onChange={e => setMontantSupp(e.target.value)}
                  placeholder="Montant reçu (FCFA)" style={{ ...S.input, marginBottom: 0, flex: 1 }} />
                <button onClick={() => { marquerPayé(c, montantSupp); setShowPaiement(false); setMontantSupp(""); }} style={S.btnSm("#1E8449")}>✅</button>
                <button onClick={() => setShowPaiement(false)} style={S.btnSm("#888")}>✕</button>
              </div>
          }
        </div>
      )}
      <SigLine auteur={c.auteur} heureAction={c.heureAction} modifiePar={c.modifiePar} heureModif={c.heureModif} />
      {canWrite && <button onClick={() => delCredit(c.id)} style={{ ...S.btnIcon("#FFF0F0"), marginTop: 6 }}>🗑️ Supprimer</button>}
    </div>
  );
}

// ── FINANCES ──────────────────────────────────────────────────────
function Finances({ depenses, ventes, userInfo, bandeActive, bandeCfg, setBandeCfg }) {
  const [tab, setTab] = useState("depenses");
  const [showDep, setShowDep] = useState(false);
  const [showVente, setShowVente] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showBande1, setShowBande1] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  const [dep, setDep] = useState({ date: "", categorie: "", description: "", montant: "" });
  const [vente, setVente] = useState({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "", typeVente: "comptant", acompte: "", dateEcheance: "" });
  const [stockAjout, setStockAjout] = useState({ qte: "", type: "Aliment Démarrage", mode: "ajouter", nbSacs: "", stockReel: "" });
  const [bande1Form, setBande1Form] = useState({ argentRestant: "", nbPoussinsRestants: "", notes: "" });
  const [editDepId, setEditDepId] = useState(null);
  const [editVenteId, setEditVenteId] = useState(null);
  const [credits, setCredits] = useState([]);
  const [bande1Data, setBande1Data] = useState(null);

  if (!PERMS[userInfo?.role]?.finances) return <AccessDenied />;
  const canWrite = WRITE_PERMS[userInfo?.role]?.finances;

  // Charger données bande 1 et crédits
  useEffect(() => {
    const unsub1 = onSnapshot(doc(db, "samapoulet", "config", "global", "bande1Solde"), snap => {
      if (snap.exists()) setBande1Data(snap.data());
    });
    const q = query(collection(db, "samapoulet", bandeActive, "credits"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q, snap => setCredits(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsub1(); unsub2(); };
  }, [bandeActive]);

  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const totalCreditRecu = credits.reduce((s, c) => s + Number(c.montantRecu || 0), 0);
  const totalCreditDu = credits.filter(c => c.statut !== "payé").reduce((s, c) => s + (Number(c.total || 0) - Number(c.montantRecu || 0)), 0);
  const argentBande1 = Number(bande1Data?.argentRestant || 0);
  const resultat = totalV + totalCreditRecu + argentBande1 - totalDep;
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
    const acompte = Number(vente.acompte || 0);
    const data = { ...vente, nbPoulets: Number(vente.nbPoulets), prixUnit: Number(vente.prixUnit), total };

    if (vente.typeVente === "credit") {
      // Vente à crédit → enregistrer dans credits
      const creditData = {
        ...data, montantRecu: acompte, resteDu: total - acompte,
        statut: acompte >= total ? "payé" : acompte > 0 ? "partiel" : "impayé",
        ...makeSig(userInfo)
      };
      if (editVenteId) {
        await updateDoc(doc(db, "samapoulet", bandeActive, "credits", editVenteId), { ...creditData, modifiePar: userInfo?.nom, heureModif: nowTime() });
        setEditVenteId(null);
      } else {
        await addDoc(collection(db, "samapoulet", bandeActive, "credits"), creditData);
      }
    } else {
      // Vente comptant normale
      if (editVenteId) {
        await updateDoc(doc(db, "samapoulet", bandeActive, "ventes", editVenteId), { ...data, modifiePar: userInfo?.nom, heureModif: nowTime() });
        setEditVenteId(null);
      } else {
        await addDoc(collection(db, "samapoulet", bandeActive, "ventes"), { ...data, ...makeSig(userInfo) });
      }
    }
    setVente({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "", typeVente: "comptant", acompte: "", dateEcheance: "" });
    setShowVente(false);
  };

  const updateStock = async () => {
    let newStock;
    if (stockAjout.mode === "definir") {
      newStock = Number(stockAjout.stockReel || 0);
    } else {
      newStock = stock + Number(stockAjout.qte || 0);
    }
    await updateDoc(doc(db, "samapoulet", bandeActive), { stockAliments: newStock });
    setBandeCfg(p => ({ ...p, stockAliments: newStock }));
    setStockAjout({ qte: "", type: "Aliment Démarrage", mode: "ajouter", nbSacs: "", stockReel: "" });
    setShowStock(false);
  };

  const saveBande1 = async () => {
    await setDoc(doc(db, "samapoulet", "config", "global", "bande1Solde"), {
      ...bande1Form, argentRestant: Number(bande1Form.argentRestant || 0),
      nbPoussinsRestants: Number(bande1Form.nbPoussinsRestants || 0),
      modifiePar: userInfo?.nom, heureModif: nowTime(), updatedAt: new Date().toISOString()
    });
    setShowBande1(false);
  };

  const marquerPayé = async (credit, montantSupp) => {
    const newMontantRecu = Number(credit.montantRecu || 0) + Number(montantSupp || 0);
    const newResteDu = Number(credit.total || 0) - newMontantRecu;
    const newStatut = newResteDu <= 0 ? "payé" : "partiel";
    await updateDoc(doc(db, "samapoulet", bandeActive, "credits", credit.id), {
      montantRecu: newMontantRecu, resteDu: Math.max(newResteDu, 0), statut: newStatut,
      modifiePar: userInfo?.nom, heureModif: nowTime()
    });
    // Si payé totalement → transférer dans ventes normales
    if (newStatut === "payé") {
      await addDoc(collection(db, "samapoulet", bandeActive, "ventes"), {
        ...credit, total: credit.total, ...makeSig(userInfo), notes: "Crédit soldé"
      });
    }
  };

  const delDep = async (id) => { if (window.confirm("Supprimer ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "depenses", id)); };
  const delVente = async (id) => { if (window.confirm("Supprimer ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "ventes", id)); };
  const delCredit = async (id) => { if (window.confirm("Supprimer ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "credits", id)); };

  const creditStatutColor = { "payé": "#1E8449", "partiel": "#E67E22", "impayé": "#C0392B" };
  const creditStatutLabel = { "payé": "✅ Payé", "partiel": "⏳ Partiel", "impayé": "🔴 Impayé" };

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>💰 Finances</p>

      {/* Résumé financier global */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #0F2940, #1A4A7A)", color: "#fff" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: 8 }}>
          {[["Dépenses", fmt(totalDep), "#FF6B6B"], ["Recettes", fmt(totalV + totalCreditRecu + argentBande1), "#51CF66"], ["Résultat", fmt(Math.abs(resultat)), resultat >= 0 ? "#51CF66" : "#FF6B6B"]].map(([l, v, c]) => (
            <div key={l}><div style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</div><div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{l}</div></div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 13, fontWeight: 700, color: resultat >= 0 ? "#51CF66" : "#FF6B6B" }}>
          {resultat >= 0 ? "✅ Bénéfice" : "❌ Perte"} : {fmt(Math.abs(resultat))}
        </div>
        {totalCreditDu > 0 && <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "#FCC419" }}>⚠️ Créances en attente : {fmt(totalCreditDu)}</div>}
      </div>

      {/* Bande 1 solde */}
      <div style={{ ...S.card, border: "1.5px solid #C9A84C", background: "#FFFBEB" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ ...S.cardTitle, marginBottom: 0, color: "#92400E" }}>🐣 Solde Bande 1</p>
          {canWrite && <button onClick={() => { setBande1Form({ argentRestant: bande1Data?.argentRestant || "", nbPoussinsRestants: bande1Data?.nbPoussinsRestants || "", notes: bande1Data?.notes || "" }); setShowBande1(true); }} style={S.btnSm("#92400E")}>✏️ Modifier</button>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1E8449" }}>{fmt(argentBande1)}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Argent restant</div>
          </div>
          <div style={{ background: "#fff", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#E67E22" }}>{fmtN(bande1Data?.nbPoussinsRestants || 0)}</div>
            <div style={{ fontSize: 11, color: "#888" }}>Poulets restants</div>
          </div>
        </div>
        {bande1Data?.notes && <p style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 8, marginBottom: 0 }}>"{bande1Data.notes}"</p>}
        {!bande1Data && canWrite && <p style={{ fontSize: 12, color: "#E67E22", margin: "8px 0 0" }}>👆 Cliquez "Modifier" pour renseigner le solde bande 1</p>}
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

      {/* Onglets */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {[["depenses", "💸 Dépenses"], ["ventes", "🛒 Ventes"], ["credits", `💳 Crédits${totalCreditDu > 0 ? ` (${credits.filter(c => c.statut !== "payé").length})` : ""}`], ["dividendes", "🤝 Dividendes"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 11, cursor: "pointer", background: tab === id ? "#0F2940" : "#E8ECF0", color: tab === id ? "#fff" : "#666" }}>{label}</button>
        ))}
      </div>

      {tab === "depenses" && <>
        {canWrite && <button onClick={() => { setEditDepId(null); setDep({ date: "", categorie: "", description: "", montant: "" }); setShowDep(true); }} style={S.btn("#C0392B")}>+ Ajouter une dépense</button>}
        {!canWrite && <div style={S.alert("#AAB7B8")}><span style={{ color: "#888" }}>👁️ Lecture seule</span></div>}
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
        {canWrite && <button onClick={() => { setEditVenteId(null); setVente({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "", typeVente: "comptant", acompte: "", dateEcheance: "" }); setShowVente(true); }} style={S.btn("#1E8449")}>+ Enregistrer une vente</button>}
        {!canWrite && <div style={S.alert("#AAB7B8")}><span style={{ color: "#888" }}>👁️ Lecture seule</span></div>}
        {ventes.length === 0
          ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#AAB7B8" }}><div style={{ fontSize: 36 }}>🛒</div><p>Aucune vente</p></div>
          : ventes.map(v => (
            <div key={v.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{v.client}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{v.nbPoulets} poulets × {fmt(v.prixUnit)} • {v.date}</div>
                  <span style={S.tag("#1A5276")}>{v.canal}</span>
                  {v.notes && <span style={{ ...S.tag("#888"), marginLeft: 4 }}>{v.notes}</span>}
                  <SigLine auteur={v.auteur} heureAction={v.heureAction} modifiePar={v.modifiePar} heureModif={v.heureModif} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontWeight: 800, color: "#1E8449", fontSize: 13 }}>{fmt(v.total)}</span>
                  {canWrite && <button onClick={() => { setVente({ date: v.date, client: v.client, canal: v.canal, nbPoulets: v.nbPoulets, prixUnit: v.prixUnit, typeVente: "comptant", acompte: "", dateEcheance: "" }); setEditVenteId(v.id); setShowVente(true); }} style={S.btnIcon()}>✏️</button>}
                  {canWrite && <button onClick={() => delVente(v.id)} style={S.btnIcon("#FFF0F0")}>🗑️</button>}
                </div>
              </div>
            </div>
          ))
        }
      </>}

      {tab === "credits" && <>
        {canWrite && <button onClick={() => { setEditVenteId(null); setVente({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "", typeVente: "credit", acompte: "", dateEcheance: "" }); setShowVente(true); }} style={S.btn("#E67E22")}>+ Vente à crédit</button>}

        {/* Résumé crédits */}
        {credits.length > 0 && (
          <div style={S.kpiRow}>
            <div style={S.kpi("#C0392B")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(totalCreditDu)}</div><div style={S.kpiLbl}>Total dû</div></div>
            <div style={S.kpi("#1E8449")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(totalCreditRecu)}</div><div style={S.kpiLbl}>Total reçu</div></div>
          </div>
        )}

        {credits.length === 0
          ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#AAB7B8" }}><div style={{ fontSize: 36 }}>💳</div><p>Aucune vente à crédit</p></div>
          : credits.map(c => (
            <CreditCard key={c.id} c={c} canWrite={canWrite} marquerPayé={marquerPayé} delCredit={delCredit}
              creditStatutColor={creditStatutColor} creditStatutLabel={creditStatutLabel} />
          ))
        }
      </>}

      {tab === "dividendes" && <>
        <div style={{ ...S.card, background: benefice > 0 ? "#F0FFF4" : "#FFF5F5", border: `1.5px solid ${benefice > 0 ? "#1E8449" : "#C0392B"}` }}>
          <p style={{ fontWeight: 700, color: "#0F2940", marginBottom: 6 }}>Résultat net distribuable</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: benefice > 0 ? "#1E8449" : "#C0392B", margin: 0 }}>{fmt(benefice)}</p>
          {argentBande1 > 0 && <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Dont {fmt(argentBande1)} de la bande 1</p>}
          {totalCreditDu > 0 && <p style={{ fontSize: 11, color: "#E67E22", marginTop: 2 }}>+ {fmt(totalCreditDu)} de crédits en attente</p>}
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

      {/* Modals */}
      {showBande1 && (
        <Modal title="💛 Solde Bande 1" onClose={() => setShowBande1(false)}>
          <Field label="Argent restant (FCFA)" type="number" val={bande1Form.argentRestant} set={v => setBande1Form(p => ({ ...p, argentRestant: v }))} />
          <Field label="Poulets restants à vendre" type="number" val={bande1Form.nbPoussinsRestants} set={v => setBande1Form(p => ({ ...p, nbPoussinsRestants: v }))} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>Notes</label>
          <textarea value={bande1Form.notes} onChange={e => setBande1Form(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, height: 60, resize: "none" }} placeholder="Observations sur la bande 1..." />
          <button onClick={saveBande1} style={S.btn("#92400E")}>✅ Enregistrer</button>
        </Modal>
      )}

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
        <Modal title={editVenteId ? "✏️ Modifier la vente" : vente.typeVente === "credit" ? "💳 Vente à crédit" : "🛒 Nouvelle vente"} onClose={() => { setShowVente(false); setEditVenteId(null); }}>
          {/* Type de vente */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[["comptant", "💵 Comptant"], ["credit", "💳 À crédit"]].map(([val, label]) => (
              <button key={val} onClick={() => setVente(v => ({ ...v, typeVente: val }))}
                style={{ flex: 1, padding: "8px", borderRadius: 10, border: `2px solid ${vente.typeVente === val ? "#1A5276" : "#E0E6ED"}`, fontWeight: 700, fontSize: 12, cursor: "pointer", background: vente.typeVente === val ? "#1A5276" : "#fff", color: vente.typeVente === val ? "#fff" : "#666" }}>
                {label}
              </button>
            ))}
          </div>
          <Field label="Date" type="date" val={vente.date} set={v => setVente(p => ({ ...p, date: v }))} />
          <Field label="Client / Acheteur" type="text" val={vente.client} set={v => setVente(p => ({ ...p, client: v }))} />
          <Field label="Canal de vente" type="text" val={vente.canal} set={v => setVente(p => ({ ...p, canal: v }))} />
          <Field label="Nombre de poulets" type="number" val={vente.nbPoulets} set={v => setVente(p => ({ ...p, nbPoulets: v }))} />
          <Field label="Prix unitaire (FCFA)" type="number" val={vente.prixUnit} set={v => setVente(p => ({ ...p, prixUnit: v }))} />
          {vente.typeVente === "credit" && <>
            <Field label="Acompte reçu maintenant (FCFA, 0 si rien)" type="number" val={vente.acompte} set={v => setVente(p => ({ ...p, acompte: v }))} />
            <Field label="Date d'échéance prévue" type="date" val={vente.dateEcheance} set={v => setVente(p => ({ ...p, dateEcheance: v }))} />
          </>}
          {vente.nbPoulets && vente.prixUnit && (
            <div style={S.alert("#1E8449")}>
              <div style={{ fontWeight: 800, color: "#1E8449" }}>Total : {fmt(Number(vente.nbPoulets) * Number(vente.prixUnit))}</div>
              {vente.typeVente === "credit" && vente.acompte && <div style={{ fontSize: 12, color: "#E67E22", marginTop: 2 }}>Reste dû : {fmt(Number(vente.nbPoulets) * Number(vente.prixUnit) - Number(vente.acompte))}</div>}
            </div>
          )}
          <button onClick={saveVente} style={S.btn(vente.typeVente === "credit" ? "#E67E22" : "#1E8449")}>{editVenteId ? "✅ Modifier" : "✅ Enregistrer"}</button>
        </Modal>
      )}

      {showStock && (
        <Modal title="📦 Mettre à jour le stock aliments" onClose={() => setShowStock(false)}>
          <div style={{ ...S.card, background: "#F8F9FA", marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: "#555", margin: 0 }}>Stock actuel : <strong style={{ color: stock < 50 ? "#C0392B" : "#1E8449" }}>{fmtN(stock)} kg</strong></p>
            <p style={{ fontSize: 11, color: "#888", marginTop: 4, marginBottom: 0 }}>1 sac = 50 kg • Entrez le nombre de sacs terminés ou le kg restant réel</p>
          </div>
          <Field label="Type d'aliment" val={stockAjout.type} set={v => setStockAjout(p => ({ ...p, type: v }))}
            options={["Aliment Démarrage", "Aliment Croissance", "Aliment Finition"]} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setStockAjout(p => ({ ...p, mode: "ajouter" }))}
              style={{ flex: 1, padding: "8px", borderRadius: 10, border: `2px solid ${stockAjout.mode !== "definir" ? "#1A5276" : "#E0E6ED"}`, fontWeight: 700, fontSize: 12, cursor: "pointer", background: stockAjout.mode !== "definir" ? "#1A5276" : "#fff", color: stockAjout.mode !== "definir" ? "#fff" : "#666" }}>
              ➕ Ajouter des sacs
            </button>
            <button onClick={() => setStockAjout(p => ({ ...p, mode: "definir" }))}
              style={{ flex: 1, padding: "8px", borderRadius: 10, border: `2px solid ${stockAjout.mode === "definir" ? "#1A5276" : "#E0E6ED"}`, fontWeight: 700, fontSize: 12, cursor: "pointer", background: stockAjout.mode === "definir" ? "#1A5276" : "#fff", color: stockAjout.mode === "definir" ? "#fff" : "#666" }}>
              ✏️ Définir le stock
            </button>
          </div>
          {stockAjout.mode !== "definir" ? (
            <>
              <Field label="Nombre de sacs ajoutés (50 kg/sac)" type="number" val={stockAjout.nbSacs} set={v => setStockAjout(p => ({ ...p, nbSacs: v, qte: String(Number(v) * 50) }))} />
              {stockAjout.nbSacs && <div style={S.alert("#1E8449")}><span style={{ fontWeight: 700, color: "#1E8449" }}>+{fmtN(Number(stockAjout.nbSacs) * 50)} kg → Nouveau stock : {fmtN(stock + Number(stockAjout.nbSacs) * 50)} kg</span></div>}
            </>
          ) : (
            <>
              <Field label="Stock réel actuel (kg)" type="number" val={stockAjout.stockReel} set={v => setStockAjout(p => ({ ...p, stockReel: v }))} />
              {stockAjout.stockReel && <div style={S.alert("#1A5276")}><span style={{ fontWeight: 700, color: "#1A5276" }}>Nouveau stock défini : {fmtN(stockAjout.stockReel)} kg</span></div>}
            </>
          )}
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
function Associes({ depenses, ventes, userInfo, onLogout, presences = {} }) {
  if (!PERMS[userInfo?.role]?.associes) return <AccessDenied />;
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const benefice = Math.max(totalV - totalDep, 0);

  const emailMap = {
    "Alune": "fondateur_samapoulet_com",
    "Laye": "laye_samapoulet_com",
    "Daff": "daff_samapoulet_com",
  };

  const getPresence = (nom) => {
    try {
      const key = emailMap[nom];
      return (presences && key && presences[key]) ? presences[key] : null;
    } catch { return null; }
  };

  const getTempsDepuis = (isoDate) => {
    try {
      if (!isoDate) return null;
      const diff = Math.floor((new Date() - new Date(isoDate)) / 60000);
      if (diff < 1) return "À l'instant";
      if (diff < 60) return `il y a ${diff} min`;
      if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`;
      return `il y a ${Math.floor(diff / 1440)} jour(s)`;
    } catch { return null; }
  };

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
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{a.nom}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{a.role}</div>
              {(() => {
                const p = getPresence(a.nom);
                const temps = getTempsDepuis(p?.derniereConnexion);
                return p ? (
                  <div style={{ fontSize: 11, color: "#1E8449", marginTop: 3 }}>
                    🟢 Dernière connexion : {p.dateConnexion} à {p.heureConnexion} ({temps})
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#AAB7B8", marginTop: 3 }}>⚪ Jamais connecté</div>
                );
              })()}
            </div>
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

// ── CHAT INTERNE ──────────────────────────────────────────────────
function Chat({ userInfo }) {
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const q = query(collection(db, "samapoulet", "config", "chat"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => { const el = document.getElementById("chat-end"); if (el) el.scrollIntoView({ behavior: "smooth" }); }, 100);
    });
  }, []);

  const send = async () => {
    if (!msg.trim()) return;
    await addDoc(collection(db, "samapoulet", "config", "chat"), {
      texte: msg.trim(), auteur: userInfo?.nom || "—",
      couleur: userInfo?.couleur || "#888",
      createdAt: new Date().toISOString(),
      heure: nowTime(),
      date: new Date().toLocaleDateString("fr-FR"),
    });
    setMsg("");
  };

  const del = async (id) => { await deleteDoc(doc(db, "samapoulet", "config", "chat", id)); };

  const parDate = {};
  messages.forEach(m => { parDate[m.date] = [...(parDate[m.date] || []), m]; });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      <div style={{ ...S.header, paddingBottom: 12 }}>
        <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>💬 Chat Sama Poulet</p>
        <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0" }}>Alune • Laye • Daff</p>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {Object.entries(parDate).map(([date, msgs]) => (
          <div key={date}>
            <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
              <span style={{ background: "#E8ECF0", color: "#888", fontSize: 11, borderRadius: 10, padding: "3px 10px" }}>{date}</span>
            </div>
            {msgs.map(m => {
              const isMe = m.auteur === userInfo?.nom;
              return (
                <div key={m.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", marginBottom: 8, gap: 8, alignItems: "flex-end" }}>
                  {!isMe && <div style={{ width: 30, height: 30, borderRadius: 15, background: m.couleur || "#888", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{m.auteur?.[0] || "?"}</div>}
                  <div style={{ maxWidth: "75%" }}>
                    {!isMe && <div style={{ fontSize: 10, color: "#888", marginBottom: 2, fontWeight: 600 }}>{m.auteur}</div>}
                    <div style={{ background: isMe ? "#1A5276" : "#fff", color: isMe ? "#fff" : "#0F2940", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "8px 12px", fontSize: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>{m.texte}</div>
                    <div style={{ fontSize: 10, color: "#AAB7B8", marginTop: 2, textAlign: isMe ? "right" : "left" }}>{m.heure}</div>
                  </div>
                  {isMe && <button onClick={() => del(m.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#AAB7B8", paddingBottom: 16 }}>🗑️</button>}
                </div>
              );
            })}
          </div>
        ))}
        {messages.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#AAB7B8" }}><div style={{ fontSize: 40 }}>💬</div><p>Aucun message pour l'instant</p><p style={{ fontSize: 12 }}>Commencez la conversation !</p></div>}
        <div id="chat-end" />
      </div>
      <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid #E8ECF0", display: "flex", gap: 8, alignItems: "center" }}>
        <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Écrire un message..." style={{ ...S.input, marginBottom: 0, flex: 1 }} />
        <button onClick={send} style={{ background: "#1A5276", border: "none", borderRadius: 12, width: 44, height: 44, cursor: "pointer", fontSize: 20, flexShrink: 0, color: "#fff" }}>➤</button>
      </div>
    </div>
  );
}

// ── RAPPORT HEBDOMADAIRE ──────────────────────────────────────────
function Rapport({ suivi, depenses, ventes, vaccins, bandeCfg, incidents }) {
  const poussins = bandeCfg?.poussinsDepart || 450;
  const totalMorts = suivi.reduce((s, j) => s + Number(j.morts || 0), 0);
  const effectif = poussins - totalMorts;
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const resultat = totalV - totalDep;
  const nbVendus = ventes.reduce((s, v) => s + Number(v.nbPoulets || 0), 0);
  const vaccsRestants = vaccins.filter(v => !v.fait).length;
  const stock = bandeCfg?.stockAliments || 0;
  const dateDebut = bandeCfg?.dateDebut || "2026-05-15";
  const joursEcoules = Math.max(Math.floor((new Date() - new Date(dateDebut)) / 86400000) + 1, 1);
  const semaine = Math.min(Math.ceil(joursEcoules / 7), 8);

  const il7Jours = new Date(); il7Jours.setDate(il7Jours.getDate() - 7);
  const morts7j = suivi.filter(j => new Date(j.date) >= il7Jours).reduce((s, j) => s + Number(j.morts || 0), 0);
  const ventes7j = ventes.filter(v => new Date(v.date) >= il7Jours);
  const ca7j = ventes7j.reduce((s, v) => s + Number(v.total || 0), 0);
  const incidents7j = (incidents || []).filter(i => new Date(i.date) >= il7Jours);

  const copyRapport = () => {
    const txt = `🐓 RAPPORT SAMA POULET — Semaine ${semaine}\n📅 ${new Date().toLocaleDateString("fr-FR")}\n\n📊 BANDE EN COURS\n• Poussins départ : ${fmtN(poussins)}\n• Effectif actuel : ${fmtN(effectif)}\n• Morts totaux : ${fmtN(totalMorts)} (${((totalMorts/poussins)*100).toFixed(1)}%)\n• Vendus : ${fmtN(nbVendus)}\n• Restants : ${fmtN(effectif - nbVendus)}\n\n📅 CETTE SEMAINE\n• Morts : ${morts7j}\n• Ventes : ${fmt(ca7j)} (${ventes7j.length} transactions)\n• Incidents : ${incidents7j.length}\n\n💰 FINANCES\n• Investissement : ${fmt(totalDep)}\n• CA total : ${fmt(totalV)}\n• Résultat : ${resultat >= 0 ? "✅" : "❌"} ${fmt(Math.abs(resultat))}\n\n📦 STOCK ALIMENTS : ${fmtN(stock)} kg ${stock < 50 ? "⚠️ CRITIQUE" : "✅"}\n💉 VACCINATIONS RESTANTES : ${vaccsRestants}\n\nGénéré par Sama Poulet v2.2`;
    navigator.clipboard.writeText(txt).then(() => alert("✅ Rapport copié ! Collez dans WhatsApp."));
  };

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>📋 Rapport Hebdomadaire</p>
      <div style={{ ...S.card, background: "linear-gradient(135deg, #0F2940, #1A4A7A)", color: "#fff" }}>
        <p style={{ fontSize: 13, opacity: 0.8, margin: "0 0 4px" }}>Semaine {semaine} • {new Date().toLocaleDateString("fr-FR")}</p>
        <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Bande 2 — {bandeCfg?.objectif}</p>
      </div>
      <div style={S.card}>
        <p style={S.cardTitle}>📅 Cette semaine</p>
        <div style={S.kpiRow}>
          <div style={S.kpi("#C0392B")}><div style={S.kpiVal}>{morts7j}</div><div style={S.kpiLbl}>Morts</div></div>
          <div style={S.kpi("#1E8449")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(ca7j)}</div><div style={S.kpiLbl}>CA semaine</div></div>
        </div>
        <div style={S.kpiRow}>
          <div style={S.kpi("#E67E22")}><div style={S.kpiVal}>{ventes7j.length}</div><div style={S.kpiLbl}>Transactions</div></div>
          <div style={S.kpi(incidents7j.length > 0 ? "#C0392B" : "#1E8449")}><div style={S.kpiVal}>{incidents7j.length}</div><div style={S.kpiLbl}>Incidents</div></div>
        </div>
      </div>
      <div style={S.card}>
        <p style={S.cardTitle}>📊 Bilan général</p>
        {[["Effectif actuel", fmtN(effectif), "#1A5276"], ["Taux mortalité", ((totalMorts/poussins)*100).toFixed(1)+"%", totalMorts/poussins > 0.05 ? "#C0392B" : "#1E8449"], ["Poulets vendus", fmtN(nbVendus), "#1E8449"], ["Restants à vendre", fmtN(Math.max(effectif-nbVendus,0)), "#E67E22"], ["CA total", fmt(totalV), "#1E8449"], ["Investissement", fmt(totalDep), "#C0392B"], ["Résultat net", fmt(Math.abs(resultat)), resultat >= 0 ? "#1E8449" : "#C0392B"], ["Stock aliments", fmtN(stock)+" kg", stock < 50 ? "#C0392B" : "#1E8449"], ["Vaccins restants", vaccsRestants.toString(), vaccsRestants > 0 ? "#E67E22" : "#1E8449"]].map(([l, v, c]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F0F4F8" }}>
            <span style={{ fontSize: 13, color: "#555" }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: c }}>{v}</span>
          </div>
        ))}
      </div>
      {(stock < 50 || vaccsRestants > 0) && (
        <div style={S.card}>
          <p style={S.cardTitle}>⚠️ Points d'attention</p>
          {stock < 50 && <div style={S.alert("#C0392B")}>🚨 Stock aliments critique : {fmtN(stock)} kg</div>}
          {vaccsRestants > 0 && <div style={S.alert("#E67E22")}>💉 {vaccsRestants} vaccination(s) à faire</div>}
        </div>
      )}
      <button onClick={copyRapport} style={{ ...S.btn("#1A5276"), marginBottom: 12 }}>📋 Copier le rapport (WhatsApp)</button>
      <div style={{ ...S.card, background: "#F8F9FA" }}>
        <p style={S.cardTitle}>💡 Comment envoyer</p>
        <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>1. Cliquez "Copier le rapport"</p>
        <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>2. Ouvrez WhatsApp → groupe Sama Poulet</p>
        <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>3. Collez et envoyez</p>
        <p style={{ fontSize: 12, color: "#AAB7B8", marginTop: 8 }}>À faire chaque lundi matin !</p>
      </div>
    </div>
  );
}

// ── GALERIE PHOTOS ────────────────────────────────────────────────
function GaleriePhotos({ userInfo, bandeActive }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ titre: "", categorie: "Poulets", notes: "", photoBase64: "" });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "samapoulet", bandeActive, "photos"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [bandeActive]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Compresser en base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = h * MAX / w; w = MAX; }
        if (h > MAX) { w = w * MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL("image/jpeg", 0.7);
        setForm(f => ({ ...f, photoBase64: b64 }));
        setPreview(b64);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.photoBase64) return;
    setUploading(true);
    await addDoc(collection(db, "samapoulet", bandeActive, "photos"), {
      ...form, ...makeSig(userInfo),
      date: new Date().toLocaleDateString("fr-FR"),
    });
    setForm({ titre: "", categorie: "Poulets", notes: "", photoBase64: "" });
    setPreview(null);
    setShowAdd(false);
    setUploading(false);
  };

  const del = async (id) => { if (window.confirm("Supprimer cette photo ?")) await deleteDoc(doc(db, "samapoulet", bandeActive, "photos", id)); };

  const cats = ["Poulets", "Incident sanitaire", "Vente", "Infrastructure", "Autre"];
  const catColors = { "Poulets": "#1E8449", "Incident sanitaire": "#C0392B", "Vente": "#1A5276", "Infrastructure": "#E67E22", "Autre": "#888" };

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={S.sectionTitle}>📸 Galerie Photos</p>
        <button onClick={() => setShowAdd(true)} style={S.btnSm("#1A5276")}>+ Photo</button>
      </div>

      <div style={S.kpiRow}>
        <div style={S.kpi("#1A5276")}><div style={S.kpiVal}>{photos.length}</div><div style={S.kpiLbl}>Photos prises</div></div>
        <div style={S.kpi("#1E8449")}><div style={S.kpiVal}>{photos.filter(p => p.categorie === "Incident sanitaire").length}</div><div style={S.kpiLbl}>Incidents photo</div></div>
      </div>

      {photos.length === 0
        ? <div style={{ ...S.card, textAlign: "center", padding: 32, color: "#AAB7B8" }}><div style={{ fontSize: 40 }}>📷</div><p>Aucune photo pour l'instant</p><p style={{ fontSize: 12 }}>Prenez des photos des poulets, incidents, ventes...</p></div>
        : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {photos.map(p => (
              <div key={p.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                <div style={{ position: "relative" }}>
                  <img src={p.photoBase64} alt={p.titre} style={{ width: "100%", height: 120, objectFit: "cover" }} />
                  <button onClick={() => del(p.id)} style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 20, width: 24, height: 24, cursor: "pointer", color: "#fff", fontSize: 11 }}>🗑️</button>
                  <span style={{ position: "absolute", bottom: 6, left: 6, background: (catColors[p.categorie] || "#888") + "CC", color: "#fff", borderRadius: 6, padding: "2px 6px", fontSize: 9, fontWeight: 700 }}>{p.categorie}</span>
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0F2940" }}>{p.titre || "Sans titre"}</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{p.date} • {p.auteur}</div>
                  {p.notes && <div style={{ fontSize: 10, color: "#666", fontStyle: "italic", marginTop: 2 }}>"{p.notes}"</div>}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {showAdd && (
        <Modal title="Ajouter une photo" onClose={() => { setShowAdd(false); setPreview(null); setForm({ titre: "", categorie: "Poulets", notes: "", photoBase64: "" }); }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 6 }}>📷 Prendre ou choisir une photo</label>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto}
              style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1.5px dashed #1A5276", background: "#F8FAFC", cursor: "pointer", boxSizing: "border-box" }} />
          </div>
          {preview && <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 10, marginBottom: 10, maxHeight: 200, objectFit: "cover" }} />}
          <Field label="Titre" type="text" val={form.titre} set={v => setForm(p => ({ ...p, titre: v }))} />
          <Field label="Catégorie" val={form.categorie} set={v => setForm(p => ({ ...p, categorie: v }))} options={cats} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...S.input, height: 60, resize: "none" }} placeholder="Description de la photo..." />
          <button onClick={save} disabled={!form.photoBase64 || uploading} style={{ ...S.btn("#1A5276"), opacity: !form.photoBase64 || uploading ? 0.6 : 1 }}>
            {uploading ? "⏳ Enregistrement..." : "✅ Enregistrer la photo"}
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── EXPORT PDF ────────────────────────────────────────────────────
function ExportPDF({ suivi, depenses, ventes, vaccins, bandeCfg, incidents, userInfo }) {
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
  const stock = bandeCfg?.stockAliments || 0;

  const genererPDF = () => {
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Sama Poulet — Bande 2</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
  h1 { color: #0F2940; border-bottom: 3px solid #C9A84C; padding-bottom: 10px; }
  h2 { color: #1A5276; margin-top: 24px; font-size: 16px; }
  .header { background: #0F2940; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  .header h1 { color: white; border-bottom: 1px solid rgba(255,255,255,0.3); }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
  .kpi { background: #f5f5f5; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi-val { font-size: 22px; font-weight: bold; color: #0F2940; }
  .kpi-lbl { font-size: 11px; color: #888; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
  th { background: #0F2940; color: white; padding: 8px; text-align: left; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
  tr:nth-child(even) { background: #f9f9f9; }
  .positif { color: #1E8449; font-weight: bold; }
  .negatif { color: #C0392B; font-weight: bold; }
  .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
  .alerte { background: #FFF3CD; border-left: 4px solid #F59E0B; padding: 8px 12px; margin: 8px 0; border-radius: 4px; font-size: 13px; }
</style>
</head>
<body>
<div class="header">
  <h1>🐓 SAMA POULET — Rapport Bande 2</h1>
  <p>Keur Madaro, Thiès • Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} • Par ${userInfo?.nom}</p>
  <p>Semaine ${semaine}/6 • Objectif : ${bandeCfg?.objectif || ""}</p>
</div>

<h2>📊 TABLEAU DE BORD</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-val">${fmtN(effectif)}</div><div class="kpi-lbl">Effectif actuel</div></div>
  <div class="kpi"><div class="kpi-val">${fmtN(totalMorts)}</div><div class="kpi-lbl">Morts (${((totalMorts/poussins)*100).toFixed(1)}%)</div></div>
  <div class="kpi"><div class="kpi-val">${fmtN(nbVendus)}</div><div class="kpi-lbl">Vendus</div></div>
  <div class="kpi"><div class="kpi-val">${fmt(totalV)}</div><div class="kpi-lbl">CA total</div></div>
  <div class="kpi"><div class="kpi-val">${fmt(totalDep)}</div><div class="kpi-lbl">Investissement</div></div>
  <div class="kpi"><div class="kpi-val ${resultat >= 0 ? "positif" : "negatif"}">${fmt(Math.abs(resultat))}</div><div class="kpi-lbl">${resultat >= 0 ? "✅ Bénéfice" : "❌ Perte"}</div></div>
</div>

${stock < 50 ? `<div class="alerte">⚠️ Stock aliments critique : ${fmtN(stock)} kg — approvisionner urgent !</div>` : ""}

<h2>💸 DÉPENSES DÉTAILLÉES</h2>
<table>
  <tr><th>Date</th><th>Catégorie</th><th>Description</th><th>Montant</th><th>Par</th></tr>
  ${depenses.map(d => `<tr><td>${d.date || ""}</td><td>${d.categorie || ""}</td><td>${d.description || ""}</td><td class="negatif">${fmt(d.montant)}</td><td>${d.auteur || ""}</td></tr>`).join("")}
  <tr style="background:#f0f0f0;font-weight:bold"><td colspan="3">TOTAL</td><td class="negatif">${fmt(totalDep)}</td><td></td></tr>
</table>

<h2>🛒 VENTES DÉTAILLÉES</h2>
<table>
  <tr><th>Date</th><th>Client</th><th>Canal</th><th>Nb poulets</th><th>Prix unit.</th><th>Total</th><th>Par</th></tr>
  ${ventes.map(v => `<tr><td>${v.date || ""}</td><td>${v.client || ""}</td><td>${v.canal || ""}</td><td>${v.nbPoulets || 0}</td><td>${fmt(v.prixUnit)}</td><td class="positif">${fmt(v.total)}</td><td>${v.auteur || ""}</td></tr>`).join("")}
  <tr style="background:#f0f0f0;font-weight:bold"><td colspan="5">TOTAL</td><td class="positif">${fmt(totalV)}</td><td></td></tr>
</table>

<h2>💉 VACCINATIONS</h2>
<table>
  <tr><th>Vaccin</th><th>Semaine</th><th>Date prévue</th><th>Statut</th><th>Date réelle</th><th>Par</th></tr>
  ${vaccins.map(v => `<tr><td>${v.vaccin}</td><td>Sem. ${v.semaine}</td><td>${v.datePrevue}</td><td>${v.fait ? "✅ Fait" : "⏳ À faire"}</td><td>${v.dateReelle || ""}</td><td>${v.auteur || ""}</td></tr>`).join("")}
</table>

${incidents && incidents.length > 0 ? `
<h2>🚨 INCIDENTS SANITAIRES</h2>
<table>
  <tr><th>Date</th><th>Animaux</th><th>Symptômes</th><th>Traitement</th><th>Par</th></tr>
  ${incidents.map(i => `<tr><td>${i.date || ""}</td><td>${i.nbAnimaux || 0}</td><td>${i.symptomes || ""}</td><td>${i.traitement || ""}</td><td>${i.auteur || ""}</td></tr>`).join("")}
</table>` : ""}

<h2>📈 RÉSUMÉ FINANCIER</h2>
<table>
  <tr><th>Indicateur</th><th>Valeur</th></tr>
  <tr><td>Investissement total</td><td class="negatif">${fmt(totalDep)}</td></tr>
  <tr><td>Chiffre d'affaires</td><td class="positif">${fmt(totalV)}</td></tr>
  <tr><td>Résultat net</td><td class="${resultat >= 0 ? "positif" : "negatif"}">${fmt(Math.abs(resultat))} ${resultat >= 0 ? "(Bénéfice)" : "(Perte)"}</td></tr>
  <tr><td>Dividende Alune (59%)</td><td class="positif">${fmt(Math.max(resultat, 0) * 0.59)}</td></tr>
  <tr><td>Dividende Laye (25%)</td><td class="positif">${fmt(Math.max(resultat, 0) * 0.25)}</td></tr>
  <tr><td>Dividende Daff (16%)</td><td class="positif">${fmt(Math.max(resultat, 0) * 0.16)}</td></tr>
</table>

<div class="footer">
  Sama Poulet v2.3 — Keur Madaro, Thiès, Sénégal<br>
  Document généré automatiquement le ${new Date().toLocaleDateString("fr-FR")}
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SamaPoulet_Rapport_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>📄 Export & Rapports</p>

      <div style={{ ...S.card, background: "linear-gradient(135deg, #0F2940, #1A4A7A)", color: "#fff" }}>
        <p style={{ fontSize: 14, fontWeight: 800, margin: "0 0 6px" }}>📊 Rapport complet PDF</p>
        <p style={{ fontSize: 12, opacity: 0.75, margin: "0 0 14px" }}>Inclut : dépenses, ventes, vaccinations, incidents, dividendes</p>
        <button onClick={genererPDF} style={{ background: "#C9A84C", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: "pointer", width: "100%" }}>
          📥 Télécharger le rapport
        </button>
      </div>

      <div style={S.card}>
        <p style={S.cardTitle}>📋 Ce que contient le rapport</p>
        {["Tableau de bord complet", "Toutes les dépenses détaillées", "Toutes les ventes avec clients", "Statut vaccinations", "Incidents sanitaires", "Résumé financier + dividendes"].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F0F4F8" }}>
            <span style={{ color: "#1E8449", fontSize: 14 }}>✅</span>
            <span style={{ fontSize: 13 }}>{item}</span>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, background: "#F8F9FA" }}>
        <p style={S.cardTitle}>💡 Comment ouvrir le rapport</p>
        <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>1. Cliquez "Télécharger le rapport"</p>
        <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>2. Le fichier .html se télécharge</p>
        <p style={{ fontSize: 13, color: "#555", margin: "4px 0" }}>3. Ouvrez-le dans Chrome → Imprimer → Enregistrer en PDF</p>
        <p style={{ fontSize: 12, color: "#AAB7B8", marginTop: 8 }}>Compatible avec tous les appareils !</p>
      </div>
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
  const [presences, setPresences] = useState({});

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const info = USERS[u.email] || { nom: u.email.split("@")[0], role: "production", parts: 0, couleur: "#888" };
        setUserInfo(info);
        try {
          const key = u.email.replace(/[@.]/g, "_");
          await setDoc(doc(db, "samapoulet", "config", "presences", key), {
            nom: info.nom, email: u.email, couleur: info.couleur,
            derniereConnexion: new Date().toISOString(),
            dateConnexion: new Date().toLocaleDateString("fr-FR"),
            heureConnexion: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          });
        } catch(e) { console.log("Presence error:", e); }
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, "samapoulet", "config", "presences"), snap => {
      const p = {};
      snap.docs.forEach(d => { p[d.id] = d.data(); });
      setPresences(p);
    });
  }, [user]);

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
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>v2.3 — Chargement...</p>
    </div>
  );

  if (!user) return <Login />;

  const mainTabs = [
    { id: "dashboard", icon: "📊", label: "Accueil" },
    { id: "suivi", icon: "🐔", label: "Suivi" },
    { id: "finances", icon: "💰", label: "Finances" },
    { id: "chat", icon: "💬", label: "Chat" },
    { id: "more", icon: "☰", label: "Plus" },
  ];

  const moreTabs = [
    { id: "analytics", icon: "📈", label: "Stats" },
    { id: "calcul", icon: "🧮", label: "Calculateur" },
    { id: "rapport", icon: "📋", label: "Rapport" },
    { id: "photos", icon: "📸", label: "Photos" },
    { id: "export", icon: "📄", label: "Export PDF" },
    { id: "clients", icon: "👥", label: "Clients" },
    { id: "fournisseurs", icon: "🏪", label: "Fournisseurs" },
    { id: "sante", icon: "💉", label: "Santé" },
    { id: "strategie", icon: "🚀", label: "Stratégie" },
    { id: "associes", icon: "🤝", label: "Associés" },
    { id: "bandes", icon: "🐣", label: "Bandes" },
  ];

  const isMainTab = mainTabs.some(t => t.id === tab);
  const activeLabel = [...mainTabs, ...moreTabs].find(t => t.id === tab)?.label || "";

  return (
    <div style={S.app}>
      {/* Header secondaire pour les onglets "Plus" */}
      {!isMainTab && tab !== "more" && (
        <div style={{ background: "#0F2940", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setTab("more")} style={{ background: "none", border: "none", color: "#C9A84C", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{moreTabs.find(t => t.id === tab)?.icon} {activeLabel}</span>
        </div>
      )}

      {tab === "dashboard" && <Dashboard suivi={suivi} depenses={depenses} ventes={ventes} vaccins={vaccins} userInfo={userInfo} bandeCfg={bandeCfg} />}
      {tab === "suivi" && <SuiviQuotidien suivi={suivi} userInfo={userInfo} bandeCfg={bandeCfg} bandeActive={bandeActive} />}
      {tab === "finances" && <Finances depenses={depenses} ventes={ventes} userInfo={userInfo} bandeActive={bandeActive} bandeCfg={bandeCfg} setBandeCfg={setBandeCfg} />}
      {tab === "analytics" && <Analytics suivi={suivi} depenses={depenses} ventes={ventes} bandeCfg={bandeCfg} />}
      {tab === "calcul" && <Calculateur depenses={depenses} suivi={suivi} bandeCfg={bandeCfg} />}
      {tab === "rapport" && <Rapport suivi={suivi} depenses={depenses} ventes={ventes} vaccins={vaccins} bandeCfg={bandeCfg} incidents={incidents} />}
      {tab === "photos" && <GaleriePhotos userInfo={userInfo} bandeActive={bandeActive} />}
      {tab === "export" && <ExportPDF suivi={suivi} depenses={depenses} ventes={ventes} vaccins={vaccins} bandeCfg={bandeCfg} incidents={incidents} userInfo={userInfo} />}
      {tab === "chat" && <Chat userInfo={userInfo} />}
      {tab === "clients" && <Clients userInfo={userInfo} bandeActive={bandeActive} ventes={ventes} />}
      {tab === "fournisseurs" && <Fournisseurs userInfo={userInfo} />}
      {tab === "sante" && <Sante vaccins={vaccins} incidents={incidents} userInfo={userInfo} bandeActive={bandeActive} />}
      {tab === "strategie" && <Strategie phases={phases} setPhases={setPhases} userInfo={userInfo} />}
      {tab === "associes" && <Associes depenses={depenses} ventes={ventes} userInfo={userInfo} onLogout={() => signOut(auth)} presences={presences} />}
      {tab === "bandes" && <GestionBandes bandes={bandes} bandeActive={bandeActive} setBandeActive={setBandeActive} userInfo={userInfo} />}

      {/* Menu "Plus" */}
      {tab === "more" && (
        <div style={S.section}>
          <div style={S.header}>
            <p style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>☰ Menu</p>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0" }}>Toutes les fonctionnalités</p>
          </div>
          <div style={{ height: 16 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {moreTabs.map(t => (
              <div key={t.id} onClick={() => setTab(t.id)}
                style={{ background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", transition: "transform 0.1s", border: "1.5px solid #F0F4F8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2940" }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Barre de navigation fixe en bas */}
      <div style={S.nav}>
        {mainTabs.map(t => {
          const isActive = t.id === "more" ? tab === "more" || moreTabs.some(m => m.id === tab) : tab === t.id;
          return (
            <div key={t.id} style={S.navItem(isActive)} onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? "#1A5276" : "#888" }}>{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
