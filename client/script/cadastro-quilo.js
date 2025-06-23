document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'http://localhost:3000';
    const quiloForm = document.getElementById('quiloForm');
    const precoKgInput = document.getElementById('precoKg');

    /**
     * Carrega o preço do KG que está salvo no servidor e o exibe no input.
     */
    async function carregarPrecoAtual() {
        try {
            const res = await fetch(`${BASE_URL}/quilo`);
            if (!res.ok) throw new Error('Resposta do servidor não foi OK.');
            
            const data = await res.json();
            if (data && typeof data.precoKg === 'number') {
                // Formata para o padrão brasileiro para exibição, se desejado
                precoKgInput.value = data.precoKg.toFixed(2);
            }
        } catch (err) {
            alert('Erro ao carregar o preço atual do kg.');
            console.error('Erro ao carregar preço:', err);
        }
    }

    /**
     * Envia o novo preço do KG para o servidor.
     */
    async function salvarPrecoKg(e) {
        e.preventDefault();
        
        const precoKgValue = precoKgInput.value.trim().replace(',', '.');
        const precoKg = parseFloat(precoKgValue);

        if (isNaN(precoKg) || precoKg <= 0) {
            alert('Por favor, digite um valor numérico válido para o preço do kg!');
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/quilo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ precoKg })
            });

            if (res.ok) {
                alert('Preço do kg atualizado com sucesso!');
            } else {
                const data = await res.json();
                alert(data.message || 'Ocorreu um erro ao atualizar o preço do kg.');
            }
        } catch (err) {
            alert('Erro de comunicação com o servidor.');
            console.error('Erro no envio:', err);
        }
    }

    // Adiciona o listener ao formulário
    if (quiloForm) {
        quiloForm.addEventListener('submit', salvarPrecoKg);
    }
    
    // Carrega o preço assim que a página é aberta
    carregarPrecoAtual();
});
