// Editorial theme tokens — shared across cashflow module
export const cream = '#faf7f2';
export const rule = '#e8e2d5';
export const ruleStrong = '#d9d1bf';
export const ink = '#2a241a';
export const muted = '#8a7d5f';
export const good = '#3b6d11';
export const bad = '#A32D2D';
export const serif = 'Georgia, "Iowan Old Style", "Palatino Linotype", serif';

export const pageShell: React.CSSProperties = {
  background: cream,
  minHeight: '100vh',
  padding: '40px 32px',
  color: ink,
  fontFamily: 'system-ui, sans-serif',
};
export const container: React.CSSProperties = { maxWidth: 1100, margin: '0 auto' };
export const eyebrow: React.CSSProperties = {
  fontFamily: serif, fontSize: 11, letterSpacing: '0.18em', color: muted, textTransform: 'uppercase',
};
export const headline: React.CSSProperties = {
  fontFamily: serif, fontSize: 36, lineHeight: 1.1, marginTop: 6, letterSpacing: '-0.01em',
};
export const subhead: React.CSSProperties = {
  fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: muted, marginTop: 6,
};
export const masthead: React.CSSProperties = {
  borderBottom: `0.5px solid ${ruleStrong}`, paddingBottom: 16, marginBottom: 28,
};
export const card: React.CSSProperties = {
  background: '#fff', border: `0.5px solid ${rule}`, borderRadius: 4, padding: '22px 26px', marginBottom: 28,
};
export const sectionEyebrow: React.CSSProperties = {
  fontFamily: serif, fontSize: 11, letterSpacing: '0.14em', color: muted, textTransform: 'uppercase', marginBottom: 4,
};
export const sectionTitle: React.CSSProperties = { fontFamily: serif, fontSize: 20, marginBottom: 16 };
export const input: React.CSSProperties = {
  padding: '9px 12px', border: `0.5px solid ${ruleStrong}`, borderRadius: 3,
  fontFamily: serif, fontSize: 15, background: '#fff', color: ink, width: '100%', boxSizing: 'border-box',
};
export const select: React.CSSProperties = { ...input, cursor: 'pointer' };
export const primaryBtn: React.CSSProperties = {
  padding: '10px 22px', border: `0.5px solid ${ink}`, background: ink, color: cream,
  fontFamily: serif, fontSize: 14, letterSpacing: '0.05em', cursor: 'pointer', borderRadius: 3,
};
export const ghostBtn: React.CSSProperties = {
  padding: '6px 10px', border: `0.5px solid ${ruleStrong}`, background: 'transparent', color: muted,
  fontFamily: serif, fontSize: 12, cursor: 'pointer', borderRadius: 3,
};
export const label: React.CSSProperties = {
  fontFamily: serif, fontSize: 11, letterSpacing: '0.1em', color: muted, textTransform: 'uppercase',
  display: 'block', marginBottom: 6,
};
export const tableHead: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11, letterSpacing: '0.1em',
  textTransform: 'uppercase', fontWeight: 500, color: muted, fontFamily: serif,
};
