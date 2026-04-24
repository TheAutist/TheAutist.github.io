(function () {
  const PAGE_DIR = 'pages/';
  const contentEl = document.getElementById('page-content');
  const navTree = document.getElementById('nav-tree');
  const searchInput = document.getElementById('search');
  let siteIndex = {};

  // ── Lightweight Markdown-ish parser ──────────────────────────────
  // Supports: headings, bold, italic, links, images, lists, blockquotes,
  //           code blocks, inline code, tables, horizontal rules, wiki-links,
  //           map embeds, and infoboxes.

  function parseMarkdown(src) {
    const lines = src.split('\n');
    let html = '';
    let inCode = false;
    let inList = false;
    let listType = '';
    let inTable = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Fenced code blocks
      if (line.startsWith('```')) {
        if (inCode) { html += '</code></pre>'; inCode = false; }
        else { html += '<pre><code>'; inCode = true; }
        continue;
      }
      if (inCode) { html += escapeHtml(line) + '\n'; continue; }

      // Close open list if current line is not a list item
      if (inList && !/^(\s*([-*]|\d+\.)\s)/.test(line)) {
        html += listType === 'ul' ? '</ul>' : '</ol>';
        inList = false;
      }

      // Close table
      if (inTable && !line.startsWith('|')) {
        html += '</tbody></table>';
        inTable = false;
      }

      // Blank
      if (line.trim() === '') { continue; }

      // Map embed: {{map:filename.json}}
      const mapMatch = line.match(/^\{\{map:(.+?)\}\}$/);
      if (mapMatch) {
        const id = 'map-' + Math.random().toString(36).slice(2, 8);
        html += `<div id="${id}" class="wiki-map"></div>`;
        setTimeout(() => loadMap(id, 'maps/' + mapMatch[1]), 0);
        continue;
      }

      // Infobox start/end
      if (line.trim() === '{{infobox}}') { html += '<div class="infobox">'; continue; }
      if (line.trim() === '{{/infobox}}') { html += '</div>'; continue; }
      if (line.startsWith('{{infobox-title:')) {
        html += '<div class="infobox-title">' + line.slice(16, -2) + '</div><table>';
        continue;
      }

      // Table
      if (line.startsWith('|')) {
        const cells = line.split('|').filter(c => c.trim() !== '');
        if (!inTable) {
          inTable = true;
          html += '<table><thead><tr>' + cells.map(c => `<th>${inline(c.trim())}</th>`).join('') + '</tr></thead><tbody>';
          i++; // skip separator row
          continue;
        }
        html += '<tr>' + cells.map(c => `<td>${inline(c.trim())}</td>`).join('') + '</tr>';
        continue;
      }

      // Heading
      const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        html += `<h${level}>${inline(hMatch[2])}</h${level}>`;
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
        continue;
      }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) { html += '<hr>'; continue; }

      // Unordered list
      if (/^\s*[-*]\s/.test(line)) {
        if (!inList) { html += '<ul>'; inList = true; listType = 'ul'; }
        html += `<li>${inline(line.replace(/^\s*[-*]\s/, ''))}</li>`;
        continue;
      }

      // Ordered list
      if (/^\s*\d+\.\s/.test(line)) {
        if (!inList) { html += '<ol>'; inList = true; listType = 'ol'; }
        html += `<li>${inline(line.replace(/^\s*\d+\.\s/, ''))}</li>`;
        continue;
      }

      // Paragraph
      html += `<p>${inline(line)}</p>`;
    }

    if (inCode) html += '</code></pre>';
    if (inList) html += listType === 'ul' ? '</ul>' : '</ol>';
    if (inTable) html += '</tbody></table>';
    return html;
  }

  function inline(text) {
    return text
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      // Wiki-links: [[Page Name]] or [[Page Name|display text]]
      .replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_, page, display) => {
        const slug = slugify(page);
        return `<a href="#${slug}" data-page="${slug}">${display || page}</a>`;
      })
      // Standard links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Navigation / page loading ───────────────────────────────────

  function slugify(name) {
    return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }

  async function loadIndex() {
    try {
      const res = await fetch('pages/index.json');
      siteIndex = await res.json();
    } catch {
      siteIndex = { title: 'World Wiki', categories: [] };
    }
    document.getElementById('wiki-title').textContent = siteIndex.title || 'World Wiki';
    document.title = siteIndex.title || 'World Wiki';
    renderNav(siteIndex.categories);
  }

  function renderNav(categories, filter = '') {
    const lower = filter.toLowerCase();
    let html = '';
    for (const cat of categories) {
      const pages = (cat.pages || []).filter(p =>
        !lower || p.name.toLowerCase().includes(lower)
      );
      if (pages.length === 0 && lower) continue;
      html += `<div class="nav-category">${cat.name}</div><ul>`;
      for (const page of pages) {
        const slug = page.slug || slugify(page.name);
        html += `<li><a href="#${slug}" data-page="${slug}">${page.name}</a></li>`;
      }
      html += '</ul>';
    }
    navTree.innerHTML = html;
  }

  async function loadPage(slug) {
    try {
      const res = await fetch(`${PAGE_DIR}${slug}.md`);
      if (!res.ok) throw new Error('Not found');
      const md = await res.text();
      contentEl.innerHTML = parseMarkdown(md);
    } catch {
      contentEl.innerHTML = `<h1>Page not found</h1><p>No page exists for <code>${slug}</code>. Create <code>pages/${slug}.md</code> to add it.</p>`;
    }
    // Highlight active link
    navTree.querySelectorAll('a').forEach(a => {
      a.classList.toggle('active', a.dataset.page === slug);
    });
    window.scrollTo(0, 0);
  }

  // ── Interactive maps (Leaflet with custom image overlay) ────────

  function loadMap(elementId, jsonPath) {
    fetch(jsonPath)
      .then(r => r.json())
      .then(config => {
        const bounds = config.bounds || [[0, 0], [1000, 1000]];
        const map = L.map(elementId, {
          crs: L.CRS.Simple,
          minZoom: config.minZoom ?? -2,
          maxZoom: config.maxZoom ?? 2,
        });
        L.imageOverlay(config.image, bounds).addTo(map);
        map.fitBounds(bounds);

        if (config.markers) {
          for (const m of config.markers) {
            const marker = L.marker(m.coords).addTo(map);
            let popup = `<strong>${m.name}</strong>`;
            if (m.description) popup += `<br>${m.description}`;
            if (m.page) popup += `<br><a href="#${slugify(m.page)}">${m.page}</a>`;
            marker.bindPopup(popup);
          }
        }
      })
      .catch(() => {
        document.getElementById(elementId).innerHTML = '<p>Map data not found.</p>';
      });
  }

  // ── Event handling ──────────────────────────────────────────────

  window.addEventListener('hashchange', () => {
    const slug = location.hash.slice(1);
    if (slug) loadPage(slug);
  });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-page]');
    if (a) {
      e.preventDefault();
      location.hash = a.dataset.page;
    }
  });

  searchInput.addEventListener('input', () => {
    renderNav(siteIndex.categories, searchInput.value);
  });

  // Boot
  loadIndex().then(() => {
    if (location.hash.length > 1) loadPage(location.hash.slice(1));
  });
})();
