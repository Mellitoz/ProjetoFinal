document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000';
    
    // --- ELEMENTOS DO DOM ---
    const itemForm = document.getElementById('itemForm');
    const itemIdInput = document.getElementById('itemId');
    const nomeInput = document.getElementById('nome');
    const tipoSelect = document.getElementById('tipo');
    const precoInput = document.getElementById('preco');
    const botaoSubmit = document.getElementById('botaoSubmit');
    const tabelaItensBody = document.getElementById('tabelaItens');
    const btnAnterior = document.getElementById('anterior');
    const btnProxima = document.getElementById('proxima');
    const infoPaginaSpan = document.getElementById('infoPagina');

    // --- ESTADO DA APLICAÇÃO ---
    let todosItens = [];
    let paginaAtual = 1;
    const itensPorPagina = 10;

    // --- FUNÇÕES DE API ---
    async function carregarItensDaAPI() {
        try {
            const res = await fetch(`${BASE_URL}/itens`);
            todosItens = await res.json();
            todosItens.sort((a, b) => a.nome.localeCompare(b.nome)); // Ordena alfabeticamente
            paginaAtual = 1; // Reseta para a primeira página
            renderizarTabela();
        } catch (err) {
            alert('Erro ao carregar os itens.');
            console.error(err);
        }
    }

    async function salvarItem(payload) {
        const id = itemIdInput.value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${BASE_URL}/itens/${id}` : `${BASE_URL}/itens`;

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(`Item ${id ? 'atualizado' : 'cadastrado'} com sucesso!`);
                resetarFormulario();
                carregarItensDaAPI();
            } else {
                const data = await res.json();
                alert(data.message || `Erro ao ${id ? 'atualizar' : 'cadastrar'} o item.`);
            }
        } catch (error) {
            alert('Erro de comunicação com o servidor.');
            console.error(error);
        }
    }

    async function excluirItemDaAPI(id) {
        if (confirm('Deseja realmente excluir este item?')) {
            try {
                await fetch(`${BASE_URL}/itens/${id}`, { method: 'DELETE' });
                alert('Item excluído com sucesso!');
                carregarItensDaAPI();
            } catch(err) {
                alert('Erro ao excluir o item.');
                console.error(err);
            }
        }
    }

    // --- MANIPULAÇÃO DO DOM E RENDERIZAÇÃO ---
    function renderizarTabela() {
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const itensDaPagina = todosItens.slice(inicio, fim);

        tabelaItensBody.innerHTML = ''; // Limpa a tabela

        if (itensDaPagina.length === 0) {
            tabelaItensBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Nenhum item cadastrado.</td></tr>`;
        } else {
            itensDaPagina.forEach(item => {
                const precoFormatado = (item.preco || 0).toFixed(2).replace('.', ',');
                tabelaItensBody.innerHTML += `
                    <tr>
                        <td>${item.nome}</td>
                        <td>${item.tipo}</td>
                        <td>R$ ${precoFormatado}</td>
                        <td style="text-align: right;">
                            <button class="editar" data-id="${item.id}">Editar</button>
                            <button class="excluir" data-id="${item.id}">Excluir</button>
                        </td>
                    </tr>`;
            });
        }
        atualizarControlesPaginacao();
    }
    
    function preencherFormularioParaEdicao(id) {
        const item = todosItens.find(i => i.id === id);
        if (item) {
            itemIdInput.value = item.id;
            nomeInput.value = item.nome;
            tipoSelect.value = item.tipo;
            precoInput.value = item.preco;
            botaoSubmit.textContent = "Atualizar Item";
            window.scrollTo(0, 0); // Rola a página para o topo para ver o formulário
        }
    }
    
    function resetarFormulario() {
        itemForm.reset();
        itemIdInput.value = '';
        botaoSubmit.textContent = "Cadastrar Item";
    }

    // --- PAGINAÇÃO ---
    function atualizarControlesPaginacao() {
        const totalPaginas = Math.ceil(todosItens.length / itensPorPagina) || 1;
        infoPaginaSpan.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
        btnAnterior.disabled = paginaAtual === 1;
        btnProxima.disabled = paginaAtual === totalPaginas;
    }

    function irParaPaginaAnterior() {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarTabela();
        }
    }

    function irParaPaginaProxima() {
        const totalPaginas = Math.ceil(todosItens.length / itensPorPagina);
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderizarTabela();
        }
    }

    // --- EVENTOS ---
    itemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const payload = {
            nome: nomeInput.value,
            tipo: tipoSelect.value,
            preco: parseFloat(precoInput.value)
        };
        salvarItem(payload);
    });

    tabelaItensBody.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('editar')) {
            preencherFormularioParaEdicao(target.dataset.id);
        }
        if (target.classList.contains('excluir')) {
            excluirItemDaAPI(target.dataset.id);
        }
    });
    
    btnAnterior.addEventListener('click', irParaPaginaAnterior);
    btnProxima.addEventListener('click', irParaPaginaProxima);

    // --- INICIALIZAÇÃO ---
    carregarItensDaAPI();
});
