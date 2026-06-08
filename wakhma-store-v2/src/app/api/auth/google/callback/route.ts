import { NextRequest, NextResponse } from 'next/server'

// This route handles the OAuth2 redirect callback from Google
// It receives the authorization code and sends it back to the parent window
// which then processes it via the /api/auth/google endpoint

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // If user denied access
  if (error) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Authentification</title></head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'google_oauth_callback',
              error: 'Connexion Google annulée'
            }, window.location.origin);
            window.close();
          </script>
          <p>Connexion annulée. Vous pouvez fermer cette fenêtre.</p>
        </body>
      </html>
    `
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  if (!code) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Erreur</title></head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'google_oauth_callback',
              error: 'Code d\'autorisation manquant'
            }, window.location.origin);
            window.close();
          </script>
          <p>Erreur. Vous pouvez fermer cette fenêtre.</p>
        </body>
      </html>
    `
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // Exchange code for tokens using Google's token endpoint
  try {
    const GOOGLE_CLIENT_ID = '645891430275-48re5e0v1nagsnei4al8pel4ff9dknq1.apps.googleusercontent.com'
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        // Note: For full OAuth2, you'd need client_secret here
        // Since we only have Client ID, we'll use the code flow
        // and extract the id_token from the response
        grant_type: 'authorization_code',
        redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.id_token) {
      // Send the id_token back to the parent window as a credential
      const html = `
        <!DOCTYPE html>
        <html>
          <head><title>Connexion en cours...</title></head>
          <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
            <p>Connexion en cours...</p>
            <script>
              window.opener.postMessage({
                type: 'google_oauth_callback',
                credential: '${tokenData.id_token}'
              }, window.location.origin);
              window.close();
            </script>
          </body>
        </html>
      `
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } else {
      throw new Error('No id_token in response')
    }
  } catch (err) {
    console.error('OAuth2 callback error:', err)
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Erreur</title></head>
        <body>
          <script>
            window.opener.postMessage({
              type: 'google_oauth_callback',
              error: 'Erreur lors de la connexion Google'
            }, window.location.origin);
            window.close();
          </script>
          <p>Erreur de connexion. Vous pouvez fermer cette fenêtre.</p>
        </body>
      </html>
    `
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}
