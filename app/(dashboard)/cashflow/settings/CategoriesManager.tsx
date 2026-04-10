'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import * as T from '../editorial-theme';
import {
  Category, SubGroup, SUB_GROUP_ORDER, SUB_GROUP_DISPLAY,
  groupCategories, subGroupOf,
} from '../category-groups';

// Reverse mapping: when adding a new category under a sub-group,
// what default (kind, type) should we use? These become editable later.
const DEFAULT_KIND_FOR_SUBGROUP: Record<SubGroup, { kind: string; type: 'receipt' | 'expense' }> = {
  income: { kind: 'contract', type: 'receipt' },
  other_inflows: { kind: 'other_receipt', type: 'receipt' },
  expenses: { kind: 'operating', type: 'expense' },
  other_payments: { kind: 'misc', type: 'expense' },
};

export default function CategoriesManager({ initial }: { initial: Category[] }) {
  const [cats, setCats] = useState<Category[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [addingIn, setAddingIn] = useState<SubGroup | null>(null);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const grouped = groupCategories(cats);

  const addCategory = async (sg: SubGroup) => {
    if (!newName.trim()) return;
    setBusy(true);
    const defaults = DEFAULT_KIND_FOR_SUBGROUP[sg];
    const res = await fetch('/api/cashflow/categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), kind: defaults.kind, type: defaults.type }),
    });
    setBusy(false);
    if (!res.ok) { toast.error('Add failed'); return; }
    const { category } = await res.json();
    setCats([...cats, category]);
    setNewName(''); setAddingIn(null);
    toast.success('Category added');
  };

  const renameCategory = async (id: string) => {
    if (!editName.trim()) { setEditingId(null); return; }
    setBusy(true);
    const res = await fetch(`/api/cashflow/categories/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setBusy(false);
    if (!res.ok) { toast.error('Rename failed'); return; }
    const { category } = await res.json();
    setCats(cats.map(c => c.id === id ? category : c));
    setEditingId(null);
    toast.success('Renamed');
  };

  const removeCategory = async (id: string, name: string) => {
    if (!confirm(`Retire "${name}"?`)) return;
    setBusy(true);
    const res = await fetch(`/api/cashflow/categories/${id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error || 'Delete failed');
      return;
    }
    setCats(cats.filter(c => c.id !== id));
    toast.success('Retired');
  };

  return (
    <div style={T.card}>
      <div style={T.sectionEyebrow}>Chart of accounts</div>
      <div style={T.sectionTitle}>Categories, grouped by nature</div>
      <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 13, color: T.muted, marginBottom: 20 }}>
        Inflows are money coming in. Outflows are money going out. Add, rename, or retire categories freely — a category in use by existing transactions cannot be retired until you reassign them.
      </div>

      {SUB_GROUP_ORDER.map(sg => {
        const parent = (sg === 'income' || sg === 'other_inflows') ? 'INFLOWS' : 'OUTFLOWS';
        const showParentHeader = sg === 'income' || sg === 'expenses';
        return (
          <div key={sg}>
            {showParentHeader && (
              <div style={{
                fontFamily: T.serif, fontSize: 11, letterSpacing: '0.2em',
                color: T.ink, textTransform: 'uppercase',
                marginTop: sg === 'expenses' ? 28 : 8, marginBottom: 10,
                paddingBottom: 6, borderBottom: `1px solid ${T.ink}`,
              }}>
                {parent}
              </div>
            )}
            <div style={{
              fontFamily: T.serif, fontSize: 13, letterSpacing: '0.08em',
              color: T.muted, textTransform: 'uppercase', marginTop: 14, marginBottom: 8,
            }}>
              {SUB_GROUP_DISPLAY[sg]}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {grouped[sg].map(c => (
                <div key={c.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  border: `0.5px solid ${T.ruleStrong}`, borderRadius: 3,
                  padding: '6px 10px', background: '#fff',
                  fontFamily: T.serif, fontSize: 14,
                }}>
                  {editingId === c.id ? (
                    <>
                      <input
                        autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') renameCategory(c.id); if (e.key === 'Escape') setEditingId(null); }}
                        style={{ ...T.input, padding: '3px 6px', fontSize: 14, width: 200 }}
                      />
                      <button onClick={() => renameCategory(c.id)} disabled={busy} style={{ ...T.ghostBtn, padding: '3px 8px' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ ...T.ghostBtn, padding: '3px 8px' }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span>{c.name}</span>
                      <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} style={{ ...T.ghostBtn, padding: '2px 6px', fontSize: 11 }}>Rename</button>
                      <button onClick={() => removeCategory(c.id, c.name)} style={{ ...T.ghostBtn, padding: '2px 6px', fontSize: 11 }}>Retire</button>
                    </>
                  )}
                </div>
              ))}
              {addingIn === sg ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <input
                    autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addCategory(sg); if (e.key === 'Escape') { setAddingIn(null); setNewName(''); } }}
                    placeholder="New category name" style={{ ...T.input, padding: '6px 10px', width: 220, fontSize: 14 }}
                  />
                  <button onClick={() => addCategory(sg)} disabled={busy || !newName.trim()} style={{ ...T.ghostBtn, padding: '5px 10px' }}>Add</button>
                  <button onClick={() => { setAddingIn(null); setNewName(''); }} style={{ ...T.ghostBtn, padding: '5px 10px' }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setAddingIn(sg)} style={{
                  ...T.ghostBtn, padding: '6px 10px', fontStyle: 'italic',
                  borderStyle: 'dashed',
                }}>+ Add to {SUB_GROUP_DISPLAY[sg]}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
