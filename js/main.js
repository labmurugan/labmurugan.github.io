// Add a small animation to the navigation menu
document.addEventListener('DOMContentLoaded', function() {
    const menuItems = document.querySelectorAll('.menu li');
    
    menuItems.forEach((item, index) => {
        item.style.opacity = 0;
        setTimeout(() => {
            item.style.transition = 'opacity 0.3s ease';
            item.style.opacity = 1;
        }, 100 * index);
    });
    
    // Add active class to current page in navigation
    const currentPath = window.location.pathname;
    const links = document.querySelectorAll('.menu a');
    
    links.forEach(link => {
        const linkPath = link.getAttribute('href');
        
        // Check if the current path includes the link path
        // or if both are home pages
        if ((currentPath.includes(linkPath) && linkPath !== '/') || 
            (currentPath === '/' && linkPath === '/') ||
            (currentPath.endsWith('index.html') && linkPath === '/')) {
            link.parentElement.classList.add('active');
        }
    });
});

// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    
    if (menuToggle && menu) {
        menuToggle.addEventListener('click', function() {
            menu.classList.toggle('active');
        });
        
        // Close menu when a link is clicked
        const menuLinks = document.querySelectorAll('.menu a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                menu.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
                menu.classList.remove('active');
            }
        });
    }
}); 