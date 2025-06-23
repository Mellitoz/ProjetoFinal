document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000';
    
    // --- ELEMENTOS DO DOM ---
    const buscarForm = document.getElementById('buscarForm');
    const numeroComandaInput = document.getElementById('numeroComandaBusca');
    const detalhesComandaDiv = document.getElementById('detalhesComanda');
    const listaItensUl = document.getElementById('listaItensComanda');
    const totalValorSpan = document.getElementById('totalValor');
    const btnFinalizar = document.getElementById('btnFinalizarPagamento');

    // --- ESTADO ---
    let comandaAtual = null;

    // --- FUNÇÕES ---

    /**
     * Busca uma comanda específica pelo número.
     */
    async function buscarComanda(e) {
        e.preventDefault();
        const numero = numeroComandaInput.value.trim();
        if (!numero) {
            alert('Digite um número de comanda para buscar.');
            return;
        }

        try {
            // A API precisa retornar um ID único para cada comanda para a exclusão funcionar.
            // O endpoint /comandas/:numeroComanda busca pelo número.
            const res = await fetch(`${BASE_URL}/comandas/${numero}`);
            
            if (!res.ok) {
                if(res.status === 404){
                    alert('Comanda não encontrada.');
                } else {
                    alert('Erro ao buscar a comanda.');
                }
                resetarVisualizacao();
                return;
            }
            
            comandaAtual = await res.json();
            exibirDetalhesComanda();

        } catch (err) {
            console.error(err);
            alert('Erro de comunicação com o servidor.');
            resetarVisualizacao();
        }
    }

    /**
     * Exibe os detalhes da comanda encontrada na tela.
     */
    function exibirDetalhesComanda() {
        if (!comandaAtual) return;

        listaItensUl.innerHTML = ''; // Limpa a lista anterior

        // Adiciona o valor do prato principal
        if (comandaAtual.valorPrato > 0) {
            const pratoLi = document.createElement('li');
            pratoLi.textContent = `Prato (peso ${comandaAtual.peso.toFixed(3)}kg): R$ ${comandaAtual.valorPrato.toFixed(2)}`;
            listaItensUl.appendChild(pratoLi);
        }

        // Adiciona os itens extras
        if (Array.isArray(comandaAtual.extras)) {
            comandaAtual.extras.forEach(item => {
                const itemLi = document.createElement('li');
                itemLi.textContent = `${item.nome}: R$ ${item.valor.toFixed(2)}`;
                listaItensUl.appendChild(itemLi);
            });
        }
        
        totalValorSpan.textContent = comandaAtual.valorTotal.toFixed(2).replace('.', ',');
        detalhesComandaDiv.style.display = 'block';
    }

    /**
     * Limpa a tela de detalhes.
     */
    function resetarVisualizacao() {
        comandaAtual = null;
        detalhesComandaDiv.style.display = 'none';
        listaItensUl.innerHTML = '';
        totalValorSpan.textContent = '0.00';
    }
    
    /**
     * Finaliza o pagamento, excluindo a comanda do banco de dados.
     */
    async function finalizarPagamento() {
        if (!comandaAtual || !comandaAtual.id) {
            alert('Nenhuma comanda válida selecionada para pagamento.');
            return;
        }

        if (confirm(`Confirmar pagamento de R$ ${comandaAtual.valorTotal.toFixed(2)} e apagar comanda?`)) {
            try {
                // A exclusão DEVE ser pelo ID único do documento, não pelo número da comanda.
                const res = await fetch(`${BASE_URL}/comandas/${comandaAtual.id}`, {
                    method: 'DELETE',
                });

                if (!res.ok) {
                    throw new Error('Servidor retornou um erro ao tentar apagar a comanda.');
                }

                alert('Pagamento registrado e comanda apagada com sucesso!');
                buscarForm.reset();
                resetarVisualizacao();

            } catch (err) {
                console.error(err);
                alert('Erro ao finalizar o pagamento.');
            }
        }
    }

    // --- EVENTOS ---
    buscarForm.addEventListener('submit', buscarComanda);
    btnFinalizar.addEventListener('click', finalizarPagamento);
});
