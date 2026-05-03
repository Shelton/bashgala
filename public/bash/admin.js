import { supabase, signIn, signOut, getSession, fetchAllTags, callFunction, uploadImage } from '../../src/lib/supabase.js'

const MAX_TAGS = 3
let allTags = []
let selectedTagIds = []
let pendingImages = [] // { file, caption }
let session = null

// --- Auth ---

async function init() {
  const { data } = await getSession()
  session = data.session

  supabase.auth.onAuthStateChange((_event, s) => {
    session = s
    showScreen(s ? 'composer' : 'login')
  })

  showScreen(session ? 'composer' : 'login')

  if (session) {
    allTags = await fetchAllTags()
  }
}

function showScreen(name) {
  document.getElementById('login-screen').hidden = name !== 'login'
  document.getElementById('composer-screen').hidden = name !== 'composer'
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault()
  const email = document.getElementById('login-email').value
  const msg = document.getElementById('login-message')
  await signIn(email)
  msg.textContent = 'check your email for a magic link.'
  msg.hidden = false
})

document.getElementById('sign-out').addEventListener('click', async () => {
  await signOut()
})

// --- Type switching ---

const typeRadios = document.querySelectorAll('input[name="type"]')
const fieldGroups = document.querySelectorAll('.field-group[data-type]')

function getType() {
  return document.querySelector('input[name="type"]:checked').value
}

function switchType(type) {
  fieldGroups.forEach(g => {
    g.hidden = g.dataset.type !== type
  })
}

typeRadios.forEach(r => {
  r.addEventListener('change', () => switchType(r.value))
})
switchType('thought')

// --- Image upload ---

const dropzone = document.getElementById('image-dropzone')
const imageInput = document.getElementById('image-input')
const previews = document.getElementById('image-previews')

dropzone.addEventListener('click', () => imageInput.click())
dropzone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') imageInput.click() })

imageInput.addEventListener('change', () => {
  Array.from(imageInput.files).forEach(addImagePreview)
  imageInput.value = ''
})

function addImagePreview(file) {
  const index = pendingImages.length
  pendingImages.push({ file, caption: '' })

  const wrap = document.createElement('div')
  wrap.className = 'image-preview-item'
  wrap.innerHTML = `
    <img src="${URL.createObjectURL(file)}" alt="">
    <input type="text" placeholder="caption" data-index="${index}">
    <button type="button" data-remove="${index}">✕</button>
  `
  wrap.querySelector('input').addEventListener('input', e => {
    pendingImages[index].caption = e.target.value
  })
  wrap.querySelector('button').addEventListener('click', () => {
    pendingImages.splice(index, 1)
    wrap.remove()
  })
  previews.appendChild(wrap)
}

// --- Link auto-fetch ---

document.getElementById('link-url').addEventListener('blur', async e => {
  const url = e.target.value.trim()
  const titleField = document.getElementById('link-title')
  if (!url || titleField.value) return
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
    const { contents } = await res.json()
    const match = contents.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (match) titleField.value = match[1].trim()
  } catch {}
})

// --- Tags ---

const tagInput = document.getElementById('tag-input')
const tagSuggestions = document.getElementById('tag-suggestions')
const selectedTagsEl = document.getElementById('selected-tags')

tagInput.addEventListener('input', () => {
  const q = tagInput.value.trim().toLowerCase()
  if (!q) { tagSuggestions.hidden = true; return }
  const matches = allTags.filter(t =>
    t.slug.includes(q) && !selectedTagIds.includes(t.id)
  )
  if (!matches.length) { tagSuggestions.hidden = true; return }
  tagSuggestions.innerHTML = ''
  matches.forEach(t => {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = t.name
    btn.addEventListener('click', () => addTag(t))
    tagSuggestions.appendChild(btn)
  })
  tagSuggestions.hidden = false
})

function addTag(tag) {
  if (selectedTagIds.length >= MAX_TAGS) return
  if (selectedTagIds.includes(tag.id)) return
  selectedTagIds.push(tag.id)
  renderSelectedTags()
  tagInput.value = ''
  tagSuggestions.hidden = true
}

function removeTag(id) {
  selectedTagIds = selectedTagIds.filter(t => t !== id)
  renderSelectedTags()
}

function renderSelectedTags() {
  selectedTagsEl.innerHTML = ''
  selectedTagIds.forEach(id => {
    const tag = allTags.find(t => t.id === id)
    if (!tag) return
    const chip = document.createElement('span')
    chip.className = 'tag-chip'
    chip.innerHTML = `${tag.name} <button type="button" aria-label="remove ${tag.name}">×</button>`
    chip.querySelector('button').addEventListener('click', () => removeTag(id))
    selectedTagsEl.appendChild(chip)
  })
}

// --- Submit ---

const composer = document.getElementById('composer')
const status = document.getElementById('composer-status')

async function submit(publish) {
  if (!session) return
  const token = session.access_token
  const type = getType()

  const body = {
    type,
    tags: selectedTagIds,
  }

  if (type === 'thought') {
    body.body = document.getElementById('thought-body').value.trim()
  } else if (type === 'post') {
    body.title = document.getElementById('post-title').value.trim()
    body.synopsis = document.getElementById('post-synopsis').value.trim()
    body.body = document.getElementById('post-body').value.trim()
    body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  } else if (type === 'image') {
    body.body = document.getElementById('image-caption').value.trim()
  } else if (type === 'link') {
    body.url = document.getElementById('link-url').value.trim()
    body.title = document.getElementById('link-title').value.trim()
    body.body = document.getElementById('link-note').value.trim()
  }

  showStatus('saving…')

  try {
    const post = await callFunction('create-post', body, token)

    // upload images for image type
    if (type === 'image' && pendingImages.length) {
      for (let i = 0; i < pendingImages.length; i++) {
        const { file, caption } = pendingImages[i]
        await uploadImage(post.id, file, caption, '', i, 'images', token)
      }
    }

    if (publish) {
      await callFunction('publish-post', { id: post.id, published: true }, token)
      showStatus('published. <a href="/">← back to feed</a>', true)
    } else {
      showStatus('saved as draft.')
    }

    resetComposer()
  } catch (err) {
    showStatus(`error: ${err.message}`, false, true)
  }
}

composer.addEventListener('submit', e => { e.preventDefault(); submit(true) })
document.getElementById('save-draft').addEventListener('click', () => submit(false))

function showStatus(html, persist = false, isError = false) {
  status.innerHTML = html
  status.hidden = false
  status.className = `composer-status ${isError ? 'error' : ''}`
  if (!persist) setTimeout(() => { status.hidden = true }, 4000)
}

function resetComposer() {
  document.querySelectorAll('.composer input[type=text], .composer input[type=url], .composer textarea')
    .forEach(el => { el.value = '' })
  pendingImages = []
  previews.innerHTML = ''
  selectedTagIds = []
  renderSelectedTags()
}

init()
