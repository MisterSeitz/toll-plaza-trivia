/** Generates a vintage South African travel-postcard image via Fal.ai (proxied in dev so the key stays server-side). */
export async function generatePostcard(title: string, flavor: string): Promise<string | null> {
  try {
    const res = await fetch('/api/fal/fal-ai/flux/schnell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Vintage illustrated South African road trip postcard, warm Karoo colours, bold retro poster style: ${title}. ${flavor}`,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
        num_images: 1,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.images?.[0]?.url ?? null
  } catch {
    return null
  }
}
