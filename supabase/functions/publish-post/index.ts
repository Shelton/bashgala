import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return new Response('Unauthorized', { status: 401 })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return new Response('Unauthorized', { status: 401 })

  const { id, published } = await req.json()

  if (!id) return new Response('Missing post id', { status: 400 })

  const { data: post, error } = await supabase
    .from('posts')
    .update({ published: published ?? true })
    .eq('id', id)
    .select()
    .single()

  if (error) return new Response(error.message, { status: 500 })

  return new Response(JSON.stringify(post), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
