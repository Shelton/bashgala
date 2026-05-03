import { fetchPost } from '../../src/lib/supabase.js'

const view = document.getElementById('post-view')

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function simpleMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
}

async function render() {
  const slug = window.location.pathname.replace('/posts/', '').replace(/\/$/, '')
  if (!slug) { view.innerHTML = '<a href="/" class="back">←</a><p>not found.</p>'; return }

  try {
    const post = await fetchPost(slug)
    view.innerHTML = `
      <a href="/" class="back">←</a>
      <h1 class="post-title">${post.title || ''}</h1>
      <time class="post-date" datetime="${post.created_at}">${formatDate(post.created_at)}</time>
      <hr class="post-divider">
      <div class="post-body"><p>${simpleMarkdown(post.body || '')}</p></div>
    `
  } catch {
    view.innerHTML = '<a href="/" class="back">←</a><p>not found.</p>'
  }
}

render()
