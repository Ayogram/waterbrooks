(function () {
  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function fetchMedia() {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      // Improved sorting: Newest date first, then highest ID (timestamp) first
      return data.sort((a, b) => {
        const dateCompare = (b.date || "").localeCompare(a.date || "");
        if (dateCompare !== 0) return dateCompare;
        return (b.id || "").localeCompare(a.id || "");
      }).slice(0, 10); // top 10 for slider
    } catch(err) {
      console.warn('Failed to fetch media API for home page', err);
      return [];
    }
  }

  function renderHomeMedia(mediaData) {
    const mount = document.getElementById("homeMediaPreview");
    if (!mount) return;

    if (!mediaData.length) {
      mount.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">
          <p style="opacity: 0.7; font-size: 1.1rem;">No media available yet. Check back soon!</p>
        </div>
      `;
      return;
    }

    // Horizontal slider with navigation arrows
    mount.style.display = 'block';
    mount.style.position = 'relative';
    mount.innerHTML = `
      <div class="media-slider-wrapper" style="position:relative;">
        <button class="slider-arrow prev" aria-label="Previous" style="position:absolute; left:-20px; top:50%; transform:translateY(-50%); z-index:10; background:#fff; border:none; width:40px; height:40px; border-radius:50%; box-shadow:0 4px 10px rgba(0,0,0,0.3); cursor:pointer; display:flex; align-items:center; justify-content:center; color:#011e3f; font-size:1.2rem; transition: all 0.3s ease; opacity:0; pointer-events:none;">&#10094;</button>
        <div class="media-slider-container" style="display: flex; overflow-x: auto; gap: 2rem; padding: 10px 5px 30px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; -ms-overflow-style: none;"></div>
        <button class="slider-arrow next" aria-label="Next" style="position:absolute; right:-20px; top:50%; transform:translateY(-50%); z-index:10; background:#fff; border:none; width:40px; height:40px; border-radius:50%; box-shadow:0 4px 10px rgba(0,0,0,0.3); cursor:pointer; display:flex; align-items:center; justify-content:center; color:#011e3f; font-size:1.2rem; transition: all 0.3s ease;">&#10095;</button>
      </div>
    `;

    const slider = mount.querySelector('.media-slider-container');
    const prevBtn = mount.querySelector('.prev');
    const nextBtn = mount.querySelector('.next');

    // Navigation logic
    prevBtn.onclick = () => slider.scrollBy({ left: -400, behavior: 'smooth' });
    nextBtn.onclick = () => slider.scrollBy({ left: 400, behavior: 'smooth' });

    // Hide/show arrows based on scroll position
    slider.onscroll = () => {
      prevBtn.style.opacity = slider.scrollLeft <= 10 ? '0' : '1';
      prevBtn.style.pointerEvents = slider.scrollLeft <= 10 ? 'none' : 'auto';
      const isEnd = slider.scrollLeft + slider.offsetWidth >= slider.scrollWidth - 10;
      nextBtn.style.opacity = isEnd ? '0' : '1';
      nextBtn.style.pointerEvents = isEnd ? 'none' : 'auto';
    };
    // Initial state
    setTimeout(() => {
        if (slider.scrollWidth > slider.offsetWidth) {
            nextBtn.style.opacity = '1';
        } else {
            nextBtn.style.opacity = '0';
        }
    }, 300);

    const html = mediaData.map(m => {
      let mediaElement = '';
      
      const parseMediaLink = function(url) {
        if (!url) return null;
        let match;
        
        // YouTube
        if ((match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i))) {
          const videoId = match[1];
          return { 
            platform: 'youtube', 
            id: videoId, 
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&enablejsapi=1&loop=1&playlist=${videoId}`, 
            thumbUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` 
          };
        }

        // Facebook (watch, videos, fb.watch, share/p, share/v)
        if ((url.includes('facebook.com') || url.includes('fb.watch')) && (url.includes('/videos/') || url.includes('/watch') || url.includes('fb.watch') || url.includes('/share/p/') || url.includes('/share/v/'))) {
          return { 
            platform: 'facebook', 
            embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=500` 
          };
        }

        // Instagram
        if ((match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^\/?#&]+)/i))) {
          return { 
            platform: 'instagram', 
            id: match[1], 
            embedUrl: `https://www.instagram.com/p/${match[1]}/embed` 
          };
        }

        // Generic Images (Cloudinary, JPG, PNG, etc.)
        if (url.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || url.includes('cloudinary.com')) {
          return { platform: 'image', embedUrl: url };
        }

        // Generic Videos (MP4, WebM, etc.)
        if (url.match(/\.(mp4|webm|ogg)($|\?)/i)) {
          return { platform: 'video', embedUrl: url };
        }

        return null;
      };

      if (m.type === 'link' || m.type === 'youtube') {
         const parsed = parseMediaLink(m.url);
         
         if (parsed && parsed.platform === 'youtube') {
           mediaElement = `
             <div class="yt-preview-wrapper" 
                  style="position:relative; width:100%; padding-bottom:56.25%; height:0; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                  onmouseenter="this.querySelector('.yt-iframe-placeholder').innerHTML = '<iframe width=\\'100%\\' height=\\'100%\\' src=\\'${parsed.embedUrl}\\' frameborder=\\'0\\' allow=\\'autoplay; encrypted-media; picture-in-picture\\' allowfullscreen style=\\'position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;\\'></iframe>'; this.querySelector('.yt-thumb').style.opacity='0'; this.querySelector('.yt-watch-btn').style.opacity='1'; this.querySelector('.yt-play-icon').style.opacity='0';"
                  onmouseleave="this.querySelector('.yt-iframe-placeholder').innerHTML = ''; this.querySelector('.yt-thumb').style.opacity='1'; this.querySelector('.yt-watch-btn').style.opacity='0'; this.querySelector('.yt-play-icon').style.opacity='1';">
               <img class="yt-thumb" src="${parsed.thumbUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; transition: opacity 0.4s ease; z-index:1;" onerror="this.src='images/logo.png'">
               <div class="yt-iframe-placeholder" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;"></div>
               <a href="${m.url}" target="_blank" class="yt-watch-btn" 
                  style="position:absolute; bottom:15px; right:15px; z-index:5; opacity:0; transition: all 0.3s ease; background:#fff; color:#011e3f; padding:8px 16px; border-radius:30px; font-weight:700; font-size:0.85rem; text-decoration:none; box-shadow:0 4px 15px rgba(0,0,0,0.4); display:flex; align-items:center; gap:6px;">
                 WATCH FULL <span style="font-size:1.2em;">→</span>
               </a>
               <div class="yt-play-icon" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:3; color:#fff; font-size:54px; pointer-events:none; transition: opacity 0.3s ease; text-shadow: 0 4px 15px rgba(0,0,0,0.6);">▶</div>
             </div>
           `;
         } else if (parsed && (parsed.platform === 'facebook' || parsed.platform === 'instagram')) {
            mediaElement = `
              <div class="yt-preview-wrapper" style="position:relative; width:100%; padding-bottom:70%; height:0; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                   onmouseenter="this.querySelector('.yt-watch-btn').style.opacity='1';"
                   onmouseleave="this.querySelector('.yt-watch-btn').style.opacity='0';">
                <iframe src="${parsed.embedUrl}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none; overflow:hidden;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>
                <a href="${m.url}" target="_blank" class="yt-watch-btn" 
                  style="position:absolute; bottom:15px; right:15px; z-index:5; opacity:0; transition: all 0.3s ease; background:#fff; color:#011e3f; padding:8px 16px; border-radius:30px; font-weight:700; font-size:0.85rem; text-decoration:none; box-shadow:0 4px 15px rgba(0,0,0,0.4); display:flex; align-items:center; gap:6px;">
                 WATCH FULL <span style="font-size:1.2em;">→</span>
                </a>
              </div>
            `;
         } else if (parsed && parsed.platform === 'image') {
            mediaElement = `
              <div class="yt-preview-wrapper" style="position:relative; width:100%; height:200px; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                   onmouseenter="this.querySelector('.yt-watch-btn').style.opacity='1';"
                   onmouseleave="this.querySelector('.yt-watch-btn').style.opacity='0';">
                <img src="${parsed.embedUrl}" style="width:100%; height:100%; object-fit:cover;">
                <a href="${m.url}" target="_blank" class="yt-watch-btn" 
                  style="position:absolute; bottom:15px; right:15px; z-index:5; opacity:0; transition: all 0.3s ease; background:#fff; color:#011e3f; padding:8px 16px; border-radius:30px; font-weight:700; font-size:0.85rem; text-decoration:none; box-shadow:0 4px 15px rgba(0,0,0,0.4); display:flex; align-items:center; gap:6px;">
                 VIEW FULL <span style="font-size:1.2em;">→</span>
                </a>
              </div>
            `;
         } else if (parsed && parsed.platform === 'video') {
            mediaElement = `
              <div class="yt-preview-wrapper" style="position:relative; width:100%; height:200px; border-radius:12px; overflow:hidden; background:#000; cursor:pointer;"
                   onmouseenter="this.querySelector('video').play(); this.querySelector('.yt-watch-btn').style.opacity='1';"
                   onmouseleave="this.querySelector('video').pause(); this.querySelector('.yt-watch-btn').style.opacity='0';">
                <video src="${parsed.embedUrl}" muted loop style="width:100%; height:100%; object-fit:cover;"></video>
                <a href="${m.url}" target="_blank" class="yt-watch-btn" 
                  style="position:absolute; bottom:15px; right:15px; z-index:5; opacity:0; transition: all 0.3s ease; background:#fff; color:#011e3f; padding:8px 16px; border-radius:30px; font-weight:700; font-size:0.85rem; text-decoration:none; box-shadow:0 4px 15px rgba(0,0,0,0.4); display:flex; align-items:center; gap:6px;">
                 WATCH FULL <span style="font-size:1.2em;">→</span>
                </a>
              </div>
            `;
         } else {
           mediaElement = `<a href="${m.url}" target="_blank" style="display:flex; height:200px; align-items:center; justify-content:center; background:rgba(255,255,255,0.1); color:#fff; border-radius:12px; border:1px solid rgba(255,255,255,0.2); text-decoration:none; font-weight:600; text-align:center; padding:15px;">${m.caption || 'Watch Video'}</a>`;
         }
      } else if (m.type === 'video') {
        mediaElement = `<video controls muted loop src="${m.url}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; background:#000;" onmouseenter="this.play()" onmouseleave="this.pause(); this.currentTime=0;"></video>`;
      } else {
        mediaElement = `<img src="${m.url}" alt="${m.caption}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px;" />`;
      }

      return `
        <article class="media-slider-item" style="flex: 0 0 320px; scroll-snap-align: start; display: flex; flex-direction: column; gap: 15px; transition: transform 0.3s ease;">
          ${mediaElement}
          <div style="padding: 0 5px;">
            <div style="font-size: 0.8rem; color: #a0aab8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; font-weight: 500;">${formatDate(m.date)}</div>
            <h3 style="font-size: 1.15rem; font-weight: 600; line-height: 1.4; margin: 0; color: #fff; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${m.caption}</h3>
          </div>
        </article>
      `;
    }).join("");

    slider.innerHTML = html;
  }

  document.addEventListener("DOMContentLoaded", async function () {
    const media = await fetchMedia();
    renderHomeMedia(media);
  });
})();
