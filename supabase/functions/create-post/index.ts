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

  const { type, title, body, synopsis, url, slug, tags } = await req.json()

  if (!type || !['image', 'link', 'thought', 'post'].includes(type)) {
    return new Response('Invalid type', { status: 400 })
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({ type, title, body, synopsis, url, slug, published: false })
    .select()
    .single()

  if (postError) return new Response(postError.message, { status: 500 })

  if (tags?.length) {
    const tagRecords = tags.map((tag_id: string) => ({ post_id: post.id, tag_id }))
    const { error: tagError } = await supabase.from('post_tags').insert(tagRecords)
    if (tagError) return new Response(tagError.message, { status: 500 })
  }

  return new Response(JSON.stringify(post), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
