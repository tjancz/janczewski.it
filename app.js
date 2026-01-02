
async function loadPubs(){
  try {
    const [pubsRes, confRes] = await Promise.all([
      fetch('data/publications.json'),
      fetch('data/conferences.json')
    ]);
    if(!pubsRes.ok) throw new Error(`HTTP error! status: ${pubsRes.status}`);
    if(!confRes.ok) throw new Error(`HTTP error! status: ${confRes.status}`);
    const pubs = await pubsRes.json();
    const conferences = await confRes.json();
    if(!Array.isArray(pubs)) throw new Error('Invalid publications data format');
    if(!Array.isArray(conferences)) throw new Error('Invalid conferences data format');
    const allItems = [...pubs, ...conferences];
    window.__PUBS__ = allItems;
    populateFilters(allItems);
    render(allItems);
  } catch(error) {
    console.error('Error loading data:', error);
    document.getElementById('list').innerHTML = '<p>Błąd ładowania danych.</p>';
  }
}
function populateFilters(pubs){
  const years = Array.from(new Set(pubs.map(p=>p.year))).sort((a,b)=>b-a);
  const selYear = document.getElementById('filter-year');
  selYear.innerHTML = '<option value="">Rok: wszystkie</option>' + years.map(y=>`<option value="${y}">${y}</option>`).join('');
  selYear.value = ''; // Upewnij się, że domyślnie wybrana jest opcja "wszystkie"
}
function bibtex(p){
  if(p.type === 'conference'){
    const key = (p.id || 'conf' + p.year).toLowerCase();
    return `@inproceedings{${key},
  title={${p.title}},
  booktitle={${p.venue}},
  year={${p.year}},
  date={${p.date||''}},
  location={${p.location||''}},
  url={${p.url||''}},
  doi={${p.doi||''}}
}`;
  } else {
    const authors = (p.authors||[]).map(a=>a.replace(/\s+/g,' ')).join(' and ');
    const key = p.authors && p.authors.length > 0 
      ? (p.authors[0].split(' ').slice(-1)[0] + p.year).toLowerCase()
      : ('pub' + p.year).toLowerCase();
    return `@article{${key},
  title={${p.title}},
  author={${authors}},
  journal={${p.venue}},
  year={${p.year}},
  url={${p.url||''}},
  doi={${p.doi||''}}
}`;
  }
}
function schemaLD(p){
  if(p.type === 'conference'){
    const ld = {
      "@context":"https://schema.org",
      "@type":"Event",
      "name": p.title,
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": p.location ? {
        "@type": "Place",
        "name": p.location
      } : undefined,
      "organizer": {
        "@type": "Organization",
        "name": p.venue
      },
      "startDate": p.date || String(p.year),
      "url": p.url || document.location.href + '#' + p.id
    };
    if(p.doi) ld.identifier = {"@type":"PropertyValue","propertyID":"DOI","value":p.doi};
    if(!ld.location) delete ld.location;
    return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
  } else {
    const ld = {
      "@context":"https://schema.org",
      "@type":"ScholarlyArticle",
      "name": p.title,
      "author": (p.authors||[]).map(n=>({"@type":"Person","name":n})),
      "datePublished": String(p.year),
      "inLanguage": p.language || "pl",
      "headline": p.title,
      "about": p.keywords || [],
      "isPartOf": {"@type":"Periodical","name": p.venue},
      "url": p.url || document.location.href + '#' + p.id
    };
    if(p.doi) ld.identifier = {"@type":"PropertyValue","propertyID":"DOI","value":p.doi};
    return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
  }
}
function render(pubs){
  if(!pubs || !Array.isArray(pubs) || pubs.length === 0){
    document.getElementById('list').innerHTML = '<p>Brak wyników.</p>';
    return;
  }
  const q = document.getElementById('q').value.trim().toLowerCase();
  const y = document.getElementById('filter-year').value;
  const t = document.getElementById('filter-type').value;
  const list = document.getElementById('list');
  let filtered = pubs.filter(p=>{
    const searchText = p.type === 'conference' 
      ? (p.title + ' ' + p.venue + ' ' + (p.location||'') + ' ' + (p.date||'')).toLowerCase()
      : (p.title + ' ' + (p.authors||[]).join(' ') + ' ' + (p.abstract||'') + ' ' + (p.keywords||[]).join(' ') + ' ' + p.venue).toLowerCase();
    const okQ = q ? searchText.includes(q) : true;
    const okY = y && y !== '' && y !== 'Ładowanie…' && y !== 'Rok: wszystkie' ? String(p.year)===String(y) : true;
    const okT = t ? p.type===t : true;
    return okQ && okY && okT;
  }).sort((a,b)=> b.year - a.year || a.title.localeCompare(b.title));
  let html = '';
  for(const p of filtered){
    if(p.type === 'conference'){
      // Renderowanie konferencji
      const meta = [p.date, p.venue, p.location].filter(Boolean).join(' • ');
      const urlBtn = p.url ? `<a class="btn" href="${p.url}" target="_blank" rel="noopener">Link</a>` : '';
      const doiBtn = p.doi ? `<a class="btn" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI</a>` : '';
      html += `
      <article class="card" id="${p.id}">
        <h3>${p.title}<span class="badge">konferencja</span></h3>
        <div class="meta">${meta}</div>
        <div class="btns">
          ${urlBtn} ${doiBtn}
          <button onclick="copyBib('${p.id}')">Kopiuj BibTeX</button>
        </div>
        ${schemaLD(p)}
      </article>`;
    } else {
      // Renderowanie publikacji
      const meta = [(p.authors||[]).join(', '), p.venue, p.year].filter(Boolean).join(' • ');
      const tags = (p.keywords||[]).map(k=>`<span class="tag">${k}</span>`).join('');
      const pdfBtn = p.pdf ? `<a class="btn" href="${p.pdf}" target="_blank" rel="noopener">PDF</a>` : '';
      const urlBtn = p.url ? `<a class="btn" href="${p.url}" target="_blank" rel="noopener">Link</a>` : '';
      const doiBtn = p.doi ? `<a class="btn" href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI</a>` : '';
      html += `
      <article class="card" id="${p.id}">
        <h3>${p.title}${p.type==='journal'?'<span class="badge">artykuł</span>':''}</h3>
        <div class="meta">${meta}</div>
        <p>${p.abstract||''}</p>
        <div class="tags">${tags}</div>
        <div class="btns">
          ${pdfBtn} ${urlBtn} ${doiBtn}
          <button onclick="copyBib('${p.id}')">Kopiuj BibTeX</button>
        </div>
        ${schemaLD(p)}
      </article>`;
    }
  }
  list.innerHTML = html || '<p>Brak wyników.</p>';
}
function copyBib(id){
  const p = window.__PUBS__.find(x=>x.id===id);
  const txt = bibtex(p);
  navigator.clipboard.writeText(txt).then(()=>{
    alert('Skopiowano BibTeX.');
  });
}
function addListeners(){
  ['q','filter-year','filter-type'].forEach(id=>{
    document.getElementById(id).addEventListener('input',()=>render(window.__PUBS__));
    document.getElementById(id).addEventListener('change',()=>render(window.__PUBS__));
  });
}
document.addEventListener('DOMContentLoaded', ()=>{
  addListeners();
  loadPubs();
});
