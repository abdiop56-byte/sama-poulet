import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, query, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5WRC372Qs-BogkUDEVbqwfxBTw3YeehA",
  authDomain: "sama-poulet.firebaseapp.com",
  projectId: "sama-poulet",
  storageBucket: "sama-poulet.firebasestorage.app",
  messagingSenderId: "763618619854",
  appId: "1:763618619854:web:7b4b9a50991b639fc1bb9f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const USERS = {
  "fondateur@samapoulet.com": { nom: "Fondateur", parts: 59, couleur: "#1A5276" },
  "laye@samapoulet.com": { nom: "Laye", parts: 25, couleur: "#1E8449" },
  "daff@samapoulet.com": { nom: "Daff", parts: 16, couleur: "#784212" },
};

const BANDE = { dateDebut: "2026-05-15", poussinsDepart: 450, objectif: "Tamkharite ~25 Juin 2026" };

const VACCINS_INIT = [
  { id: "v1", vaccin: "Newcastle (Hitchner B1)", semaine: 1, datePrevue: "21/05/2026", fait: false, dateReelle: "" },
  { id: "v2", vaccin: "Gumboro (IBD)", semaine: 2, datePrevue: "28/05/2026", fait: false, dateReelle: "" },
  { id: "v3", vaccin: "Newcastle (Clone 30)", semaine: 3, datePrevue: "04/06/2026", fait: false, dateReelle: "" },
  { id: "v4", vaccin: "Gumboro rappel", semaine: 3, datePrevue: "04/06/2026", fait: false, dateReelle: "" },
  { id: "v5", vaccin: "Newcastle rappel", semaine: 5, datePrevue: "18/06/2026", fait: false, dateReelle: "" },
];

const ASSOCIES = [
  { id: 1, nom: "Fondateur", role: "Fondateur & Investisseur", parts: 59, couleur: "#1A5276" },
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
  { id: 1, canal: "Restaurant Eggette (Mbour)", statut: "Contrat à signer Samedi", priorite: "haute" },
  { id: 2, canal: "Particuliers / marché local", statut: "À développer", priorite: "haute" },
  { id: 3, canal: "Revendeurs / bana-bana Thiès", statut: "À contacter", priorite: "moyenne" },
  { id: 4, canal: "Restaurants & gargotes Thiès", statut: "À prospecter", priorite: "moyenne" },
];

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " F";
const fmtN = (n) => Number(n || 0).toLocaleString("fr-FR");

const S = {
  app: { fontFamily: "'Segoe UI', sans-serif", background: "#F0F4F8", minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 80 },
  header: { background: "linear-gradient(135deg, #0F2940, #1A4A7A)", padding: "20px 16px 16px", color: "#fff" },
  card: { background: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#0F2940", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  kpiRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 },
  kpi: (c) => ({ background: c, borderRadius: 12, padding: "12px 14px", color: "#fff" }),
  kpiVal: { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  kpiLbl: { fontSize: 11, opacity: 0.85, marginTop: 3 },
  bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #E8ECF0", display: "flex", justifyContent: "space-around", padding: "8px 0 12px", zIndex: 200, boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" },
  navItem: (a) => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", opacity: a ? 1 : 0.45 }),
  input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #E0E6ED", fontSize: 14, background: "#F8FAFC", boxSizing: "border-box", marginBottom: 8, outline: "none" },
  btn: (c = "#1A5276") => ({ background: c, color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 4 }),
  btnSm: (c = "#1A5276") => ({ background: c, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }),
  tag: (c) => ({ background: c + "22", color: c, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, display: "inline-block" }),
  section: { padding: "16px 16px 0" },
  sectionTitle: { fontSize: 16, fontWeight: 800, color: "#0F2940", marginBottom: 12 },
  alert: (c) => ({ background: c + "15", border: `1.5px solid ${c}40`, borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 13 }),
  bar: (p, c) => ({ height: "100%", width: Math.min(Number(p) || 0, 100) + "%", background: c, borderRadius: 4, transition: "width 0.5s" }),
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F0F4F8" },
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

function Field({ label, k, type = "text", val, set }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>{label}</label>
      <input type={type} value={val} onChange={e => set(e.target.value)} style={S.input} />
    </div>
  );
}

// ── LOGIN ─────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [reg, setReg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const go = async () => {
    setLoading(true); setErr("");
    try {
      if (reg) await createUserWithEmailAndPassword(auth, email, pwd);
      else await signInWithEmailAndPassword(auth, email, pwd);
    } catch (e) {
      const m = { "auth/invalid-credential": "Email ou mot de passe incorrect", "auth/email-already-in-use": "Email déjà utilisé", "auth/weak-password": "Mot de passe trop court (6 car. min)" };
      setErr(m[e.code] || "Erreur : " + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0F2940, #1A4A7A 60%, #0F2940)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 70 }}>🐓</div>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 900, margin: "10px 0 0" }}>SAMA POULET</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginTop: 6 }}>Keur Madaro, Thiès • Bande 2</p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.09)", borderRadius: 20, padding: 24, backdropFilter: "blur(10px)" }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, marginBottom: 14, fontSize: 14 }}>{reg ? "Créer un compte" : "Connexion"}</p>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ ...S.input, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", "::placeholder": { color: "rgba(255,255,255,0.4)" } }} />
          <input type="password" placeholder="Mot de passe" value={pwd} onChange={e => setPwd(e.target.value)}
            style={{ ...S.input, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} />
          {err && <p style={{ color: "#FF6B6B", fontSize: 12, marginBottom: 8 }}>⚠️ {err}</p>}
          <button onClick={go} disabled={loading} style={{ ...S.btn("#C9A84C"), opacity: loading ? 0.7 : 1 }}>
            {loading ? "⏳ Connexion..." : reg ? "Créer le compte" : "Se connecter"}
          </button>
          <p onClick={() => setReg(!reg)} style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "center", marginTop: 12, cursor: "pointer" }}>
            {reg ? "Déjà un compte ? Se connecter" : "Première fois ? Créer un compte"}
          </p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 12, marginTop: 14 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0, textAlign: "center", lineHeight: 1.6 }}>
            fondateur@samapoulet.com<br />laye@samapoulet.com<br />daff@samapoulet.com
          </p>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────
function Dashboard({ suivi, depenses, ventes, vaccins, userInfo }) {
  const totalMorts = suivi.reduce((s, j) => s + Number(j.morts || 0), 0);
  const effectif = BANDE.poussinsDepart - totalMorts;
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalVentes = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const resultat = totalVentes - totalDep;
  const nbVendus = ventes.reduce((s, v) => s + Number(v.nbPoulets || 0), 0);
  const joursEcoules = Math.max(Math.floor((new Date() - new Date(BANDE.dateDebut)) / 86400000) + 1, 1);
  const semaine = Math.min(Math.ceil(joursEcoules / 7), 8);
  const tauxMort = ((totalMorts / BANDE.poussinsDepart) * 100).toFixed(1);
  const progPct = Math.min((joursEcoules / 42) * 100, 100).toFixed(0);
  const vaccsRestants = vaccins.filter(v => !v.fait).length;

  return (
    <div>
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>🐓 Sama Poulet</p>
            <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0" }}>Bonjour {userInfo?.nom} • Bande 2</p>
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

        <div style={S.kpiRow}>
          <div style={S.kpi("#1A5276")}><div style={S.kpiVal}>{fmtN(effectif)}</div><div style={S.kpiLbl}>Effectif actuel</div></div>
          <div style={S.kpi("#C0392B")}><div style={S.kpiVal}>{fmtN(totalMorts)}</div><div style={S.kpiLbl}>Morts ({tauxMort}%)</div></div>
        </div>
        <div style={S.kpiRow}>
          <div style={S.kpi("#1E8449")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(totalVentes)}</div><div style={S.kpiLbl}>Total ventes</div></div>
          <div style={S.kpi(resultat >= 0 ? "#0F2940" : "#8B1A1A")}><div style={{ fontSize: 15, fontWeight: 800 }}>{fmt(Math.abs(resultat))}</div><div style={S.kpiLbl}>{resultat >= 0 ? "✅ Bénéfice" : "❌ Perte"}</div></div>
        </div>

        <div style={{ ...S.card, background: "linear-gradient(135deg, #0F2940, #1A4A7A)", color: "#fff" }}>
          <p style={{ fontSize: 11, opacity: 0.7, margin: "0 0 8px" }}>🎯 {BANDE.objectif}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: 8 }}>
            {[["Vendus", nbVendus], ["Restants", Math.max(effectif - nbVendus, 0)], ["Départ", BANDE.poussinsDepart]].map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 20, fontWeight: 800 }}>{fmtN(v)}</div><div style={{ fontSize: 10, opacity: 0.65 }}>{l}</div></div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <p style={S.cardTitle}>📅 Calendrier Bande 2</p>
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
function SuiviQuotidien({ suivi }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ date: new Date().toISOString().split("T")[0], morts: "", alimentKg: "", poidsMoyen: "", temperature: "", observations: "" });
  const totalMorts = suivi.reduce((s, j) => s + Number(j.morts || 0), 0);
  const effectif = BANDE.poussinsDepart - totalMorts;

  const save = async () => {
    if (!f.date) return;
    await addDoc(collection(db, "samapoulet", "bande2", "suiviQuotidien"), {
      ...f, morts: Number(f.morts || 0), effectifFin: effectif - Number(f.morts || 0), createdAt: new Date().toISOString()
    });
    setF({ date: new Date().toISOString().split("T")[0], morts: "", alimentKg: "", poidsMoyen: "", temperature: "", observations: "" });
    setShow(false);
  };

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={S.sectionTitle}>🐔 Suivi Quotidien</p>
        <button onClick={() => setShow(true)} style={S.btnSm("#1E8449")}>+ Saisir</button>
      </div>
      <div style={S.kpiRow}>
        <div style={S.kpi("#1A5276")}><div style={S.kpiVal}>{fmtN(effectif)}</div><div style={S.kpiLbl}>Effectif actuel</div></div>
        <div style={S.kpi("#C0392B")}><div style={S.kpiVal}>{fmtN(totalMorts)}</div><div style={S.kpiLbl}>Total morts</div></div>
      </div>
      {suivi.length === 0
        ? <div style={{ ...S.card, textAlign: "center", padding: 32, color: "#AAB7B8" }}><div style={{ fontSize: 40 }}>📋</div><p>Aucune saisie pour l'instant</p></div>
        : suivi.slice(0, 15).map(j => (
          <div key={j.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: "#0F2940" }}>📅 {j.date}</span>
              <span style={S.tag(j.morts > 5 ? "#C0392B" : "#1E8449")}>{j.morts} mort(s)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[["Effectif", j.effectifFin], ["Aliment kg", j.alimentKg || "—"], ["Temp °C", j.temperature || "—"]].map(([l, v]) => (
                <div key={l} style={{ background: "#F8FAFC", borderRadius: 8, padding: "6px 8px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{v}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{l}</div>
                </div>
              ))}
            </div>
            {j.observations && <p style={{ fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic", marginBottom: 0 }}>"{j.observations}"</p>}
          </div>
        ))
      }
      {show && (
        <Modal title="Saisie journalière" onClose={() => setShow(false)}>
          {[["Date", "date", "date"], ["Nombre de morts", "morts", "number"], ["Aliment consommé (kg)", "alimentKg", "number"], ["Poids moyen (g)", "poidsMoyen", "number"], ["Température (°C)", "temperature", "number"]].map(([l, k, t]) => (
            <Field key={k} label={l} k={k} type={t} val={f[k]} set={v => setF(p => ({ ...p, [k]: v }))} />
          ))}
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>Observations</label>
          <textarea value={f.observations} onChange={e => setF(p => ({ ...p, observations: e.target.value }))} style={{ ...S.input, height: 70, resize: "none" }} placeholder="Comportement, météo, incidents..." />
          <button onClick={save} style={S.btn("#1E8449")}>✅ Enregistrer</button>
        </Modal>
      )}
    </div>
  );
}

// ── FINANCES ──────────────────────────────────────────────────────
function Finances({ depenses, ventes }) {
  const [tab, setTab] = useState("depenses");
  const [showDep, setShowDep] = useState(false);
  const [showVente, setShowVente] = useState(false);
  const [dep, setDep] = useState({ date: "", categorie: "", description: "", montant: "" });
  const [vente, setVente] = useState({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "" });
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const resultat = totalV - totalDep;
  const benefice = Math.max(resultat, 0);
  const cats = ["Poussins", "Aliment Démarrage", "Aliment Croissance", "Aliment Finition", "Vaccins", "Médicaments", "Litière", "Transport", "Autres"];

  const saveDep = async () => {
    if (!dep.montant) return;
    await addDoc(collection(db, "samapoulet", "bande2", "depenses"), { ...dep, montant: Number(dep.montant), createdAt: new Date().toISOString() });
    setDep({ date: "", categorie: "", description: "", montant: "" });
    setShowDep(false);
  };

  const saveVente = async () => {
    if (!vente.nbPoulets || !vente.prixUnit) return;
    await addDoc(collection(db, "samapoulet", "bande2", "ventes"), { ...vente, nbPoulets: Number(vente.nbPoulets), prixUnit: Number(vente.prixUnit), total: Number(vente.nbPoulets) * Number(vente.prixUnit), createdAt: new Date().toISOString() });
    setVente({ date: "", client: "", canal: "", nbPoulets: "", prixUnit: "" });
    setShowVente(false);
  };

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

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[["depenses", "Dépenses"], ["ventes", "Ventes"], ["dividendes", "Dividendes"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: tab === id ? "#0F2940" : "#E8ECF0", color: tab === id ? "#fff" : "#666" }}>{label}</button>
        ))}
      </div>

      {tab === "depenses" && <>
        <button onClick={() => setShowDep(true)} style={S.btn("#C0392B")}>+ Ajouter une dépense</button>
        {depenses.length === 0
          ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#AAB7B8" }}><div style={{ fontSize: 36 }}>💸</div><p>Aucune dépense</p></div>
          : depenses.map(d => (
            <div key={d.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.description || d.categorie}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{d.categorie} • {d.date}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, color: "#C0392B" }}>{fmt(d.montant)}</span>
                  <button onClick={() => {
                    if (window.confirm("Supprimer cette dépense ?")) {
                      import("firebase/firestore").then(({ deleteDoc, doc: fDoc }) => {
                        deleteDoc(fDoc(db, "samapoulet", "bande2", "depenses", d.id));
                      });
                    }
                  }} style={{ background: "#FFF0F0", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontSize: 16, color: "#C0392B" }}>🗑️</button>
                </div>
              </div>
            </div>
          ))
        }
      </>}

      {tab === "ventes" && <>
        <button onClick={() => setShowVente(true)} style={S.btn("#1E8449")}>+ Enregistrer une vente</button>
        {ventes.length === 0
          ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#AAB7B8" }}><div style={{ fontSize: 36 }}>🛒</div><p>Aucune vente</p></div>
          : ventes.map(v => (
            <div key={v.id} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{v.client}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{v.nbPoulets} poulets × {fmt(v.prixUnit)} • {v.date}</div>
                  <span style={S.tag("#1A5276")}>{v.canal}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 800, color: "#1E8449" }}>{fmt(v.total)}</span>
                  <button onClick={() => {
                    if (window.confirm("Supprimer cette vente ?")) {
                      import("firebase/firestore").then(({ deleteDoc, doc: fDoc }) => {
                        deleteDoc(fDoc(db, "samapoulet", "bande2", "ventes", v.id));
                      });
                    }
                  }} style={{ background: "#F0FFF4", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontSize: 16, color: "#C0392B" }}>🗑️</button>
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
        <Modal title="Nouvelle dépense" onClose={() => setShowDep(false)}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#666", display: "block", marginBottom: 2 }}>Catégorie</label>
          <select value={dep.categorie} onChange={e => setDep(d => ({ ...d, categorie: e.target.value }))} style={S.input}>
            <option value="">-- Choisir --</option>
            {cats.map(c => <option key={c}>{c}</option>)}
          </select>
          {[["Date", "date", "date"], ["Description", "description", "text"], ["Montant (FCFA)", "montant", "number"]].map(([l, k, t]) => (
            <Field key={k} label={l} k={k} type={t} val={dep[k]} set={v => setDep(p => ({ ...p, [k]: v }))} />
          ))}
          <button onClick={saveDep} style={S.btn("#C0392B")}>✅ Enregistrer</button>
        </Modal>
      )}

      {showVente && (
        <Modal title="Nouvelle vente" onClose={() => setShowVente(false)}>
          {[["Date", "date", "date"], ["Client / Acheteur", "client", "text"], ["Canal de vente", "canal", "text"], ["Nombre de poulets", "nbPoulets", "number"], ["Prix unitaire (FCFA)", "prixUnit", "number"]].map(([l, k, t]) => (
            <Field key={k} label={l} k={k} type={t} val={vente[k]} set={v => setVente(p => ({ ...p, [k]: v }))} />
          ))}
          {vente.nbPoulets && vente.prixUnit && (
            <div style={S.alert("#1E8449")}><span style={{ fontWeight: 800, color: "#1E8449" }}>Total : {fmt(Number(vente.nbPoulets) * Number(vente.prixUnit))}</span></div>
          )}
          <button onClick={saveVente} style={S.btn("#1E8449")}>✅ Enregistrer</button>
        </Modal>
      )}
    </div>
  );
}

// ── SANTÉ ─────────────────────────────────────────────────────────
function Sante({ vaccins, incidents }) {
  const [showInc, setShowInc] = useState(false);
  const [inc, setInc] = useState({ date: "", symptomes: "", nbAnimaux: "", traitement: "" });

  const toggleVacc = async (v) => {
    await setDoc(doc(db, "samapoulet", "bande2", "vaccinations", v.id), { ...v, fait: !v.fait, dateReelle: !v.fait ? new Date().toLocaleDateString("fr-FR") : "" });
  };

  const saveInc = async () => {
    await addDoc(collection(db, "samapoulet", "bande2", "incidents"), { ...inc, createdAt: new Date().toISOString() });
    setInc({ date: "", symptomes: "", nbAnimaux: "", traitement: "" });
    setShowInc(false);
  };

  return (
    <div style={S.section}>
      <p style={S.sectionTitle}>💉 Santé</p>
      <div style={S.card}>
        <p style={S.cardTitle}>Programme de Vaccination</p>
        {vaccins.map(v => (
          <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #F0F4F8" }}>
            <button onClick={() => toggleVacc(v)} style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${v.fait ? "#1E8449" : "#DDD"}`, background: v.fait ? "#1E8449" : "#fff", cursor: "pointer", color: "#fff", fontWeight: 800, flexShrink: 0, fontSize: 14 }}>{v.fait ? "✓" : ""}</button>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: v.fait ? "#888" : "#0F2940", textDecoration: v.fait ? "line-through" : "none" }}>{v.vaccin}</div>
              <div style={{ fontSize: 11, color: "#AAB7B8" }}>Sem. {v.semaine} • {v.fait ? `Fait le ${v.dateReelle}` : `Prévu : ${v.datePrevue}`}</div>
            </div>
            <span style={S.tag(v.fait ? "#1E8449" : "#E67E22")}>{v.fait ? "Fait ✓" : "À faire"}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ ...S.sectionTitle, marginBottom: 0 }}>🚨 Incidents sanitaires</p>
        <button onClick={() => setShowInc(true)} style={S.btnSm("#C0392B")}>+ Signaler</button>
      </div>

      {incidents.length === 0
        ? <div style={{ ...S.card, textAlign: "center", padding: 24, color: "#1E8449" }}><div style={{ fontSize: 40 }}>✅</div><p style={{ fontWeight: 700 }}>Aucun incident sanitaire</p></div>
        : incidents.map(i => (
          <div key={i.id} style={{ ...S.card, borderLeft: "4px solid #C0392B" }}>
            <div style={{ fontWeight: 700, color: "#C0392B" }}>{i.date} — {i.nbAnimaux} animal(aux)</div>
            <p style={{ fontSize: 13, marginTop: 4 }}>{i.symptomes}</p>
            {i.traitement && <p style={{ fontSize: 12, color: "#1E8449", margin: 0 }}>🩺 {i.traitement}</p>}
          </div>
        ))
      }

      {showInc && (
        <Modal title="Signaler un incident" onClose={() => setShowInc(false)}>
          {[["Date", "date", "date"], ["Nb animaux touchés", "nbAnimaux", "number"], ["Symptômes observés", "symptomes", "text"], ["Traitement prescrit", "traitement", "text"]].map(([l, k, t]) => (
            <Field key={k} label={l} k={k} type={t} val={inc[k]} set={v => setInc(p => ({ ...p, [k]: v }))} />
          ))}
          <button onClick={saveInc} style={S.btn("#C0392B")}>🚨 Enregistrer l'incident</button>
        </Modal>
      )}
    </div>
  );
}

// ── STRATÉGIE ─────────────────────────────────────────────────────
function Strategie({ phases, setPhases }) {
  const [tab, setTab] = useState("phases");
  const done = phases.filter(p => p.statut === "done").length;
  const active = phases.filter(p => p.statut === "active").length;
  const SC = { done: "#1E8449", active: "#E67E22", todo: "#AAB7B8" };
  const SL = { done: "✅ Terminé", active: "⚡ En cours", todo: "⏳ À faire" };

  const togglePhase = async (phase) => {
    const next = phase.statut === "done" ? "todo" : phase.statut === "active" ? "done" : "active";
    const updated = phases.map(p => p.id === phase.id ? { ...p, statut: next } : p);
    setPhases(updated);
    await setDoc(doc(db, "samapoulet", "bande2", "config", "phases"), { data: updated });
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
        <p style={{ fontSize: 10, opacity: 0.6, textAlign: "right", margin: "4px 0 0" }}>{Math.round(done / 14 * 100)}% complété</p>
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
              <div>
                <div style={{ fontSize: 11, color: "#888" }}>Phase {p.id}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F2940" }}>{p.titre}</div>
              </div>
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

      {tab === "canaux" && <>
        <div style={S.alert("#E67E22")}><span style={{ fontWeight: 700, color: "#E67E22" }}>📝 SAMEDI</span> — Signature contrat Eggette (Mbour)</div>
        {CANAUX.map(c => (
          <div key={c.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{c.canal}</span>
              <span style={S.tag(c.priorite === "haute" ? "#C0392B" : "#E67E22")}>{c.priorite === "haute" ? "🔴 Haute" : "🟡 Moyenne"}</span>
            </div>
            <p style={{ fontSize: 12, color: "#888", marginTop: 4, marginBottom: 0 }}>{c.statut}</p>
          </div>
        ))}
      </>}
    </div>
  );
}

// ── ASSOCIÉS ──────────────────────────────────────────────────────
function Associes({ depenses, ventes, onLogout }) {
  const totalDep = depenses.reduce((s, d) => s + Number(d.montant || 0), 0);
  const totalV = ventes.reduce((s, v) => s + Number(v.total || 0), 0);
  const benefice = Math.max(totalV - totalDep, 0);

  return (
    <div style={S.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ ...S.sectionTitle, marginBottom: 0 }}>🤝 Associés</p>
        <button onClick={onLogout} style={S.btnSm("#888")}>Déconnexion</button>
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
          <div style={{ background: "#F8F9FA", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#666" }}>Dividende estimé</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: benefice > 0 ? "#1E8449" : "#AAB7B8" }}>{fmt(benefice * a.parts / 100)}</span>
          </div>
        </div>
      ))}

      <div style={{ ...S.card, background: "#FFFBEB", border: "1.5px solid #F59E0B" }}>
        <p style={{ fontWeight: 700, color: "#92400E", fontSize: 13, marginBottom: 8 }}>📋 Règles de gouvernance</p>
        {["Fondateur garde toujours le contrôle (59%)", "Aucun retrait sans accord des 3 associés", "Distribution uniquement en fin de bande", "10% du bénéfice mis en réserve avant distribution", "Tout nouvel associé approuvé à l'unanimité"].map((r, i) => (
          <p key={i} style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>• {r}</p>
        ))}
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
  const [suivi, setSuivi] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [ventes, setVentes] = useState([]);
  const [vaccins, setVaccins] = useState(VACCINS_INIT);
  const [incidents, setIncidents] = useState([]);
  const [phases, setPhases] = useState(PHASES_INIT);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setUserInfo(USERS[u.email] || { nom: u.email.split("@")[0], parts: 0, couleur: "#888" });
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    const q1 = query(collection(db, "samapoulet", "bande2", "suiviQuotidien"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q1, s => setSuivi(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    const q2 = query(collection(db, "samapoulet", "bande2", "depenses"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q2, s => setDepenses(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    const q3 = query(collection(db, "samapoulet", "bande2", "ventes"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q3, s => setVentes(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    unsubs.push(onSnapshot(collection(db, "samapoulet", "bande2", "vaccinations"), async snap => {
      if (snap.empty) {
        for (const v of VACCINS_INIT) await setDoc(doc(db, "samapoulet", "bande2", "vaccinations", v.id), v);
      } else {
        setVaccins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }));

    const q5 = query(collection(db, "samapoulet", "bande2", "incidents"), orderBy("createdAt", "desc"));
    unsubs.push(onSnapshot(q5, s => setIncidents(s.docs.map(d => ({ id: d.id, ...d.data() })))));

    unsubs.push(onSnapshot(doc(db, "samapoulet", "bande2", "config", "phases"), snap => {
      if (snap.exists()) setPhases(snap.data().data);
    }));

    return () => unsubs.forEach(u => u());
  }, [user]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0F2940", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 60 }}>🐓</div>
      <p style={{ color: "#C9A84C", fontSize: 22, fontWeight: 800, marginTop: 16 }}>Sama Poulet</p>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Chargement...</p>
    </div>
  );

  if (!user) return <Login />;

  const tabs = [
    { id: "dashboard", icon: "📊", label: "Accueil" },
    { id: "suivi", icon: "🐔", label: "Suivi" },
    { id: "finances", icon: "💰", label: "Finances" },
    { id: "sante", icon: "💉", label: "Santé" },
    { id: "strategie", icon: "🚀", label: "Stratégie" },
    { id: "associes", icon: "🤝", label: "Associés" },
  ];

  return (
    <div style={S.app}>
      {tab === "dashboard" && <Dashboard suivi={suivi} depenses={depenses} ventes={ventes} vaccins={vaccins} userInfo={userInfo} />}
      {tab === "suivi" && <SuiviQuotidien suivi={suivi} />}
      {tab === "finances" && <Finances depenses={depenses} ventes={ventes} />}
      {tab === "sante" && <Sante vaccins={vaccins} incidents={incidents} />}
      {tab === "strategie" && <Strategie phases={phases} setPhases={setPhases} />}
      {tab === "associes" && <Associes depenses={depenses} ventes={ventes} onLogout={() => signOut(auth)} />}
      <div style={S.bottomNav}>
        {tabs.map(t => (
          <div key={t.id} style={S.navItem(tab === t.id)} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 22 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#1A5276" : "#888" }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
