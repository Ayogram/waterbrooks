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

  const mediaFile = document.getElementById('mediaFile');
  const youtubeGrp = document.getElementById('youtubeInputGroup');
  const ytInput = document.getElementById('youtubeUrlInput');
  const ytPreview = document.getElementById('youtubePreviewContainer');
  const refContentTextarea = document.getElementById('refContent');
  const editContentTextarea = document.getElementById('editContent');

  // Handle Shift+Enter elegantly inside Textareas
  const handleShiftEnter = function (e) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      const val = this.value;
      this.value = val.substring(0, start) + '\n\n' + val.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
    }
  };
  if (refContentTextarea) refContentTextarea.addEventListener('keydown', handleShiftEnter);
  if (editContentTextarea) editContentTextarea.addEventListener('keydown', handleShiftEnter);

  if (mediaFile) {
    mediaFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.size > 4.5 * 1024 * 1024) {
        alert("This file is overwhelmingly massive! The Vercel free-tier completely physically physically rejects anything over 4.5 MB.\n\nTo confidently seamlessly host massive videos permanently for free forever, I have magically revealed a secret new YouTube Link Upload Box for you. Upload it to YouTube, and paste the exact link inside!");
        mediaFile.value = '';
        youtubeGrp.classList.remove('hidden');
      } else if (file) {
        youtubeGrp.classList.add('hidden');
        ytInput.value = '';
        ytPreview.innerHTML = '';
      }
    });
  }

  if (ytInput) {
    ytInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      let videoId = null;
      // Extract the exact pure mathematically identifiable Video ID from various link structures natively
      const standardMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (standardMatch && standardMatch[1]) {
        videoId = standardMatch[1];
        ytPreview.innerHTML = `<iframe width="100%" height="250" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      } else {
        ytPreview.innerHTML = '';
      }
    });
  }

  const mediaForm = document.getElementById('mediaForm');
  if (mediaForm) {
    mediaForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msgDiv = document.getElementById('mediaMessage');
      const submitBtn = mediaForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Uploading securely...';
      msgDiv.className = '';
      msgDiv.textContent = 'Generating...';

      const fileAttached = mediaFile.files[0];
      const ytUrl = ytInput.value.trim();
      const captionVal = document.getElementById('mediaCaption').value;

      if (!fileAttached && !ytUrl) {
          msgDiv.className = 'error-msg';
          msgDiv.textContent = 'You must physically either select a small <4.5MB file or paste a YouTube Link!';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload Media';
          return;
      }

      let fetchOptions = {};

      if (ytUrl) {
         fetchOptions = {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ youtubeUrl: ytUrl, caption: captionVal })
         };
      } else {
         const formData = new FormData();
         formData.append('mediaFile', fileAttached);
         formData.append('caption', captionVal);
         fetchOptions = {
           method: 'POST',
           body: formData
         };
      }

      try {
        const res = await fetch('/api/media', fetchOptions);
        const data = await res.json();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload Media';
        if (data.success) {
          msgDiv.className = 'success-msg';
          msgDiv.textContent = 'Media successfully magically uploaded into the secure Mongo CDN!';
          mediaForm.reset();
          youtubeGrp.classList.add('hidden');
          ytPreview.innerHTML = '';
        } else {
          msgDiv.className = 'error-msg';
          msgDiv.textContent = data.error || 'Upload completely crashed internally.';
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload Media';
        msgDiv.className = 'error-msg';
        msgDiv.textContent = `Server Connection Failure: ${err.message || ''}`;
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
  const btn = document.querySelector('#loginSection button');
  
  if (!pwd) {
      msg.className = 'error-msg';
      msg.textContent = 'Please enter a password.';
      return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Authenticating...';
  msg.className = '';
  msg.textContent = 'Connecting to secure server... Please wait...';
  
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ password: pwd })
    });
    const data = await res.json();
    
    btn.disabled = false;
    btn.textContent = 'Login';
    
    if (data.success) {
      showDashboard();
      msg.textContent = '';
      document.getElementById('adminPassword').value = '';
    } else {
      msg.className = 'error-msg';
      msg.textContent = data.error || 'Invalid password';
    }
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Login';
    msg.className = 'error-msg';
    msg.textContent = 'Cannot connect to server (Serverless Cold Start). Try again in 5 seconds.';
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
