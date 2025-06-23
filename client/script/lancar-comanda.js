document.addEventListener('DOMContentLoaded', () => {
    let precoKgGlobal = 0;
    let listaItens = [];
    const BASE_URL = 'http://localhost:3000';

    // --- ELEMENTOS DO DOM ---
    const pesoTotalInput = document.getElementById('pesoTotal');
    const pesoTaraInput = document.getElementById('pesoPratoTara');
    const pesoCalculadoInput = document.getElementById('pesoCalculado');
    const valorPratoInput = document.getElementById('valorPrato');
    const valorTotalInput = document.getElementById('valorTotal');
    const adicionarItemBtn = document.getElementById('adicionarItemBtn');
    const itensExtrasContainer = document.getElementById('itensExtrasContainer');
    const comandaForm = document.getElementById('comandaForm');

    // --- LÓGICA DE CÁLCULO ---
    function calcularValorPrato() {
        const pesoTotal = parseFloat(pesoTotalInput.value.replace(',', '.')) || 0;
        const pesoTara = parseFloat(pesoTaraInput.value.replace(',', '.')) || 0;

        let pesoLiquido = pesoTotal - pesoTara;
        if (pesoLiquido < 0) {
            pesoLiquido = 0;
        }
        
        pesoCalculadoInput.value = pesoLiquido.toFixed(3);
        const valorPrato = precoKgGlobal * pesoLiquido;
        valorPratoInput.value = valorPrato.toFixed(2).replace('.', ',');
        
        calcularTotalGeral();
    }

    function calcularTotalGeral() {
        const valorPrato = parseFloat(valorPratoInput.value.replace(',', '.')) || 0;
        let totalExtras = 0;
        document.querySelectorAll('.item-extra-row .itemPreco').forEach(precoEl => {
            totalExtras += parseFloat(precoEl.value.replace(',', '.')) || 0;
        });
        const total = valorPrato + totalExtras;
        valorTotalInput.value = total.toFixed(2).replace('.', ',');
    }

    // --- CARREGAMENTO DE DADOS (API) ---
    async function carregarDadosIniciais() {
        try {
            const [resKg, resItens] = await Promise.all([
                fetch(`${BASE_URL}/quilo`),
                fetch(`${BASE_URL}/itens`)
            ]);

            const dataKg = await resKg.json();
            precoKgGlobal = parseFloat(dataKg.precoKg) || 0;
            document.getElementById('precoKg').value = precoKgGlobal.toFixed(2).replace('.', ',');
            
            listaItens = await resItens.json();

            // Adiciona a primeira linha de item extra ao carregar
            adicionarLinhaItemExtra();

        } catch (err) {
            alert('Erro ao carregar dados iniciais (Preço/KG e Itens). Verifique o servidor e a configuração.');
            console.error(err);
        }
    }

    function preencherSelectItens(selectElement) {
        selectElement.innerHTML = '<option value="">Selecione um item</option>'; // Limpa e adiciona a opção padrão
        listaItens.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id; // Usar ID para buscar o preço
            option.textContent = item.nome;
            option.dataset.preco = item.preco; // Armazenar o preço no dataset
            selectElement.appendChild(option);
        });
    }
    
    // --- MANIPULAÇÃO DE ITENS EXTRAS ---
    function adicionarLinhaItemExtra() {
        const row = document.createElement('div');
        row.className = 'row item-extra-row';
        row.innerHTML = `
            <select class="itemSelect" style="flex: 2;"></select>
            <input type="text" class="itemPreco" placeholder="Valor (R$)" readonly style="flex: 1;" />
            <button type="button" class="removerItemBtn" style="background-color: #dc3545; color: white; padding: 0 12px;">X</button>
        `;
        const newSelect = row.querySelector('.itemSelect');
        preencherSelectItens(newSelect);
        itensExtrasContainer.appendChild(row);
    }
    
    // --- EVENTOS ---
    pesoTotalInput.addEventListener('input', calcularValorPrato);
    pesoTaraInput.addEventListener('input', calcularValorPrato);
    adicionarItemBtn.addEventListener('click', adicionarLinhaItemExtra);

    itensExtrasContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('itemSelect')) {
            const select = e.target;
            const precoInput = select.closest('.item-extra-row').querySelector('.itemPreco');
            const selectedOption = select.options[select.selectedIndex];
            
            if (selectedOption && selectedOption.dataset.preco) {
                precoInput.value = parseFloat(selectedOption.dataset.preco).toFixed(2).replace('.', ',');
            } else {
                precoInput.value = '';
            }
            calcularTotalGeral();
        }
    });
    
    itensExtrasContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('removerItemBtn')) {
            e.target.closest('.item-extra-row').remove();
            calcularTotalGeral();
        }
    });

    comandaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const numeroComanda = document.getElementById('numero').value;
        const pesoCalculado = parseFloat(pesoCalculadoInput.value) || 0;

        if (!numeroComanda) {
            alert("Por favor, insira o número da comanda.");
            return;
        }
        if (pesoCalculado <= 0) {
            alert("O peso da comida não pode ser zero ou negativo. Verifique os valores de peso.");
            return;
        }

        const extras = [];
        document.querySelectorAll('.item-extra-row').forEach(row => {
            const select = row.querySelector('.itemSelect');
            const selectedOption = select.options[select.selectedIndex];
            if (select.value && selectedOption) {
                extras.push({
                    nome: selectedOption.textContent,
                    valor: parseFloat(selectedOption.dataset.preco) || 0
                });
            }
        });
        
        const payload = {
            numeroComanda: numeroComanda,
            precoKg: precoKgGlobal,
            peso: pesoCalculado,
            valorPrato: parseFloat(valorPratoInput.value.replace(',', '.')) || 0,
            extras: extras,
            valorTotal: parseFloat(valorTotalInput.value.replace(',', '.')) || 0
        };
        
        try {
            const res = await fetch(`${BASE_URL}/comandas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                alert('Comanda registrada com sucesso!');
                location.reload();
            } else {
                alert(`Erro: ${data.message || 'Não foi possível registrar a comanda.'}`);
            }
        } catch (err) {
            alert('Falha de comunicação com o servidor.');
            console.error(err);
        }
    });

    // --- INICIALIZAÇÃO ---
    carregarDadosIniciais();
});
