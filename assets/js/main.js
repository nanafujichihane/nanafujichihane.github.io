const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.site-nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'CLOSE':'MENU';});}

// 画像の右クリックを抑止
document.addEventListener("contextmenu", (event) => {
  if (event.target.closest(".hero-art, .art-placeholder, .costume-grid")) {
    event.preventDefault();
  }
});
