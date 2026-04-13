export async function computePHash(file: File): Promise<string> {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = 8; canvas.height = 8
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, 8, 8)
    const data = ctx.getImageData(0, 0, 8, 8).data
    const grays: number[] = []
    for (let i = 0; i < data.length; i += 4) {
        grays.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    }
    const avg = grays.reduce((a, b) => a + b) / grays.length
    return grays.map(g => g > avg ? '1' : '0').join('')
}

export function hammingDistance(a: string, b: string) {
    return a.split('').filter((c, i) => c !== b[i]).length
}