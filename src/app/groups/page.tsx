'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GroupsPage() {
    const [groups, setGroups] = useState<any[]>([])
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [groupName, setGroupName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setUser(user)
            const { data } = await supabase
                .from('group_members')
                .select('group_id, groups(*)')
                .eq('user_id', user.id)
            setGroups(data?.map((d: any) => d.groups) ?? [])
        }
        load()
    }, [])

    const createGroup = async () => {
        if (!groupName.trim() || !user) return
        const { data: group } = await supabase
            .from('groups')
            .insert({ name: groupName, created_by: user.id })
            .select().single()
        if (group) {
            await supabase.from('group_members').insert({
                group_id: group.id, user_id: user.id, role: 'admin'
            })
            setGroups(g => [...g, group])
            setGroupName(''); setShowCreate(false)
        }
    }

    const joinGroup = async () => {
        if (!inviteCode.trim() || !user) return
        const { data: group } = await supabase
            .from('groups')
            .select()
            .eq('invite_code', inviteCode.trim())
            .single()
        if (!group) { alert('Invalid code'); return }
        await supabase.from('group_members').upsert({
            group_id: group.id, user_id: user.id, role: 'member'
        })
        setGroups(g => [...g, group])
        setInviteCode(''); setShowJoin(false)
    }

    const emojis = ['🏕️', '🌊', '🎓', '🎉', '🏖️', '🎸', '🍕', '✈️']

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '0 0 80px', fontFamily: 'DM Sans, sans-serif' }}>
            <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0 24px' }}>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: '#f0eeff' }}>Your groups</h1>
                    <button onClick={() => router.push('/login')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#7a7890', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
                        Log out
                    </button>
                </div>

                {groups.map((g, i) => (
                    <div key={g.id} onClick={() => router.push(`/groups/${g.id}`)}
                        style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '16px 20px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <span style={{ fontSize: 28 }}>{emojis[i % emojis.length]}</span>
                        <div>
                            <div style={{ color: '#f0eeff', fontWeight: 600, fontFamily: 'Syne, sans-serif' }}>{g.name}</div>
                            <div style={{ color: '#7a7890', fontSize: 12, marginTop: 2 }}>Invite code: <span style={{ color: '#c084fc' }}>{g.invite_code}</span></div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: '#7a7890', fontSize: 20 }}>›</span>
                    </div>
                ))}

                {groups.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#7a7890', padding: '60px 0', fontSize: 14 }}>
                        No groups yet — create or join one below!
                    </div>
                )}

                {showCreate && (
                    <div style={modalStyle}>
                        <h3 style={{ color: '#f0eeff', fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Create group</h3>
                        <input placeholder="Group name e.g. Hackathon Crew" value={groupName}
                            onChange={e => setGroupName(e.target.value)} style={inputStyle} />
                        <button onClick={createGroup} style={btnStyle}>Create →</button>
                        <button onClick={() => setShowCreate(false)} style={cancelStyle}>Cancel</button>
                    </div>
                )}

                {showJoin && (
                    <div style={modalStyle}>
                        <h3 style={{ color: '#f0eeff', fontFamily: 'Syne, sans-serif', marginBottom: 16 }}>Join group</h3>
                        <input placeholder="Enter invite code" value={inviteCode}
                            onChange={e => setInviteCode(e.target.value)} style={inputStyle} />
                        <button onClick={joinGroup} style={btnStyle}>Join →</button>
                        <button onClick={() => setShowJoin(false)} style={cancelStyle}>Cancel</button>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    <button onClick={() => { setShowCreate(true); setShowJoin(false) }} style={{ ...btnStyle, flex: 1 }}>+ Create group</button>
                    <button onClick={() => { setShowJoin(true); setShowCreate(false) }} style={{ ...btnStyle, flex: 1, background: '#1c1c27', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }}>Join with code</button>
                </div>
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
const cancelStyle: React.CSSProperties = {
    width: '100%', padding: '10px', background: 'none', border: 'none',
    color: '#7a7890', fontSize: 13, cursor: 'pointer', marginTop: 4,
}
const modalStyle: React.CSSProperties = {
    background: '#13131a', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 20, marginBottom: 16,
}