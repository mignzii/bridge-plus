import { NextResponse } from 'next/server'

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN as string

interface MapboxFeature {
  id: string
  place_name: string
  text: string
  place_type: string[]
  center: [number, number]
  quartier?: string | null
  rue?: string | null,
  ville?:string | null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const reverse = searchParams.get('reverse')
  const proximity = searchParams.get('proximity')
  const country = 'sn'

  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'MAPBOX_TOKEN not configured' }, { status: 500 })
  }

  let url: string
  if (reverse) {
    const [lat, lon] = reverse.split(',')
    url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=${country}&language=fr`
  } else if (query) {
    const prox = proximity ? `&proximity=${proximity}` : ''
    url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=6&country=${country}&language=fr${prox}&types=address,poi,neighborhood,locality`
  } else {
    return NextResponse.json({ error: 'query or reverse required' }, { status: 400 })
  }

  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: 'Mapbox error', details: text }, { status: res.status })
  }

  const data = await res.json()

  const features: MapboxFeature[] = (data.features || []).map((f: any) => {
    const context = f.context || []
    
    const quartier = context.find((c: any) => 
      c.id.includes('neighborhood') || c.id.includes('locality')
    )?.text
    
    let rue = null
    if (f.place_type.includes('address')) {
      rue = `${f.address || ''} ${f.text}`.trim()
    } else if (f.properties?.address) {
      rue = f.properties.address
    }
    
    const ville = context.find((c: any) => c.id.includes('place'))?.text

    return {
      id: f.id,
      place_name: f.place_name,
      text: f.text,
      place_type: f.place_type,
      center: f.center,
      quartier: quartier || null,
      rue: rue || f.text, 
      ville: ville || null
    }
  })

  return NextResponse.json({ features })
}