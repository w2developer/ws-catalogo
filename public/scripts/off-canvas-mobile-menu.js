const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.off-canvas-mobile-menu');
const menuIcon = document.querySelector('.menu-toggle i');

const closeMenu = () => {
    mobileMenu.classList.remove('active');
    menuIcon.classList.replace('ri-close-line', 'ri-menu-line');
};

menuToggle.addEventListener('click', (e) => {
    e.stopPropagation(); 
    
    mobileMenu.classList.toggle('active');

    if (mobileMenu.classList.contains('active')) {
        menuIcon.classList.replace('ri-menu-line', 'ri-close-line');
    } else {
        menuIcon.classList.replace('ri-close-line', 'ri-menu-line');
    }
});

const navLinks = document.querySelectorAll('.off-canvas-mobile-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

document.addEventListener('click', (e) => {
    const isClickInsideMenu = mobileMenu.contains(e.target);
    const isClickOnButton = menuToggle.contains(e.target);

    if (!isClickInsideMenu && !isClickOnButton && mobileMenu.classList.contains('active')) {
        closeMenu();
    }
});