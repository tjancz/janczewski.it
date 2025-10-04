
async function loadPubs(){
  const res = await fetch('data/publications.json');
  const pubs = await res.json();
  window.__PUBS__ = pubs;
  render(pubs);
  populateFilters(pubs);
}
function populateFilters(pubs){
  const years = Array.from(new Set(pubs.map(p=>p.year))).sort((a,b)=>b-a);
  const selYear = document.getElementById('filter-year');
  selYear.innerHTML = '<option value="">Rok: wszystkie</option>' + years.map(y=>`<option>${y}</option>`).join('');
}
function bibtex(p){
  const authors = p.authors.map(a=>a.replace(/\s+/g,' ')).join(' and ');
  const key = (p.authors[0].split(' ').slice(-1)[0] + p.year).toLowerCase();
  return `@article{${key},
  title={${p.title}},
  author={${authors}},
  journal={${p.venue}},
  year={${p.year}},
  url={${p.url||''}},
  doi={${p.doi||''}}
}`;
}
function schemaLD(p){
  const ld = {
    "@context":"https://schema.org",
    "@type":"ScholarlyArticle",
    "name": p.title,
    "author": p.authors.map(n=>({"@type":"Person","name":n})),
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
function render(pubs){
  const q = document.getElementById('q').value.trim().toLowerCase();
  const y = document.getElementById('filter-year').value;
  const t = document.getElementById('filter-type').value;
  const list = document.getElementById('list');
  let filtered = pubs.filter(p=>{
    const hay = (p.title + ' ' + p.authors.join(' ') + ' ' + (p.abstract||'') + ' ' + (p.keywords||[]).join(' ') + ' ' + p.venue).toLowerCase();
    const okQ = q ? hay.includes(q) : true;
    const okY = y ? String(p.year)===String(y) : true;
    const okT = t ? p.type===t : true;
    return okQ && okY && okT;
  }).sort((a,b)=> b.year - a.year || a.title.localeCompare(b.title));
  let html = '';
  for(const p of filtered){
    const meta = [p.authors.join(', '), p.venue, p.year].filter(Boolean).join(' • ');
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
