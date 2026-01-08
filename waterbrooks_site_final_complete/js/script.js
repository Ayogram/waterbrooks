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
});