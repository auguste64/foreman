'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_CGV_CLAUSES, DEFAULT_CONTRAT_MOE_CLAUSES } from './default-clauses'
import type { Clause } from './default-clauses'

export type { Clause }

export function useDocumentTemplate(type: 'cgv' | 'contrat_moe') {
  const [clauses, setClauses] = useState<Clause[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    userIdRef.current = user.id

    const { data } = await supabase
      .from('document_templates')
      .select('clauses')
      .eq('user_id', user.id)
      .eq('type', type)
      .single()

    if (data?.clauses) {
      setClauses(data.clauses as Clause[])
    } else {
      const defaults = type === 'cgv' ? DEFAULT_CGV_CLAUSES : DEFAULT_CONTRAT_MOE_CLAUSES
      await supabase
        .from('document_templates')
        .upsert(
          { user_id: user.id, type, clauses: defaults, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,type' }
        )
      setClauses(defaults)
    }
    setLoading(false)
  }

  const saveToDb = useCallback(async (clausesToSave: Clause[]) => {
    if (!userIdRef.current) return
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('document_templates')
      .upsert(
        { user_id: userIdRef.current, type, clauses: clausesToSave, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,type' }
      )
    setSaving(false)
    setSavedAt(new Date())
  }, [type])

  function updateClause(id: string, changes: Partial<Omit<Clause, 'id'>>) {
    setClauses(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c))
  }

  function addClause() {
    const maxOrdre = clauses.length > 0 ? Math.max(...clauses.map(c => c.ordre)) : 0
    const newClause: Clause = {
      id: crypto.randomUUID(),
      titre: 'Nouvelle clause',
      contenu: '',
      ordre: maxOrdre + 1,
      modifiable: true,
    }
    const newClauses = [...clauses, newClause]
    setClauses(newClauses)
    saveToDb(newClauses)
  }

  function deleteClause(id: string) {
    const newClauses = clauses
      .filter(c => c.id !== id)
      .sort((a, b) => a.ordre - b.ordre)
      .map((c, i) => ({ ...c, ordre: i + 1 }))
    setClauses(newClauses)
    saveToDb(newClauses)
  }

  function reorderClauses(id: string, direction: 'up' | 'down') {
    const sorted = [...clauses].sort((a, b) => a.ordre - b.ordre)
    const idx = sorted.findIndex(c => c.id === id)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= sorted.length) return
    const newArr = [...sorted]
    ;[newArr[idx], newArr[newIdx]] = [newArr[newIdx], newArr[idx]]
    const newClauses = newArr.map((c, i) => ({ ...c, ordre: i + 1 }))
    setClauses(newClauses)
    saveToDb(newClauses)
  }

  async function reset() {
    const defaults = type === 'cgv' ? DEFAULT_CGV_CLAUSES : DEFAULT_CONTRAT_MOE_CLAUSES
    setClauses(defaults)
    await saveToDb(defaults)
  }

  return {
    clauses,
    loading,
    saving,
    savedAt,
    updateClause,
    addClause,
    deleteClause,
    reorderClauses,
    reset,
    save: saveToDb,
  }
}
