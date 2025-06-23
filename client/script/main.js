/**
 * Adiciona a funcionalidade de abrir e fechar a sidebar em todas as páginas
 * que a utilizam.
 */
document.addEventListener('DOMContentLoaded', () => {
    const menuIcon = document.querySelector('.menu-icon');
    const overlay = document.getElementById('overlay');

    if (menuIcon) {
        menuIcon.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
});

/**
 * Alterna a visibilidade da sidebar e do overlay.
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (sidebar && overlay) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}
