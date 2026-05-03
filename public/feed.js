import { fetchFeed, fetchFeedByTag } from '../src/lib/supabase.js'
import { renderPost } from '../src/components/feed/post.js'
import { initGallery } from '../src/components/overlay/gallery.js'

const feed = document.getElementById('feed')
const paginationEl = document.getElementById('pagination')

function getRouteParams() {
  const path = window.location.pathname
  const tagMatch = path.match(/^\/t\/([^/]+)(?:\/p\/(\d+))?$/)
  if (tagMatch) return { tagSlug: tagMatch[1], page: parseInt(tagMatch[2] || '1') - 1 }
  const pageMatch = path.match(/^\/p\/(\d+)$/)
  if (pageMatch) return { page: parseInt(pageMatch[1]) - 1 }
  return { page: 0 }
}

function buildPagination({ page, total, pageSize, tagSlug }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return

  const base = tagSlug ? `/t/${tagSlug}` : ''
  const newerHref = page === 1 ? `${base}/` : `${base}/p/${page}`
  const olderHref = `${base}/p/${page + 2}`

  paginationEl.innerHTML = ''
  if (page > 0) {
    const a = document.createElement('a')
    a.href = newerHref
    a.textContent = '← newer'
    paginationEl.appendChild(a)
  }
  if (page < totalPages - 1) {
    const a = document.createElement('a')
    a.href = olderHref
    a.textContent = 'older →'
    paginationEl.appendChild(a)
  }
  paginationEl.hidden = false
}

async function render() {
  const { page, tagSlug } = getRouteParams()

  try {
    const result = tagSlug
      ? await fetchFeedByTag(tagSlug, page)
      : await fetchFeed(page)

    feed.innerHTML = ''

    if (!result.posts.length) {
      feed.innerHTML = '<p class="empty">nothing here yet.</p>'
      return
    }

    result.posts.forEach(post => {
      feed.appendChild(renderPost(post))
    })

    buildPagination(result)
  } catch (err) {
    feed.innerHTML = '<p class="error">something broke.</p>'
    console.error(err)
  }
}

initGallery()
render()
