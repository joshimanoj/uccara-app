import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // Create Supabase client with user's JWT
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // Client with user's JWT to get user info
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        // Get the current user
        const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
        if (userError || !user) {
            throw new Error('Unable to get user from token')
        }

        console.log(`Deleting account for user: ${user.id}`)

        // Admin client for deletion operations
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Delete user's bookmarks
        const { error: bookmarksError } = await supabaseAdmin
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)

        if (bookmarksError) {
            console.error('Error deleting bookmarks:', bookmarksError)
            // Continue with user deletion even if bookmarks fail
        } else {
            console.log('Successfully deleted user bookmarks')
        }

        // 2. Delete the auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

        if (deleteError) {
            console.error('Error deleting user:', deleteError)
            throw new Error('Failed to delete user account')
        }

        console.log('Successfully deleted user account')

        return new Response(
            JSON.stringify({ success: true, message: 'Account deleted successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
