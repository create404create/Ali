// main script for Pak SIM CNIC Lookup ALI DATA SERVICES
const searchBtn = document.getElementById('searchBtn')
const searchInput = document.getElementById('searchInput')
const resultContainer = document.getElementById('resultContainer')
const serviceButtons = document.querySelectorAll('.service-btn')

// keep using local api.php proxy which hides API key on server
const API_PROXY = 'api.php'

let activeService = '' // selected service key

// attach events
searchBtn.addEventListener('click', doSearch)
searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch() })
serviceButtons.forEach(btn => btn.addEventListener('click', () => {
  // visual active state
  serviceButtons.forEach(b => b.classList.remove('active-service'))
  btn.classList.add('active-service')
  activeService = btn.dataset.key || ''
  showServiceNote(activeService)
}))

function showServiceNote(key) {
  resultContainer.classList.remove('hidden')
  if (!key) {
    resultContainer.innerHTML = '<p class="msg-info">Service selected nahi hui please koi service button select karein</p>'
    return
  }

  // friendly text for each key
  const map = {
    sim_details: 'Fresh Sim Details حاصل کرنے کے لیے نمبر درج کریں اور Search کریں',
    sim_with_nadra_pic: 'تصویر کے ساتھ Fresh Sim Details حاصل کرنے کے لیے نمبر درج کریں',
    active_sims_on_cnic: 'CNIC پر موجود تمام Active SIM numbers دیکھنے کے لیے CNIC درج کریں',
    cnic_color_copy: 'NADRA CNIC Color Copy یا تصویر کے لیے CNIC درج کریں',
    sim_cdr: 'Sim CDR یا مکمل call history کے لیے نمبرز CNIC یا نمبر دونوں درکار ہوسکتے ہیں',
    nadra_family_tree: 'NADRA Family Tree کے لیے متعلقہ CNIC فراہم کریں',
    pinpoint_location: 'Pinpoint live location کے لیے نمبر درکار ہوگا اور permission/paid process کے مطابق کام ہوگا',
    nadra_cnic_picture: 'NADRA CNIC Picture دیکھنے کے لیے CNIC درج کریں',
    passport_details: 'Passport details کے لیے متعلقہ معلومات فراہم کریں',
    vaccines_online: 'حصول و تصدیق ویکسین ریکارڈ آن لائن نمبرز یا CNIC سے ہو سکتے ہیں'
  }

  const text = map[key] || 'Service information'
  resultContainer.innerHTML = `<p class="msg-info">${escapeHtml(text)}</p>
    <p class="small-muted">اب نمبر یا CNIC اوپر Search باکس میں ڈالیں اور Search دبائیں</p>`
}

function showError(msg) {
  resultContainer.classList.remove('hidden')
  resultContainer.innerHTML = `<p class="msg-error">${escapeHtml(msg)}</p>`
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

async function doSearch() {
  const raw = (searchInput.value || '').trim()
  if (!/^\d{10,11}$/.test(raw) && !/^\d{13}$/.test(raw)) {
    showError('Please enter valid 10 11 digit mobile or 13 digit CNIC')
    return
  }

  resultContainer.classList.remove('hidden')
  resultContainer.innerHTML = '<p class="msg-info">Loading please wait</p>'

  // API expects 10 digit without leading zero for mobile
  let q = raw
  if (q.length === 11 && q.startsWith('0')) q = q.substring(1)

  try {
    const res = await fetch(API_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'q=' + encodeURIComponent(q)
    })

    const data = await res.json()
    if (data.error) {
      // show helpful message and contact prompt no download
      resultContainer.innerHTML = `<p class="msg-error">No records found or API error</p>
        <p class="small-muted">For advanced services please contact ALI DATA SERVICES on WhatsApp</p>
        <p><a class="btn" href="https://wa.me/923358229790" target="_blank">📱 Contact on WhatsApp</a></p>`
      return
    }

    const result = data.result
    if (!result || (typeof result === 'string' && /no sim|no data/i.test(result))) {
      resultContainer.innerHTML = `<p class="msg-error">No records found for this query</p>
        <p class="small-muted">If you need Fresh Sim Details or other advanced services click a service button above and contact us</p>
        <p><a class="btn" href="https://wa.me/923358229790" target="_blank">📱 Contact on WhatsApp</a></p>`
      return
    }

    const items = Array.isArray(result) ? result : [result]
    renderResults(items)
  } catch (err) {
    console.error(err)
    showError('Network or server error please try again')
  }
}

function renderResults(items) {
  let html = '<table class="result-table"><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>'
  items.forEach(item => {
    // ensure Meher not shown
    if (item.owner && /meher/i.test(String(item.owner))) item.owner = 'ALI DATA SERVICES'

    // ordered keys to appear first
    const order = ['name','number','cnic','operator','address','owner']
    order.forEach(k => {
      if (item[k]) html += `<tr><td>${capitalize(k)}</td><td>${escapeHtml(item[k])}</td></tr>`
    })

    Object.keys(item).forEach(k => {
      if (!order.includes(k)) {
        html += `<tr><td>${capitalize(k)}</td><td>${escapeHtml(item[k])}</td></tr>`
      }
    })

    html += '<tr><td colspan="2"><hr></td></tr>'
  })
  html += '</tbody></table>'

  // append contact CTA for advanced services
  html += `<div style="margin-top:12px">
    <p class="small-muted">For full reports CDR family tree pinpoint location and other paid services contact</p>
    <a class="btn" href="https://wa.me/923358229790" target="_blank">📱 Contact ALI DATA SERVICES</a>
  </div>`

  resultContainer.innerHTML = html
}

function capitalize(s) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1)
}
