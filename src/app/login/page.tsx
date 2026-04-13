'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [mode, setMode] = useState<'login' | 'signup'>('login')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')
    const supabase = createClient()
    const router = useRouter()

    const handle = async () => {
        setLoading(true)
        setMsg('')
        if (mode === 'signup') {
            const { data, error } = await supabase.auth.signUp({ email, password })
            if (error) { setMsg(error.message); setLoading(false); return }
            if (data.user) {
                await supabase.from('profiles').insert({
                    id: data.user.id,
                    full_name: name,
                    username: email.split('@')[0],
                })
            }
            setMsg('Check your email to confirm!')
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) { setMsg(error.message); setLoading(false); return }
            router.push('/groups')
        }
        setLoading(false)
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#0a0a0f', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif'
        }}>
            <div style={{
                background: '#13131a', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 400
            }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#f0eeff', marginBottom: 6 }}>
                    ✦ PixNest
                </h1>
                <p style={{ color: '#7a7890', fontSize: 14, marginBottom: 28 }}>
                    {mode === 'login' ? 'Welcome back!' : 'Create your account'}
                </p>

                {mode === 'signup' && (
                    <input
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={inputStyle}
                    />
                )}
                <input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                />
                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={inputStyle}
                />

                {msg && <p style={{ color: '#c084fc', fontSize: 13, marginBottom: 12 }}>{msg}</p>}

                <button onClick={handle} disabled={loading} style={btnStyle}>
                    {loading ? 'Loading...' : mode === 'login' ? 'Log in →' : 'Sign up →'}
                </button>

                <p style={{ color: '#7a7890', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
                    {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
                    <span
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        style={{ color: '#c084fc', cursor: 'pointer' }}
                    >
                        {mode === 'login' ? 'Sign up' : 'Log in'}
                    </span>
                </p>
            </div>
        </div>
    )
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', background: '#1c1c27',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    color: '#f0eeff', fontSize: 14, marginBottom: 12, boxSizing: 'border-box',
    outline: 'none',
}
const btnStyle: React.CSSProperties = {
    width: '100%', padding: '12px', background: '#c084fc',
    border: 'none', borderRadius: 10, color: '#0a0a0f',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4,
}