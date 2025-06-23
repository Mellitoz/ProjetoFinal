// cypress/e2e/full-flow.cy.js

describe('Fluxo Completo do Atendente', () => {
    
    const novoItem = {
        nome: `Suco de Laranja Teste ${Date.now()}`,
        tipo: 'Bebida',
        preco: '7.50'
    };
    const precoKg = '55.90';
    const numeroComanda = Math.floor(Math.random() * 900) + 100;

    // Função auxiliar que navega pelas páginas até encontrar o texto desejado
    const findInTable = (textToFind) => {
        cy.get('body').then($body => {
            if ($body.find(`td:contains("${textToFind}")`).length) {
                cy.contains('td', textToFind).should('be.visible');
                return;
            }

            if ($body.find('#proxima:not(:disabled)').length) {
                cy.get('#proxima').click();
                findInTable(textToFind); 
            } else {
                throw new Error(`Texto "${textToFind}" não encontrado em nenhuma página.`);
            }
        });
    };

    before(() => {
        cy.visit('/pages/login.html');
        cy.get('#usuario').type('atendente');
        cy.get('#senha').type('senha123');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/pages/lancar-comanda.html');
    });

    it('Deve definir o preço do quilo', () => {
        cy.visit('/pages/cadastro-quilo.html');
        cy.get('#precoKg').clear().type(precoKg);
        cy.get('button[type="submit"]').click();
        cy.get('#precoKg').should('have.value', precoKg);
    });

    it('Deve cadastrar um novo item', () => {
        cy.intercept('POST', '**/itens').as('createItem');
        cy.intercept('GET', '**/itens').as('getItems');
        
        cy.visit('/pages/cadastro-item.html');
        cy.wait('@getItems');
        
        cy.get('#nome').type(novoItem.nome);
        cy.get('#tipo').select(novoItem.tipo);
        cy.get('#preco').type(novoItem.preco);
        cy.get('button[type="submit"]').click();

        cy.wait('@createItem');
        cy.wait('@getItems');

        findInTable(novoItem.nome);
    });

    it('Deve lançar uma nova comanda com o item extra', () => {
        cy.intercept('GET', '**/quilo').as('getQuilo');
        cy.intercept('POST', '**/comandas').as('createComanda');

        cy.visit('/pages/lancar-comanda.html');
        
        cy.wait('@getQuilo');
        cy.get('#precoKg').should('have.value', precoKg.replace('.', ','));

        cy.get('#numero').type(numeroComanda);
        cy.get('#pesoTotal').type('0.850');
        cy.get('#pesoPratoTara').type('0.350');

        cy.get('.itemSelect').last().select(novoItem.nome);

        const valorEsperadoPrato = (0.500 * parseFloat(precoKg)).toFixed(2).replace('.', ',');
        const valorEsperadoTotal = ((0.500 * parseFloat(precoKg)) + parseFloat(novoItem.preco)).toFixed(2).replace('.', ',');
        cy.get('#valorPrato').should('have.value', valorEsperadoPrato);
        cy.get('#valorTotal').should('have.value', valorEsperadoTotal);

        cy.get('button[type="submit"]').click();
        cy.wait('@createComanda');
    });
    
    it('Deve pagar a comanda e depois excluir o item de teste', () => {
        cy.intercept('GET', `**/comandas/${numeroComanda}`).as('getComanda');
        cy.intercept('DELETE', '**/itens/**').as('deleteItem');
        cy.intercept('GET', '**/itens').as('getItems');

        cy.visit('/pages/pagar-comanda.html');
        
        cy.get('#numeroComandaBusca').type(numeroComanda);
        cy.get('#buscarForm button').click();
        cy.wait('@getComanda');
        
        cy.contains('#listaItensComanda li', novoItem.nome).should('be.visible');
        cy.get('#btnFinalizarPagamento').click();
        
        // Limpeza: Excluir o item criado
        cy.visit('/pages/cadastro-item.html');
        cy.wait('@getItems');
        
        findInTable(novoItem.nome);
        
        cy.contains('td', novoItem.nome)
          .parent('tr')
          .find('.excluir')
          .click();
        
        // CORREÇÃO: Espera explicitamente pela conclusão do pedido DELETE
        cy.wait('@deleteItem'); 
        
        cy.contains('td', novoItem.nome).should('not.exist');
    });
});
