import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = window.ENV.SUPABASE_URL
const SUPABASE_ANON_KEY = window.ENV.SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const PAGE_SIZE = 10

export async function fetchFeed(page = 0) {
  const { data, count, error } = await supabase
    .from('posts')
    .select('*, images(*), post_tags(tag_id, tags(name, slug))', { count: 'exact' })
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) throw error
  return { posts: data, total: count, page, pageSize: PAGE_SIZE }
}

export async function fetchFeedByTag(tagSlug, page = 0) {
  const { data, count, error } = await supabase
    .from('posts')
    .select('*, images(*), post_tags!inner(tag_id, tags!inner(name, slug))', { count: 'exact' })
    .eq('published', true)
    .eq('post_tags.tags.slug', tagSlug)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) throw error
  return { posts: data, total: count, page, pageSize: PAGE_SIZE, tagSlug }
}

export async function fetchPost(slug) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, images(*), post_tags(tag_id, tags(name, slug))')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) throw error
  return data
}

export async function fetchAllTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export function getSession() {
  return supabase.auth.getSession()
}

export async function signIn(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + '/bash' },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function callFunction(name, body, token) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function uploadImage(postId, file, caption, altText, sortOrder, folder = 'images', token) {
  const form = new FormData()
  form.append('file', file)
  form.append('post_id', postId)
  if (caption) form.append('caption', caption)
  if (altText) form.append('alt_text', altText)
  form.append('sort_order', String(sortOrder))
  form.append('folder', folder)

  const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-image`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
