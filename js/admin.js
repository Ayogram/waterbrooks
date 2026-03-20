// Admin JS Logic
async function forgotPassword() {
  const email = prompt("Please enter the admin email address:");
  if (!email) return;

  const msg = document.getElementById('loginMessage');
  msg.className = '';
  msg.textContent = 'Sending reset email...';

  try {
    const res = await fetch('/api/forgot-password', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success) {
      msg.className = 'success-msg';
      msg.textContent = data.message;
    } else {
      msg.className = 'error-msg';
      msg.textContent = data.error || 'Failed to send email.';
      // Give a tiny hint to the user if they need environment setup
      if (data.error && data.error.includes("Action Required")) {
          alert(data.error);
      }
    }
  } catch (e) {
    msg.className = 'error-msg';
    msg.textContent = 'Cannot connect to server.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const mediaForm = document.getElementById('mediaForm');
  if (mediaForm) {
    mediaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgDiv = document.getElementById('mediaMessage');
      msgDiv.className = '';
      msgDiv.textContent = 'Uploading...';

      const formData = new FormData();
      formData.append('mediaFile', document.getElementById('mediaFile').files[0]);
      formData.append('caption', document.getElementById('mediaCaption').value);

      try {
        const res = await fetch('/api/media', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          msgDiv.className = 'success-msg';
          msgDiv.textContent = 'Media uploaded successfully!';
          mediaForm.reset();
        } else {
          msgDiv.className = 'error-msg';
          msgDiv.textContent = data.error || 'Upload failed.';
        }
      } catch (err) {
        msgDiv.className = 'error-msg';
        msgDiv.textContent = 'Connection error.';
      }
    });
  }
});

async function checkAuth() {
  try {
    const res = await fetch('/api/check-auth');
    const data = await res.json();
    if (data.isAdmin) {
      showDashboard();
    }
  } catch (e) {
    console.warn('Backend not running or cannot be reached.', e);
  }
}

async function login() {
  const pwd = document.getElementById('adminPassword').value;
  const msg = document.getElementById('loginMessage');
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    if (data.success) {
      showDashboard();
      msg.textContent = '';
    } else {
      msg.className = 'error-msg';
      msg.textContent = 'Invalid password';
    }
  } catch (e) {
    msg.className = 'error-msg';
    msg.textContent = 'Cannot connect to server. Is Node.js running?';
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    document.getElementById('dashboardSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('adminPassword').value = '';
  } catch (e) {}
}

function showDashboard() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('dashboardSection').classList.remove('hidden');
}

function switchTab(tabId, btn) {
  document.getElementById('reflectionsTab').classList.add('hidden');
  document.getElementById('mediaTab').classList.add('hidden');
  document.getElementById('manageTab').classList.add('hidden');
  document.getElementById(tabId).classList.remove('hidden');

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

async function submitReflection() {
  const title = document.getElementById('refTitle').value;
  const excerpt = document.getElementById('refExcerpt').value;
  const content = document.getElementById('refContent').value;
  const msgDiv = document.getElementById('refMessage');

  if (!title || !content) {
    msgDiv.className = 'error-msg';
    msgDiv.textContent = 'Title and Content are required.';
    return;
  }

  msgDiv.className = '';
  msgDiv.textContent = 'Publishing...';

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ title, excerpt, content })
    });
    const data = await res.json();
    if (data.success) {
      msgDiv.className = 'success-msg';
      msgDiv.textContent = 'Reflection published successfully!';
      document.getElementById('refTitle').value = '';
      document.getElementById('refExcerpt').value = '';
      document.getElementById('refContent').value = '';
    } else {
      msgDiv.className = 'error-msg';
      msgDiv.textContent = data.error || 'Failed to publish.';
    }
  } catch (err) {
    msgDiv.className = 'error-msg';
    msgDiv.textContent = 'Connection error.';
  }
}

async function loadManageContent() {
  // Load posts
  try {
    const res = await fetch('/api/posts');
    const posts = await res.json();
    window.globalPostsData = posts;
    const postsDiv = document.getElementById('managePostsList');
    if (posts.length === 0) {
      postsDiv.innerHTML = '<p>No reflections found.</p>';
    } else {
      postsDiv.innerHTML = `<div id="pastorList"><div class="pw-list-stack">` + posts.map(p => {
        const d = new Date(p.date + "T00:00:00");
        const dateStr = Number.isNaN(d.getTime()) ? p.date : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        const textNodes = (Array.isArray(p.content) ? p.content : [p.content]).filter(Boolean).map(para => `<p>${para}</p>`).join('');
        return `
        <article class="pw-post" onclick="toggleAdminPost('${p.id}', this.querySelector('.pw-readmore'))">
          <div class="pw-post-top">
            <div class="pw-post-left">
              <div class="pw-post-date">${dateStr}</div>
              <div class="pw-post-title">${p.title}</div>
              <div class="pw-post-excerpt">${p.excerpt}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap: 8px; align-items:flex-end; justify-content:center;">
              <button class="pw-readmore" type="button" style="background:#28a745;" onclick="event.stopPropagation(); openEditModal('${p.id}')">Edit</button>
              <button class="pw-readmore" type="button" style="background:#dc3545;" onclick="event.stopPropagation(); deletePost('${p.id}')">Delete</button>
              <button class="pw-readmore" type="button" onclick="event.stopPropagation(); toggleAdminPost('${p.id}', this)">Read more</button>
            </div>
          </div>
          <div class="pw-post-body" id="admin-body-${p.id}">
            ${textNodes}
          </div>
        </article>
      `}).join('') + `</div></div>`;
    }
  } catch (e) {
    document.getElementById('managePostsList').textContent = 'Failed to load posts.';
  }

  // Load media
  try {
    const res = await fetch('/api/media');
    const media = await res.json();
    const mediaDiv = document.getElementById('manageMediaList');
    if (media.length === 0) {
      mediaDiv.innerHTML = '<p>No media found.</p>';
    } else {
      mediaDiv.innerHTML = `<div id="pastorList"><div class="pw-list-stack" style="display: grid; gap: 24px;">` + media.map(m => {
        const d = new Date(m.date + "T00:00:00");
        const dateStr = Number.isNaN(d.getTime()) ? m.date : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        return `
        <article class="pw-post" style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="display:flex; align-items:flex-start; gap: 15px; flex: 1;">
            <img src="/${m.url}" style="width: 80px; height: 80px; object-fit: cover; border-radius:6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" onerror="this.src='images/logo.png'">
            <div>
              <div class="pw-post-date" style="margin-bottom:4px;">${dateStr}</div>
              <strong style="color: var(--primary); font-size: 1.1rem; display:block; margin-bottom: 4px;">${m.type.toUpperCase()}</strong> 
              <p class="pw-post-excerpt" style="margin:0;">${m.caption || '<em>No caption provided</em>'}</p>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap: 8px; align-items:flex-end; justify-content:center;">
            <button class="pw-readmore" type="button" onclick="toggleMediaFullscreen(this)">View Image</button>
            <button class="pw-readmore" type="button" style="background:#17a2b8;" onclick="editMediaCaption('${m.id}', '${m.caption ? m.caption.replace(/'/g, "\\'") : ''}')">Edit Caption</button>
            <button class="pw-readmore" type="button" style="background:#dc3545;" onclick="deleteMedia('${m.id}')">Delete</button>
          </div>
        </article>
      `}).join('') + `</div></div>`;
    }
  } catch (e) {
    document.getElementById('manageMediaList').textContent = 'Failed to load media.';
  }
}

async function deletePost(id) {
  if (!confirm("Are you sure you want to completely delete this reflection? This cannot be undone.")) return;
  try {
    const res = await fetch('/api/posts/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadManageContent(); // refresh immediately
    } else {
      alert(data.error || 'Failed to delete.');
    }
  } catch (e) {
    alert('Connection error.');
  }
}

async function editMediaCaption(id, oldCaption) {
  const newCaption = prompt("Enter new caption:", oldCaption || '');
  if (newCaption === null || newCaption === oldCaption) return;
  
  try {
    const res = await fetch('/api/media/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption: newCaption })
    });
    const data = await res.json();
    if (data.success) {
      loadManageContent(); // refresh immediately
    } else {
      alert(data.error || 'Failed to update caption.');
    }
  } catch (e) {
    alert('Connection error.');
  }
}

async function deleteMedia(id) {
  if (!confirm("Are you sure you want to permanently delete this media file?")) return;
  try {
    const res = await fetch('/api/media/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadManageContent(); // refresh immediately
    } else {
      alert(data.error || 'Failed to delete.');
    }
  } catch (e) {
    alert('Connection error.');
  }
}

function toggleAdminPost(id, btn) {
  const body = document.getElementById(`admin-body-${id}`);
  if (!body) return;
  if (body.classList.contains("is-open")) {
    body.classList.remove("is-open");
    if(btn) btn.textContent = "Read more";
  } else {
    body.classList.add("is-open");
    if(btn) btn.textContent = "Close";
  }
}

function toggleMediaFullscreen(btn) {
  const media = btn.closest('.pw-post').querySelector('img, video');
  if (!media) return;
  
  if (document.getElementById('mediaFullscreenOverlay')) {
     return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'mediaFullscreenOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.9)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';

  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '25px';
  closeBtn.style.right = '35px';
  closeBtn.style.background = 'transparent';
  closeBtn.style.color = '#fff';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '50px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.onclick = () => document.body.removeChild(overlay);

  const clone = media.cloneNode(true);
  clone.style.maxWidth = '90vw';
  clone.style.maxHeight = '90vh';
  clone.style.width = 'auto';
  clone.style.height = 'auto';
  clone.style.objectFit = 'contain';
  clone.style.boxShadow = '0 0 40px rgba(0,0,0,0.8)';
  clone.style.borderRadius = '8px';

  overlay.appendChild(closeBtn);
  overlay.appendChild(clone);
  document.body.appendChild(overlay);
}

function openEditModal(id) {
  const p = window.globalPostsData && window.globalPostsData.find(x => x.id === id);
  if (!p) return;
  document.getElementById('editPostId').value = p.id;
  document.getElementById('editTitle').value = p.title;
  document.getElementById('editDate').value = p.date;
  document.getElementById('editExcerpt').value = p.excerpt || '';
  const contentStr = Array.isArray(p.content) ? p.content.join('\n\n') : (p.content || '');
  document.getElementById('editContent').value = contentStr;
  document.getElementById('editPostModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editPostModal').style.display = 'none';
}

async function saveEditPost() {
  const id = document.getElementById('editPostId').value;
  const title = document.getElementById('editTitle').value;
  const date = document.getElementById('editDate').value;
  const excerpt = document.getElementById('editExcerpt').value;
  const contentRaw = document.getElementById('editContent').value;
  const content = contentRaw.split('\n\n').map(x => x.trim()).filter(Boolean);
  
  if (!title || !content.length) return alert("Title and Content are required.");
  
  try {
    const res = await fetch('/api/posts/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, date, excerpt, content })
    });
    const data = await res.json();
    if (data.success) {
      closeEditModal();
      loadManageContent(); // Refresh UI
      alert('Reflection updated perfectly!');
    } else {
      alert(data.error || 'Failed to update reflection.');
    }
  } catch (e) {
    alert('Connection error.');
  }
}
