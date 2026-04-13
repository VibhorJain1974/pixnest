'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function GroupPage() {
    const [group, setGroup] = useState<any>(null)
    const [albums, setAlbums] = useState<any[]>([])
    const [showCreate, setShowCreate] = useState(false)
    const [albumName, setAlbumName] = useState('')
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()
    const { id } = useParams()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setUser(user)
            const { data: g } = await supabase.from('groups').select().eq('id', id).single()
            setGroup(g)
            const { data: a } = await supabase.from('albums').select().eq('group_id', id).order('created_at', { ascending: false })
            setAlbums(a ?? [])
        }
        load()
    }, [id])

    const createAlbum = async () => {
        if (!albumName.trim() || !user) return
        const { data } = await supabase.from('albums')
            .insert({ name: albumName, group_id: id, created_by: user.id })
            .select().single()
        if (data) { setAlbums(a => [data, ...a]); setAlbumName(''); setShowCreate(false) }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '0 0 80px', fontFamily: 'DM Sans, sans-serif' }}>
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 24px' }}>
                    <button onClick={() => router.push('/groups')} style={{ background: 'none', border: 'none', color: '#7a7890', fontSize: 20, cursor: 'pointer' }}>←</button>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#f0eeff' }}>{group?.name}</h1>
                    <span style={{ marginLeft: 'auto', background: 'rgba(192,132,252,0.15)', color: '#c084fc', borderRadius: 999, padding: '3px 10px', fontSize: 12 }}>
                        Code: {group?.invite_code}
                    </span>
                </div>

                {albums.map(a => (
                    <div key={a.id} onClick={() => router.push(`/albums/${a.id}`)}
                        style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#c084fc33,#818cf833)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎞️</div>
                        <div>
                            <div style={{ color: '#f0eeff', fontWeight: 600 }}>{a.name}</div>
                            <div style={{ color: '#7a7890', fontSize: 12, marginTop: 2 }}>{new Date(a.created_at).toLocaleDateString()}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#7a7890', fontSize: 20 }}>›</span>
                    </div>
                ))}

                {albums.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#7a7890', padding: '60px 0', fontSize: 14 }}>
                        No albums yet — create one!
                    </div>
                )}

                {showCreate && (
                    <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
                        <h3 style={{ color: '#f0eeff', fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>New album</h3>
                        <input placeholder="e.g. Hackathon Day 1" value={albumName}
                            onChange={e => setAlbumName(e.target.value)} style={inputStyle} />
                        <button onClick={createAlbum} style={btnStyle}>Create →</button>
                    </div>
                )}

                <button onClick={() => setShowCreate(v => !v)} style={btnStyle}>
                    {showCreate ? 'Cancel' : '+ New album'}
                </button>
            </div>
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: '#1c1c27',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    color: '#f0eeff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box', outline: 'none',
}
const btnStyle: React.CSSProperties = {
    width: '100%', padding: '12px', background: '#c084fc',
    border: 'none', borderRadius: 10, color: '#0a0a0f', fontSize: 14, fontWeight: 700, cursor: 'pointer',
}