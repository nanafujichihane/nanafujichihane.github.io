
const lightbox = document.querySelector('#costume-lightbox');

if (lightbox) {
  const content = lightbox.querySelector('.lightbox-content');

  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    content.replaceChildren();
    document.body.style.overflow = '';
  };

  const open = (item) => {
    const copy = item.cloneNode(true);
    copy.classList.remove('zoomable');
    copy.removeAttribute('role');
    copy.removeAttribute('tabindex');
    copy.removeAttribute('aria-label');

    content.replaceChildren(copy);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = '';
    document.body.style.overflow = 'hidden';
  };

  document.querySelectorAll('.zoomable').forEach(item => {
    item.addEventListener('click', (event) => {
      if (event.target.closest('.costume-switcher button')) return;
      open(item);
    });

    item.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(item);
      }
    });
  });

  // COSTUME 05の差分切り替え
  const setupSwitcher = (switcher) => {
    const img = switcher.querySelector('img');
    const images = img.dataset.images.split(',');
    let current = images.indexOf(img.getAttribute('src'));

    if (current < 0) current = 0;

    const changeImage = (direction) => {
      current = (current + direction + images.length) % images.length;
      img.src = images[current];
    };

    switcher.querySelector('.costume-prev').addEventListener('click', event => {
      event.stopPropagation();
      changeImage(-1);
    });

    switcher.querySelector('.costume-next').addEventListener('click', event => {
      event.stopPropagation();
      changeImage(1);
    });
  };

  document.querySelectorAll('.costume-switcher').forEach(setupSwitcher);

  // 拡大表示側の差分切り替え
  const observer = new MutationObserver(() => {
    const switcher = content.querySelector('.costume-switcher');
    if (switcher && !switcher.dataset.lightboxReady) {
      switcher.dataset.lightboxReady = 'true';
      setupSwitcher(switcher);
    }
  });

  observer.observe(content, { childList: true, subtree: true });

  lightbox.querySelector('.lightbox-close').addEventListener('click', close);

  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) {
      close();
    }
  });
}
