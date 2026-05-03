let images = []
let currentIndex = 0
const overlay = () => document.getElementById('gallery-overlay')
const img = () => overlay().querySelector('.gallery-img')
const caption = () => overlay().querySelector('.gallery-caption')
const prevBtn = () => overlay().querySelector('.gallery-prev')
const nextBtn = () => overlay().querySelector('.gallery-next')

function show(galleryImages, index) {
  images = galleryImages
  currentIndex = index
  update()
  overlay().hidden = false
  document.body.classList.add('overlay-open')
  overlay().focus()
}

function hide() {
  overlay().hidden = true
  document.body.classList.remove('overlay-open')
  images = []
}

function update() {
  const current = images[currentIndex]
  img().src = current.url
  img().alt = current.alt_text || current.caption || ''
  caption().textContent = current.caption || ''
  prevBtn().hidden = currentIndex === 0
  nextBtn().hidden = currentIndex === images.length - 1
}

export function initGallery() {
  const o = overlay()

  o.querySelector('.gallery-close').addEventListener('click', hide)
  o.addEventListener('click', e => { if (e.target === o) hide() })

  prevBtn().addEventListener('click', () => {
    if (currentIndex > 0) { currentIndex--; update() }
  })
  nextBtn().addEventListener('click', () => {
    if (currentIndex < images.length - 1) { currentIndex++; update() }
  })

  document.addEventListener('keydown', e => {
    if (overlay().hidden) return
    if (e.key === 'Escape') hide()
    if (e.key === 'ArrowLeft' && currentIndex > 0) { currentIndex--; update() }
    if (e.key === 'ArrowRight' && currentIndex < images.length - 1) { currentIndex++; update() }
  })

  document.addEventListener('click', e => {
    const trigger = e.target.closest('.gallery-trigger')
    if (!trigger) return
    const galleryImages = JSON.parse(trigger.dataset.gallery)
    const index = parseInt(trigger.dataset.galleryIndex || '0')
    show(galleryImages, index)
  })
}
