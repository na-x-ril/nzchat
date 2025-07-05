import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return NextResponse.json({ error: "No url provided" }, { status: 400 })

  const res = await fetch(url)
  const blob = await res.blob()
  const headers = new Headers(res.headers)
  headers.set("Access-Control-Allow-Origin", "*")

  return new NextResponse(blob, {
    status: res.status,
    headers,
  })
}