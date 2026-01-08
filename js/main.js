/*
 * Simple JavaScript to handle mobile navigation toggling.
 */

document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('hamburger');
  const navList = document.querySelector('.nav-list');

  hamburger?.addEventListener('click', () => {
    navList?.classList.toggle('open');
  });

  // Hero background slideshow
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    // Array of background images for the hero slideshow. The first entry matches the default hero image.
    const heroImages = [
      'images/hero.jpg',
      'images/hero2.jpg',
      'images/hero3.jpg',
      'images/hero4.png',
      'images/hero5.png',
      'images/hero6.png'
    ];
    let currentHeroIndex = 0;
    setInterval(() => {
      // increment the index and loop back to the beginning
      currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
      heroSection.style.backgroundImage = `url('${heroImages[currentHeroIndex]}')`;
    }, 5000); // Change slide every 5 seconds
  }

  // Highlight the active navigation link based on current page
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop();
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    // For index.html we may have empty string or index.html; treat both as homepage
    if (
      (currentPage === '' && href === 'index.html') ||
      currentPage === href
    ) {
      link.classList.add('active');
    }
  });

  // Member stories slider: enable slide change on dot click
  const sliderDots = document.querySelectorAll('.slider-dots .dot');
  const experienceSlides = document.querySelectorAll('.experience-slides .slide');
  if (sliderDots.length && experienceSlides.length) {
    sliderDots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        experienceSlides.forEach((slide) => slide.classList.remove('active'));
        sliderDots.forEach((d) => d.classList.remove('active'));
        experienceSlides[index].classList.add('active');
        dot.classList.add('active');
      });
    });
  }
});
// ===== Give Modal Popup (Give Page) =====
document.addEventListener("DOMContentLoaded", () => {
  const giveBtn = document.getElementById("giveNowBtn");
  const modal = document.getElementById("giveModal");
  const closeBtn = document.getElementById("closeGiveModal");
  const copyBtn = document.getElementById("copyAccountBtn");
  const acctText = document.getElementById("accountNumberText");
  const statusText = document.getElementById("copyStatusText");

  // If this page doesn't have the button/modal, do nothing (prevents errors on other pages)
  if (!giveBtn || !modal) return;

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (statusText) statusText.textContent = "";
  };

  giveBtn.addEventListener("click", openModal);

  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(); // click outside card closes
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  if (copyBtn && acctText) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(acctText.textContent.trim());
        if (statusText) statusText.textContent = "Account number copied!";
        setTimeout(() => { if (statusText) statusText.textContent = ""; }, 2000);
      } catch (err) {
        if (statusText) statusText.textContent = "Copy failed. Please copy manually.";
      }
    });
  }
});
// ===== Google Sheets Web App URL =====
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby3Py_tvc4kdqgbEdp7tV8jtHlYu6yBiAN45pFgBWXrS89lsF18Cb6qeqTDThkko0MRTg/exec";

// Reliable Apps Script POST (avoids preflight/CORS issues)
async function sendToSheets(formType, data) {
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // IMPORTANT
    body: JSON.stringify({ formType, data }),
  });

  const text = await res.text();
  let result = {};
  try {
    result = JSON.parse(text);
  } catch {
    result = { ok: false, error: text };
  }

  if (!result.ok) throw new Error(result.error || "Submission failed");
  return result;
}

// ===== Mailing List Submission =====
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("mailingForm");
  const pageInput = document.getElementById("mailingPage");
  const btn = document.getElementById("mailingBtn");

  if (!form) return;

  form.addEventListener("submit", () => {
    if (pageInput) pageInput.value = window.location.pathname;

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    setTimeout(() => {
      alert("Thank you. You have been added to our mailing list.");
      form.reset();

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }, 1200);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  const btn = document.getElementById("signupSubmitBtn");
  const hiddenAge = document.getElementById("ageGroupCombined");

  signupForm.addEventListener("submit", () => {
    // combine checkbox values into one string
    const checked = Array.from(signupForm.querySelectorAll('input[name="ageGroup"]:checked'))
      .map(cb => cb.value);

    if (hiddenAge) hiddenAge.value = checked.join(", ");

    // UI feedback
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    // since it submits to hidden iframe, keep user on page
    setTimeout(() => {
      alert("Thank you. Your signup has been received.");
      signupForm.reset();

      if (hiddenAge) hiddenAge.value = "";

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }, 1200);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("celebrationForm");
  const btn = document.getElementById("celebrationSubmitBtn");

  if (!form) return;

  form.addEventListener("submit", () => {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    setTimeout(() => {
      alert("Thank you. Your celebration request has been received.");
      form.reset();

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }, 1200);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const btn = document.getElementById("contactSubmitBtn");

  if (!form) return;

  form.addEventListener("submit", () => {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    setTimeout(() => {
      alert("Thank you. Your message has been received. We will get back to you shortly.");
      form.reset();

      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }, 1200);
  });
});
