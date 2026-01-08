/*
 * Waterbrooks site scripts
 */

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // Mobile navigation toggling
  // =========================
  const hamburger = document.getElementById("hamburger");
  const navList = document.querySelector(".nav-list");

  const closeMenu = () => {
    if (!navList || !hamburger) return;
    navList.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  hamburger?.addEventListener("click", () => {
    if (!navList) return;
    const isOpen = navList.classList.toggle("open");
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close menu when you click any menu link (mobile)
  document.querySelectorAll(".nav-list .nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close menu if user taps outside the dropdown
  document.addEventListener("click", (e) => {
    if (!navList || !hamburger) return;

    const clickedInsideMenu = navList.contains(e.target);
    const clickedHamburger = hamburger.contains(e.target);

    if (!clickedInsideMenu && !clickedHamburger) {
      closeMenu();
    }
  });

  // Close menu on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // =========================
  // Hero background slideshow (with preload to prevent flash)
  // =========================
  const heroSection = document.querySelector(".hero");

  if (heroSection) {
    const heroImages = [
      "images/hero.jpg",
      "images/hero2.jpg",
      "images/hero3.jpg",
      "images/hero4.png",
      "images/hero5.png",
      "images/hero6.png",
    ];

    let currentHeroIndex = 0;
    let slideshowTimer = null;

    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ src, ok: true });
        img.onerror = () => resolve({ src, ok: false });
        img.src = src;
      });

    const startSlideshow = () => {
      if (slideshowTimer) return;

      slideshowTimer = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
        heroSection.style.backgroundImage = `url('${heroImages[currentHeroIndex]}')`;
      }, 5000);
    };

    preloadImage(heroImages[0]).then(() => {
      heroSection.style.backgroundImage = `url('${heroImages[0]}')`;
      document.body.classList.add("hero-ready");
    });

    Promise.all(heroImages.slice(1).map(preloadImage)).then(() => {
      startSlideshow();
    });
  }

  // =========================
  // Highlight active nav link
  // =========================
  const navLinks = document.querySelectorAll(".nav-link");
  const currentPage = window.location.pathname.split("/").pop().split("?")[0].split("#")[0];

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if ((currentPage === "" && href === "index.html") || currentPage === href) {
      link.classList.add("active");
    }
  });

  // =========================
  // Member stories slider dots
  // =========================
  const sliderDots = document.querySelectorAll(".slider-dots .dot");
  const experienceSlides = document.querySelectorAll(".experience-slides .slide");

  if (sliderDots.length && experienceSlides.length) {
    sliderDots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        experienceSlides.forEach((slide) => slide.classList.remove("active"));
        sliderDots.forEach((d) => d.classList.remove("active"));
        experienceSlides[index].classList.add("active");
        dot.classList.add("active");
      });
    });
  }

  // =========================
  // GIVE MODAL POPUP (Give Page)
  // =========================
  const giveBtn = document.getElementById("giveNowBtn");
  const modal = document.getElementById("giveModal");
  const closeBtn = document.getElementById("closeGiveModal");
  const copyBtn = document.getElementById("copyAccountBtn");
  const acctText = document.getElementById("accountNumberText");
  const statusText = document.getElementById("copyStatusText");

  // If not on Give page, exit cleanly
  if (giveBtn && modal) {
    // Debug (you can remove later)
    // console.log("Give modal initialized");

    // Defensive: ensure button can receive clicks even if overlays exist
    giveBtn.style.position = "relative";
    giveBtn.style.zIndex = "20";
    giveBtn.style.pointerEvents = "auto";

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

    // Use both click + pointerup for stubborn overlay/click issues
    giveBtn.addEventListener("click", openModal);
    giveBtn.addEventListener("pointerup", openModal);

    closeBtn?.addEventListener("click", closeModal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });

    if (copyBtn && acctText) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(acctText.textContent.trim());
          if (statusText) statusText.textContent = "Account number copied!";
          setTimeout(() => {
            if (statusText) statusText.textContent = "";
          }, 2000);
        } catch (err) {
          if (statusText) statusText.textContent = "Copy failed. Please copy manually.";
        }
      });
    }
  }

  // =========================
  // Mailing List Submission (iframe submit)
  // =========================
  const mailingForm = document.getElementById("mailingForm");
  const pageInput = document.getElementById("mailingPage");
  const mailingBtn = document.getElementById("mailingBtn");

  if (mailingForm) {
    mailingForm.addEventListener("submit", () => {
      if (pageInput) pageInput.value = window.location.pathname;

      if (mailingBtn) {
        mailingBtn.disabled = true;
        mailingBtn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert("Thank you. You have been added to our mailing list.");
        mailingForm.reset();

        if (mailingBtn) {
          mailingBtn.disabled = false;
          mailingBtn.textContent = "Submit";
        }
      }, 1200);
    });
  }

  // =========================
  // Signup Form
  // =========================
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    const btn = document.getElementById("signupSubmitBtn");
    const hiddenAge = document.getElementById("ageGroupCombined");

    signupForm.addEventListener("submit", () => {
      const checked = Array.from(signupForm.querySelectorAll('input[name="ageGroup"]:checked')).map(
        (cb) => cb.value
      );

      if (hiddenAge) hiddenAge.value = checked.join(", ");

      if (btn) {
        btn.disabled = true;
        btn.textContent = "Submitting...";
      }

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
  }

  // =========================
  // Celebration Form
  // =========================
  const celebrationForm = document.getElementById("celebrationForm");
  const celebrationBtn = document.getElementById("celebrationSubmitBtn");

  if (celebrationForm) {
    celebrationForm.addEventListener("submit", () => {
      if (celebrationBtn) {
        celebrationBtn.disabled = true;
        celebrationBtn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert("Thank you. Your celebration request has been received.");
        celebrationForm.reset();

        if (celebrationBtn) {
          celebrationBtn.disabled = false;
          celebrationBtn.textContent = "Submit";
        }
      }, 1200);
    });
  }

  // =========================
  // Contact Form
  // =========================
  const contactForm = document.getElementById("contactForm");
  const contactBtn = document.getElementById("contactSubmitBtn");

  if (contactForm) {
    contactForm.addEventListener("submit", () => {
      if (contactBtn) {
        contactBtn.disabled = true;
        contactBtn.textContent = "Submitting...";
      }

      setTimeout(() => {
        alert("Thank you. Your message has been received. We will get back to you shortly.");
        contactForm.reset();

        if (contactBtn) {
          contactBtn.disabled = false;
          contactBtn.textContent = "Submit";
        }
      }, 1200);
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
    headers: { "Content-Type": "text/plain;charset=utf-8" },
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