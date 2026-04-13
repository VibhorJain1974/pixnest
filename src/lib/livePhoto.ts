export function isLivePhoto(files: File[]): { photo: File; video: File } | null {
    const heic = files.find(f => f.name.match(/\.(heic|heif|jpg|jpeg)$/i))
    const mov = files.find(f => f.name.match(/\.(mov|mp4)$/i))
    if (!heic || !mov) return null
    const baseName = (f: File) => f.name.replace(/\.[^.]+$/, '').toLowerCase()
    if (baseName(heic) === baseName(mov)) return { photo: heic, video: mov }
    return null
}