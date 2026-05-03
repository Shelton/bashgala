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

  const formData = await req.formData()
  const file = formData.get('file') as File
  const post_id = formData.get('post_id') as string
  const caption = formData.get('caption') as string | null
  const alt_text = formData.get('alt_text') as string | null
  const sort_order = parseInt(formData.get('sort_order') as string || '0')
  const folder = formData.get('folder') as string || 'images'

  if (!file || !post_id) return new Response('Missing file or post_id', { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const { data: upload, error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, file, { contentType: file.type })

  if (uploadError) return new Response(uploadError.message, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(upload.path)

  const { data: image, error: imageError } = await supabase
    .from('images')
    .insert({ post_id, url: publicUrl, caption, alt_text, sort_order })
    .select()
    .single()

  if (imageError) return new Response(imageError.message, { status: 500 })

  return new Response(JSON.stringify(image), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
