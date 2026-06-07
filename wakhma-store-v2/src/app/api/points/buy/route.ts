import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Route désactivée' }, { status: 410 })
}
