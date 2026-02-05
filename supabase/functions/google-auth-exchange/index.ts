import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleTokenResponse {
    access_token: string
    expires_in: number
    token_type: string
    scope: string
    id_token: string
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { serverAuthCode } = await req.json()

        if (!serverAuthCode) {
            throw new Error('serverAuthCode is required')
        }

        console.log('Received serverAuthCode for exchange')

        // Get Google OAuth credentials from environment
        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
        const iosClientId = Deno.env.get('GOOGLE_IOS_CLIENT_ID')

        if (!clientId || !clientSecret || !iosClientId) {
            throw new Error('Missing Google OAuth configuration')
        }

        // Exchange authorization code for tokens
        console.log('Exchanging code with Google...')
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: serverAuthCode,
                client_id: clientId, // Use web client ID - serverAuthCode is generated for web client
                client_secret: clientSecret,
                redirect_uri: '', // Empty for mobile apps
                grant_type: 'authorization_code',
            }),
        })

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text()
            console.error('Google token exchange failed:', errorText)
            throw new Error(`Failed to exchange code: ${errorText}`)
        }

        const tokens: GoogleTokenResponse = await tokenResponse.json()
        console.log('Successfully received tokens from Google')

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Sign in or create user with Google ID token
        console.log('Signing in with Supabase...')
        const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: tokens.id_token,
        })

        if (error) {
            console.error('Supabase auth error:', error)
            throw error
        }

        console.log('Successfully created Supabase session')

        // Return the session to the client
        return new Response(
            JSON.stringify({
                session: data.session,
                user: data.user,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
