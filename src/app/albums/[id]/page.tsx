'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'

export default function AlbumPage() {
    const [album, setAlbum] = useState<any>(null)
    const [media, setMedia] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [selected, setSelected] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()
    const { id } = useParams()

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/login'); return }
            setUser(user)
            const { data: a } = await supabase.from('albums').select().eq('id', id).single()
            setAlbum(a)
            loadMedia()
        }
        load()
    }, [id])

    const loadMedia = async () => {
        const { data } = await supabase
            .from('media')
            .select('*, profiles(full_name)')
            .eq('album_id', id)
            .order('created_at', { ascending: false })
        setMedia(data ?? [])
    }

    const onDrop = useCallback(async (files: File[]) => {
        if (!user) return
        setUploading(true)
        let done = 0
        for (const file of files) {
            const isVideo = /\.(mp4|mov|avi|webm)$/i.test(file.name)
            const isLive = /\.(heic|heif)$/i.test(file.name)
            const path = `${id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
            await supabase.storage.from('media').upload(path, file, { upsert: true })
            const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
            await supabase.from('media').insert({
                album_id: id,
                uploaded_by: user.id,
                file_url: urlData.publicUrl,
                media_type: isVideo ? 'video' : isLive ? 'live_photo' : 'photo',
                original_filename: file.name,
                file_size: file.size,
            })
            done++
            setProgress(Math.round((done / files.length) * 100))
        }
        setUploading(false)
        setProgress(0)
        loadMedia()
    }, [id, user, supabase])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [], 'video/*': [] }
    })

    const reactions = ['❤️', '🔥', '😂', '😍', '✨', '👏']

    const addReaction = async (mediaId: string, emoji: string) => {
        if (!user) return
        await supabase.from('media_reactions').upsert({
            media_id: mediaId, user_id: user.id, emoji
        }, { onConflict: 'media_id,user_id,emoji' })
        loadMedia()
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', padding: '0 0 80px', fontFamily: 'DM Sans, sans-serif' }}>
            <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 16px' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0 20px' }}>
                    <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#7a7890', fontSize: 20, cursor: 'pointer' }}>←</button>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#f0eeff' }}>{album?.name}</h1>
                    <span style={{ marginLeft: 'auto', color: '#7a7890', fontSize: 13 }}>{media.length} items</span>
                </div>

                {/* Upload zone */}
                <div {...getRootProps()} style={{
                    border: `2px dashed ${isDragActive ? '#c084fc' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: 16, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
                    background: isDragActive ? 'rgba(192,132,252,0.07)' : 'transparent',
                    marginBottom: 20, transition: 'all 0.2s'
                }}>
                    <input {...getInputProps()} />
                    {uploading ? (
                        <div>
                            <p style={{ color: '#c084fc', fontSize: 14, marginBottom: 10 }}>Uploading... {progress}%</p>
                            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 999, height: 6 }}>
                                <div style={{ background: '#c084fc', height: 6, borderRadius: 999, width: `${progress}%`, transition: 'width 0.3s' }} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
                            <p style={{ color: '#f0eeff', fontSize: 14, fontWeight: 500 }}>Drop photos & videos here</p>
                            <p style={{ color: '#7a7890', fontSize: 12, marginTop: 4 }}>Full quality · HEIC · Live Photos · Videos</p>
                        </>
                    )}
                </div>

                {/* Media grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                    {media.map((m, i) => (
                        <div key={m.id} onClick={() => setSelected(m)}
                            style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: '#1c1c27', position: 'relative', ...(i === 0 ? { gridColumn: 'span 2', gridRow: 'span 2', borderRadius: 14 } : {}) }}>
                            {m.media_type === 'video' ? (
                                <video src={m.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                            ) : (
                                <img src={m.file_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)', padding: '20px 8px 6px' }}>
                                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>{m.profiles?.full_name}</div>
                            </div>
                            {m.media_type === 'live_photo' && (
                                <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 999, padding: '2px 7px', fontSize: 9, color: '#fff', fontWeight: 700 }}>LIVE</div>
                            )}
                            {m.media_type === 'video' && (
                                <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', borderRadius: 999, padding: '2px 7px', fontSize: 9, color: '#fff' }}>▶</div>
                            )}
                        </div>
                    ))}
                </div>

                {media.length === 0 && !uploading && (
                    <div style={{ textAlign: 'center', color: '#7a7890', padding: '60px 0', fontSize: 14 }}>
                        Nothing here yet — upload the first pic!
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {selected && (
                <div onClick={() => setSelected(null)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16
                }}>
                    <div onClick={e => e.stopPropagation()} style={{ maxWidth: 500, width: '100%' }}>
                        {selected.media_type === 'video' ? (
                            <video src={selected.file_url} controls style={{ width: '100%', borderRadius: 14, maxHeight: '60vh', objectFit: 'contain' }} autoPlay />
                        ) : (
                            <img src={selected.file_url} alt="" style={{ width: '100%', borderRadius: 14, maxHeight: '65vh', objectFit: 'contain' }} />
                        )}
                        <div style={{ marginTop: 12 }}>
                            <p style={{ color: '#f0eeff', fontSize: 13, marginBottom: 8 }}>
                                Uploaded by <span style={{ color: '#c084fc' }}>{selected.profiles?.full_name}</span>
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {reactions.map(r => (
                                    <button key={r} onClick={() => addReaction(selected.id, r)}
                                        style={{ background: '#1c1c27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: '6px 12px', fontSize: 16, cursor: 'pointer' }}>
                                        {r}
                                    </button>
                                ))}
                            </div>
                            <a href={selected.file_url} download={selected.original_filename} target="_blank"
                                style={{ display: 'block', marginTop: 12, padding: '10px', background: '#c084fc', borderRadius: 10, color: '#0a0a0f', textAlign: 'center', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                                ⬇ Save to device
                            </a>
                        </div>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>✕</button>
                </div>
            )}
        </div>
    )
}