function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function renderThought(post) {
  const el = document.createElement('article')
  el.className = 'post post--thought'
  el.innerHTML = `
    <p class="post-body">${escapeHtml(post.body || '')}</p>
    <time class="post-date" datetime="${post.created_at}">${formatDate(post.created_at)}</time>
  `
  return el
}

function renderPostCard(post) {
  const el = document.createElement('article')
  el.className = 'post post--post'
  el.innerHTML = `
    <a href="/posts/${encodeURIComponent(post.slug)}" class="post-link">
      <h2 class="post-title">${escapeHtml(post.title || '')}</h2>
      ${post.synopsis ? `<p class="post-synopsis">${escapeHtml(post.synopsis)}</p>` : ''}
      <time class="post-date" datetime="${post.created_at}">${formatDate(post.created_at)} →</time>
    </a>
  `
  return el
}

function renderImage(post) {
  const images = post.images || []
  if (!images.length) return document.createElement('article')

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order)
  const cover = sorted[0]
  const hasGallery = sorted.length > 1

  const el = document.createElement('article')
  el.className = 'post post--image'

  const img = document.createElement('img')
  img.src = cover.url
  img.alt = cover.alt_text || cover.caption || ''
  img.className = 'post-cover'
  img.loading = 'lazy'

  if (hasGallery) {
    img.dataset.gallery = JSON.stringify(sorted)
    img.dataset.galleryIndex = '0'
    img.classList.add('gallery-trigger')
    img.setAttribute('role', 'button')
    img.setAttribute('tabindex', '0')
  }

  el.appendChild(img)

  if (cover.caption) {
    const cap = document.createElement('p')
    cap.className = 'post-caption'
    cap.textContent = cover.caption
    el.appendChild(cap)
  }

  const time = document.createElement('time')
  time.className = 'post-date'
  time.setAttribute('datetime', post.created_at)
  time.textContent = formatDate(post.created_at)
  el.appendChild(time)

  return el
}

function renderLink(post) {
  const el = document.createElement('article')
  el.className = 'post post--link'
  el.innerHTML = `
    <a href="${encodeURI(post.url || '')}" class="post-link-external" target="_blank" rel="noopener noreferrer">
      <span class="post-link-arrow">↗</span>
      <span class="post-title">${escapeHtml(post.title || post.url || '')}</span>
    </a>
    ${post.body ? `<p class="post-note">${escapeHtml(post.body)}</p>` : ''}
    <time class="post-date" datetime="${post.created_at}">${formatDate(post.created_at)}</time>
  `
  return el
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderPost(post) {
  switch (post.type) {
    case 'thought': return renderThought(post)
    case 'post':    return renderPostCard(post)
    case 'image':   return renderImage(post)
    case 'link':    return renderLink(post)
    default:        return document.createElement('article')
  }
}
