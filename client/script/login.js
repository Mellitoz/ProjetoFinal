document.addEventListener('DOMContentLoaded', () => {
    const usuariosValidos = [
        { usuario: "atendente", senha: "senha123" }
    ];

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const usuarioDigitado = document.getElementById("usuario").value.trim().toLowerCase();
            const senhaDigitada = document.getElementById("senha").value.trim();

            const usuarioValido = usuariosValidos.find(u =>
                u.usuario.toLowerCase() === usuarioDigitado && u.senha === senhaDigitada
            );

            if (usuarioValido) {
                // Redireciona para a tela principal ou de lançamento de comanda
                window.location.href = "lancar-comanda.html";
            } else {
                alert("Login Incorreto... Tente novamente!");
            }
        });
    }
});
