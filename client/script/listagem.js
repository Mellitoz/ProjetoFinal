document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000';

    // --- ESTADO DA PAGINAÇÃO ---
    const paginacaoConfig = {
        itens: {
            todos: [],
            paginaAtual: 1,
            porPagina: 10,
            containerTabela: document.getElementById('tabelaItens'),
            containerPaginacao: document.getElementById('paginacao-itens')
        },
        comandas: {
            todos: [],
            paginaAtual: 1,
            porPagina: 10,
            containerTabela: document.getElementById('tabelaComandas'),
            containerPaginacao: document.getElementById('paginacao-comandas')
        }
    };

    /**
     * Função genérica para buscar dados da API.
     * @param {string} endpoint - O endpoint da API (ex: 'itens' ou 'comandas').
     * @param {string} tipo - A chave de configuração em paginacaoConfig (ex: 'itens').
     */
    async function carregarDados(endpoint, tipo) {
        try {
            const res = await fetch(`${BASE_URL}/${endpoint}`);
            const dados = await res.json();
            paginacaoConfig[tipo].todos = dados;
            paginacaoConfig[tipo].paginaAtual = 1;
            renderizar(tipo);
        } catch (err) {
            console.error(`Erro ao buscar ${endpoint}:`, err);
            alert(`Não foi possível carregar os dados de ${endpoint}.`);
        }
    }
    
    /**
     * Função genérica para renderizar uma tabela e seus controles de paginação.
     * @param {string} tipo - A chave de configuração (ex: 'itens').
     */
    function renderizar(tipo) {
        const config = paginacaoConfig[tipo];
        const { todos, paginaAtual, porPagina, containerTabela, containerPaginacao } = config;

        const inicio = (paginaAtual - 1) * porPagina;
        const fim = inicio + porPagina;
        const dadosDaPagina = todos.slice(inicio, fim);
        
        containerTabela.innerHTML = ''; // Limpa a tabela

        if (dadosDaPagina.length === 0) {
            const colunas = tipo === 'itens' ? 3 : 3;
            containerTabela.innerHTML = `<tr><td colspan="${colunas}" style="text-align: center;">Nenhum registro encontrado.</td></tr>`;
        } else {
            dadosDaPagina.forEach(dado => {
                const tr = document.createElement('tr');
                if (tipo === 'itens') {
                    tr.innerHTML = `
                        <td>${dado.nome}</td>
                        <td>${dado.tipo}</td>
                        <td>R$ ${dado.preco.toFixed(2).replace('.', ',')}</td>`;
                } else { // comandas
                    const dataFormatada = dado.data ? new Date(dado.data._seconds * 1000).toLocaleDateString('pt-BR') : 'N/A';
                    tr.innerHTML = `
                        <td>${dado.numeroComanda}</td>
                        <td>${dataFormatada}</td>
                        <td>R$ ${dado.valorTotal.toFixed(2).replace('.', ',')}</td>`;
                }
                containerTabela.appendChild(tr);
            });
        }
        
        renderizarPaginacao(tipo);
    }
    
    /**
     * Cria os botões de paginação.
     * @param {string} tipo - A chave de configuração (ex: 'itens').
     */
    function renderizarPaginacao(tipo) {
        const config = paginacaoConfig[tipo];
        const { todos, paginaAtual, porPagina, containerPaginacao } = config;

        containerPaginacao.innerHTML = '';
        const totalPaginas = Math.ceil(todos.length / porPagina);

        if (totalPaginas <= 1) return;

        for (let i = 1; i <= totalPaginas; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            if (i === paginaAtual) {
                btn.classList.add('active'); // Você pode estilizar isso no CSS
                btn.disabled = true;
            }
            btn.addEventListener('click', () => {
                config.paginaAtual = i;
                renderizar(tipo);
            });
            containerPaginacao.appendChild(btn);
        }
    }

    // --- INICIALIZAÇÃO ---
    carregarDados('itens', 'itens');
    carregarDados('comandas', 'comandas');
});
