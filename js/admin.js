// Admin JS Logic
let inactivityTimer;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  // Auto-logout after 10 minutes of completely zero interaction
  inactivityTimer = setTimeout(() => {
    const dashboard = document.getElementById('dashboardSection');
    if (dashboard && !dashboard.classList.contains('hidden')) {
      alert("Session expired due to 10 minutes of inactivity. Logging out for security.");
      logout();
    }
  }, 600000); 
}

// Listen for any type of interaction to keep the session alive
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
  document.addEventListener(evt, resetInactivityTimer, true);
});

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

// Define toggle function globally so it's always clickable
window.setMediaMode = function(mode) {
  const fileGrp = document.getElementById('fileUploadGroup');
  const youtubeGrp = document.getElementById('youtubeInputGroup');
  const fileBtn = document.getElementById('toggleFileBtn');
  const linkBtn = document.getElementById('toggleLinkBtn');
  
  if (!fileGrp || !youtubeGrp) return;

  if (mode === 'file') {
    fileGrp.classList.remove('hidden');
    youtubeGrp.classList.add('hidden');
    fileBtn.style.background = '#0056b3';
    fileBtn.style.color = '#fff';
    fileBtn.style.borderColor = '#0056b3';
    linkBtn.style.background = '#fff';
    linkBtn.style.color = '#495057';
    linkBtn.style.borderColor = '#ccc';
  } else {
    fileGrp.classList.add('hidden');
    youtubeGrp.classList.remove('hidden');
    linkBtn.style.background = '#0056b3';
    linkBtn.style.color = '#fff';
    linkBtn.style.borderColor = '#0056b3';
    fileBtn.style.background = '#fff';
    fileBtn.style.color = '#495057';
    fileBtn.style.borderColor = '#ccc';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  if (document.getElementById('toggleFileBtn')) setMediaMode('file');

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
        alert("This file is too large (>4MB). \n\nPlease use the 'Add Link' option instead to link from YouTube!");
        mediaFile.value = '';
      }
    });
  }

  window.parseVideoLink = function(url) {
    if (!url) return null;
    let match;
    // YouTube
    if ((match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i))) {
      return { platform: 'youtube', id: match[1], embedUrl: `https://www.youtube.com/embed/${match[1]}`, thumbUrl: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg` };
    }
    // Facebook Post
    if (url.includes('facebook.com') && (url.includes('/posts/') || url.includes('/p/') || url.includes('/share/p/') || url.includes('/permalink/'))) {
      return { platform: 'facebook-post', embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=500` };
    }
    // Facebook Video
    if ((url.includes('facebook.com') || url.includes('fb.watch')) && (url.includes('/videos/') || url.includes('/watch') || url.includes('fb.watch') || url.includes('/share/v/'))) {
      return { platform: 'facebook', embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500` };
    }
    // Instagram
    if ((match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^\/?#&]+)/i))) {
      return { platform: 'instagram', id: match[1], embedUrl: `https://www.instagram.com/p/${match[1]}/embed` };
    }
    // Spotify
    if (url.includes('spotify.com')) {
      const spotifyMatch = url.match(/spotify\.com\/(track|album|playlist|artist|show|episode)\/([a-zA-Z0-9]+)/);
      if (spotifyMatch) {
        return { platform: 'spotify', embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}` };
      }
    }
    // SoundCloud
    if (url.includes('soundcloud.com')) {
      return { platform: 'soundcloud', embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true` };
    }
    // Twitter / X
    if (url.includes('twitter.com') || url.includes('x.com')) {
       return { platform: 'twitter', embedUrl: `https://twitframe.com/show?url=${encodeURIComponent(url)}` };
    }
    // Generic Images
    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || url.includes('cloudinary.com')) {
      return { platform: 'image', embedUrl: url };
    }
    // Generic Videos
    if (url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
      return { platform: 'video', embedUrl: url };
    }
    return null;
  };

  if (ytInput) {
    let debounceTimer;
    ytInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      
      debounceTimer = setTimeout(async () => {
        let url = e.target.value.trim();
        
        // Auto-resolve Facebook shortlinks to their canonical post URLs
        if (url.includes('facebook.com/share/')) {
          ytPreview.innerHTML = '<p style="padding:10px;color:#011e3f;font-size:0.9em;">Resolving Facebook link...</p>';
          try {
            const res = await fetch(`/api/resolve-link?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            if (data && data.url && data.url !== url) {
              url = data.url;
              e.target.value = url; // Update input with canonical URL
            }
          } catch(err) {
            console.error('Failed to resolve shortlink', err);
          }
        }
        
        const parsed = window.parseVideoLink(url);
        if (parsed) {
          if (parsed.platform === 'image') {
            ytPreview.innerHTML = `<img src="${parsed.embedUrl}" style="width:100%; max-height:300px; object-fit:contain; border-radius:8px;">`;
          } else if (parsed.platform === 'video') {
            ytPreview.innerHTML = `<video src="${parsed.embedUrl}" controls style="width:100%; max-height:300px; border-radius:8px;"></video>`;
          } else {
            let iframeStyle = "width:100%; height:250px; border-radius:12px;";
            if (parsed.platform === 'instagram') iframeStyle = "width:100%; max-width:400px; height:450px; margin:0 auto; display:block; border-radius:12px;";
            if (parsed.platform === 'facebook') iframeStyle = "width:100%; height:280px; overflow:hidden; border-radius:12px;";
            if (parsed.platform === 'facebook-post') iframeStyle = "width:100%; height:350px; overflow:hidden; border-radius:12px;";
            if (parsed.platform === 'spotify') iframeStyle = "width:100%; height:160px; border-radius:12px;";
            if (parsed.platform === 'soundcloud') iframeStyle = "width:100%; height:166px; border-radius:12px;";
            if (parsed.platform === 'twitter') iframeStyle = "width:100%; height:400px; border-radius:12px; background:#fff;";
            
            ytPreview.innerHTML = `<iframe style="${iframeStyle}" src="${parsed.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen scrolling="no"></iframe>`;
          }
        } else {
          ytPreview.innerHTML = url ? '<p style="padding:10px;color:#cc0000;font-size:0.9em;">Link format not fully recognized for live preview, but it will still save if valid.</p>' : '';
        }
      }, 500); // 500ms debounce
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
          msgDiv.textContent = 'Please select a file (under 4.5MB) or paste a video link.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Upload Media';
          return;
      }

      let fetchOptions = {};

      if (ytUrl) {
         fetchOptions = {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ videoLink: ytUrl, caption: captionVal })
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
          msgDiv.textContent = 'Media uploaded successfully.';
          mediaForm.reset();
          youtubeGrp.classList.add('hidden');
          ytPreview.innerHTML = '';
        } else {
          msgDiv.className = 'error-msg';
          msgDiv.textContent = data.error || 'Upload failed. Please try again.';
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Upload Media';
        msgDiv.className = 'error-msg';
        msgDiv.textContent = 'Connection error. Please try again.';
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
  btn.textContent = 'Logging in...';
  msg.className = '';
  msg.textContent = 'Connecting... Please wait.';
  
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
    msg.textContent = 'Connection error. Please try again in a few seconds.';
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
  resetInactivityTimer(); // Start the 10-min countdown as soon as they get in
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
    posts.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
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
    const resMedia = await fetch('/api/media');
    const media = await resMedia.json();
    media.sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    window.globalMediaData = media;
    const mediaDiv = document.getElementById('manageMediaList');
    if (media.length === 0) {
      mediaDiv.innerHTML = '<p>No media found.</p>';
    } else {
      mediaDiv.innerHTML = `<div id="pastorList"><div class="pw-list-stack" style="display: grid; gap: 24px;">` + media.map(m => {
        const d = new Date(m.date + "T00:00:00");
        const dateStr = Number.isNaN(d.getTime()) ? m.date : d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
        const isVideo = m.type === 'link' || m.type === 'youtube' || m.type === 'video' || (m.url && m.url.includes('youtube'));
        const ytId = (window.parseVideoLink && window.parseVideoLink(m.url))?.id || (m.url && m.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1]);
        
        let thumbHtml = '';
        if (ytId) {
          thumbHtml = `<img src="https://img.youtube.com/vi/${ytId}/hqdefault.jpg" style="width: 80px; height: 80px; object-fit: cover; border-radius:6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" onerror="this.src='/images/logo.png'">`;
        } else if (isVideo) {
          thumbHtml = `<div style="width: 80px; height: 80px; background:#f0f0f0; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#ff0000; font-size:32px;"><b style="font-family:sans-serif;font-size:24px;">▶</b></div>`;
        } else {
          const imgSrc = m.url.startsWith('http') || m.url.startsWith('/') ? m.url : '/' + m.url;
          thumbHtml = `<img src="${imgSrc}" style="width: 80px; height: 80px; object-fit: cover; border-radius:6px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" onerror="this.src='/images/logo.png'">`;
        }

        const safeCaption = m.caption ? m.caption.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '<em>No caption provided</em>';
        const typeLabel = (m.type || 'MEDIA').toUpperCase();

        return `
        <article class="pw-post" style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
          <div style="display:flex; align-items:flex-start; gap: 15px; flex: 1; min-width:240px;">
            ${thumbHtml}
            <div>
              <div class="pw-post-date" style="margin-bottom:4px;">${dateStr}</div>
              <strong style="color: var(--primary); font-size: 1rem; display:block; margin-bottom: 4px;">${typeLabel}</strong> 
              <p class="pw-post-excerpt" style="margin:0; white-space:pre-wrap;">${safeCaption}</p>
              ${m.url ? `<small style="display:block; margin-top:4px; color:#6c757d; word-break:break-all; max-width:400px;">${m.url.substring(0, 60)}${m.url.length > 60 ? '...' : ''}</small>` : ''}
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap: 8px; align-items:flex-end; justify-content:center;">
            ${
              isVideo
              ? `<button class="pw-readmore" type="button" style="background:#0056b3;" onclick="openMediaPreviewModal('${m.id}')">Preview Video</button>
                 <a href="/media/video/${encodeURIComponent(m.id)}" target="_blank" class="pw-readmore" style="background:#495057; text-decoration:none; display:inline-block; text-align:center;">View on Site ↗</a>`
              : `<button class="pw-readmore" type="button" style="background:#0056b3;" onclick="openMediaPreviewModal('${m.id}')">View Image</button>`
            }
            <button class="pw-readmore" type="button" style="background:#28a745;" onclick="openEditMediaModal('${m.id}')">Edit</button>
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

// Media Modal Handlers
window.openEditMediaModal = function(id) {
  const item = (window.globalMediaData || []).find(m => String(m.id) === String(id));
  if (!item) return alert("Media item not found.");

  document.getElementById('editMediaId').value = item.id;
  document.getElementById('editMediaCaption').value = item.caption || '';
  document.getElementById('editMediaUrl').value = item.url || '';
  document.getElementById('editMediaDate').value = item.date || '';

  window.updateEditMediaPreview(item.url || '');
  document.getElementById('editMediaModal').style.display = 'flex';
};

window.closeEditMediaModal = function() {
  document.getElementById('editMediaModal').style.display = 'none';
};

window.updateEditMediaPreview = function(url) {
  const previewDiv = document.getElementById('editMediaLivePreview');
  if (!previewDiv) return;

  if (!url) {
    previewDiv.innerHTML = '';
    return;
  }

  const parsed = window.parseVideoLink ? window.parseVideoLink(url) : null;
  if (parsed && parsed.embedUrl) {
    previewDiv.innerHTML = `<iframe src="${parsed.embedUrl}" style="width:100%; height:200px; border:0; border-radius:6px;" allowfullscreen></iframe>`;
  } else if (url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
    previewDiv.innerHTML = `<img src="${url}" style="max-height:160px; max-width:100%; object-fit:contain; border-radius:6px;">`;
  } else {
    previewDiv.innerHTML = '';
  }
};

window.saveEditMedia = async function() {
  const id = document.getElementById('editMediaId').value;
  const caption = document.getElementById('editMediaCaption').value.trim();
  const url = document.getElementById('editMediaUrl').value.trim();
  const date = document.getElementById('editMediaDate').value;
  const saveBtn = document.getElementById('saveEditMediaBtn');

  if (!id) return alert("Invalid media ID.");

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    const res = await fetch('/api/media/' + encodeURIComponent(id), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption, url, date })
    });
    const data = await res.json();
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';

    if (data.success) {
      window.closeEditMediaModal();
      loadManageContent(); // Refresh UI immediately
      alert('Media updated successfully!');
    } else {
      alert(data.error || 'Failed to update media.');
    }
  } catch(err) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Changes';
    alert('Connection error while updating media.');
  }
};

// Media Lightbox Preview
window.openMediaPreviewModal = function(id) {
  const item = (window.globalMediaData || []).find(m => String(m.id) === String(id));
  if (!item) return alert("Media item not found.");

  const modal = document.getElementById('mediaPreviewModal');
  const modalTitle = document.getElementById('previewModalTitle');
  const imgEl = document.getElementById('previewModalImg');
  const videoWrap = document.getElementById('previewModalVideoWrap');
  const siteBtn = document.getElementById('previewModalSiteBtn');

  modalTitle.textContent = item.caption || "Media Preview";
  const isVideo = item.type === 'link' || item.type === 'youtube' || item.type === 'video' || (item.url && item.url.includes('youtube'));

  if (isVideo) {
    imgEl.style.display = 'none';
    videoWrap.style.display = 'block';
    siteBtn.style.display = 'inline-block';
    siteBtn.href = `/media/video/${encodeURIComponent(item.id)}`;

    const ytMatch = item.url && item.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    const ytId = ytMatch ? ytMatch[1] : null;

    if (ytId) {
      videoWrap.innerHTML = `
        <div style="position:relative; width:100%; padding-bottom:56.25%; height:0; background:#000; border-radius:6px; overflow:hidden;">
          <iframe src="https://www.youtube.com/embed/${ytId}?rel=0&autoplay=1" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
    } else if (item.url && item.url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
      const src = item.url.startsWith('http') || item.url.startsWith('/') ? item.url : '/' + item.url;
      videoWrap.innerHTML = `<video controls autoplay style="width:100%; max-height:65vh; border-radius:6px; background:#000;"><source src="${src}"></video>`;
    } else {
      videoWrap.innerHTML = `
        <div style="padding:40px; text-align:center; background:#f0f4f8; border-radius:6px;">
          <p style="margin-bottom:12px; font-weight:600; color:#054478;">Media Link:</p>
          <a href="${item.url}" target="_blank" style="word-break:break-all; color:#0056b3; font-weight:600;">${item.url}</a>
        </div>
      `;
    }
  } else {
    // Image Preview
    videoWrap.style.display = 'none';
    videoWrap.innerHTML = '';
    imgEl.style.display = 'block';
    siteBtn.style.display = 'none';
    const imgSrc = item.url.startsWith('http') || item.url.startsWith('/') ? item.url : '/' + item.url;
    imgEl.src = imgSrc;
  }

  modal.style.display = 'flex';
};

window.closeMediaPreviewModal = function() {
  const modal = document.getElementById('mediaPreviewModal');
  const videoWrap = document.getElementById('previewModalVideoWrap');
  if (videoWrap) videoWrap.innerHTML = '';
  if (modal) modal.style.display = 'none';
};

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
