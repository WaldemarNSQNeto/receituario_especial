document.addEventListener('DOMContentLoaded', () => {
    
    // Seletores dos elementos principais
    const medList = document.getElementById('medication-list');
    const template = document.getElementById('medication-template');
    const addItemBtn = document.getElementById('add-item-btn');
    const addDateBtn = document.getElementById('add-date-btn');
    const dateOptionsContainer = document.getElementById('date-options-container');
    const dateTodayBtn = document.getElementById('date-today-btn');
    const dateOtherBtn = document.getElementById('date-other-btn');
    const customDateInput = document.getElementById('custom-date-input');
    const generateBtn = document.getElementById('generate-doc-btn');
    const resetBtn = document.getElementById('reset-btn');

    // Variável para controlar o estado do botão "Datar" (ON/OFF)
    let isDateEnabled = false;
    // Variável para armazenar a data selecionada
    let selectedDate = null;
    let dateSelectionMode = null; // 'today' ou 'custom'

    // Função para adicionar um novo item
    function addNewItem() {
        const medItems = medList.querySelectorAll('.medication-item');
        const currentItemCount = medItems.length;

        // REGRA 1: Limite máximo geral de 4 medicamentos.
        if (currentItemCount >= 4) {
            alert('Você pode adicionar no máximo 4 medicamentos por receita.');
            return; // Impede a adição de um novo item
        }

        // REGRA 2: Se já existem 3 medicamentos com 3 vias diferentes, o limite é 3.
        if (currentItemCount === 3) {
            const vias = new Set();
            medItems.forEach(item => {
                vias.add(item.querySelector('.med-via').value);
            });
            if (vias.size === 3) {
                alert('Com 3 vias de administração diferentes, o limite é de 3 medicamentos por receita.');
                return;
            }
        }

        // REGRA 3: Se algum medicamento tiver uma forma de utilização longa (duas linhas), o limite é 3.
        if (currentItemCount === 3) {
            let longUsageExists = false;
            medItems.forEach(item => {
                const usageLength = item.querySelector('.med-usage').value.length;
                if (usageLength > 65) { // Limite de caracteres que aproxima duas linhas
                    longUsageExists = true;
                }
            });
            if (longUsageExists) {
                alert('Com uma "Forma de Utilização" longa, o limite é de 3 medicamentos por receita.');
                return;
            }
        }

        const clone = template.content.cloneNode(true);
        const medItem = clone.querySelector('.medication-item');
        
        // Adiciona o evento de remoção ao botão 'X' do novo item
        const removeBtn = medItem.querySelector('.remove-item-btn');
        removeBtn.addEventListener('click', () => {
            medItem.remove();
        });
        
        // --- INÍCIO DA NOVA REGRA ---
        // Seleciona os campos do novo item
        const itemInput = medItem.querySelector('.med-item');
        const posologyInput = medItem.querySelector('.med-posology');
        const quantityInput = medItem.querySelector('.med-quantity');

        // Função para verificar o comprimento e aplicar a regra
        const checkLengthAndApplyRule = () => {
            const combinedLength = itemInput.value.length + posologyInput.value.length;

            if (combinedLength > 46) {
                quantityInput.setAttribute('maxlength', '5');
                quantityInput.parentElement.classList.add('qnt-limited'); // Adiciona a classe para ativar o tooltip
                // Se o valor atual já for maior, trunca para 5 caracteres
                if (quantityInput.value.length > 5) {
                    quantityInput.value = quantityInput.value.slice(0, 5);
                }
            } else {
                quantityInput.removeAttribute('maxlength');
                quantityInput.parentElement.classList.remove('qnt-limited'); // Remove a classe
            }
        };

        // Adiciona os ouvintes para acionar a verificação ao digitar
        itemInput.addEventListener('input', checkLengthAndApplyRule);
        posologyInput.addEventListener('input', checkLengthAndApplyRule);
        // --- FIM DA NOVA REGRA ---

        medList.appendChild(medItem);
    }

    // Função principal: Gerar o documento
    // Função para criar uma via da receita (componente reutilizável)
function createViaComponent(patient, buyer, groupedMeds, date) {
    const template = document.getElementById('via-template');
    const clone = template.content.cloneNode(true);
    
    // Preenche os dados do paciente
    const patientNameEl = clone.querySelector('.print-patient-name');
    const patientAddressEl = clone.querySelector('.print-patient-address');
    
    if (patient.name) {
        patientNameEl.textContent = patient.name;
        patientAddressEl.textContent = patient.address;
    } else {
        patientNameEl.textContent = '__________________________________________________________';
        patientAddressEl.textContent = '_________________________________________________________';
    }
    
    // Preenche os dados do comprador
    clone.querySelector('.print-comprador-nome').textContent = buyer.name || '_______________________________';
    clone.querySelector('.print-comprador-rg').textContent = buyer.rg || '_________________';
    clone.querySelector('.print-comprador-orgao').textContent = buyer.issuer || '______';
    
    // Preenche a data
    const dateEl = clone.querySelector('.print-date-text');
    if (date) {
        dateEl.textContent = date;
        dateEl.classList.add('has-extended-underline');
    } else {
        dateEl.textContent = '____/____/_______';
        dateEl.classList.remove('has-extended-underline');
    }
    
    // Preenche a lista de medicamentos
    const printList = clone.querySelector('.print-med-list');
    let medCounter = 1;
    
    groupedMeds.forEach((meds, via) => {
        // Adiciona o título da via
        const viaTitle = document.createElement('div');
        viaTitle.className = 'print-via-title';
        viaTitle.textContent = `USO ${via}`;
        printList.appendChild(viaTitle);
        
        // Adiciona os medicamentos desse grupo
        meds.forEach(med => {
            const medLi = document.createElement('li');
            medLi.setAttribute('data-counter', medCounter++);
            
            const medContent = document.createElement('div');
            medContent.className = 'med-line';
            
            const medMainText = [`<strong>${med.item || 'N/A'}</strong>`, `<strong>${med.posologia}</strong>`].filter(Boolean).join(' ');
            medContent.innerHTML = `<span class="med-main">${medMainText}</span><span class="med-filler"></span><span class="med-quantity">${med.qnt || 'N/A'}</span>`;
            medLi.appendChild(medContent);
            
            if (med.uso) {
                const usageDiv = document.createElement('div');
                usageDiv.className = 'usage-details';
                usageDiv.textContent = `${med.uso}`;
                medLi.appendChild(usageDiv);
            }
            
            printList.appendChild(medLi);
        });
    });
    
    return clone;
}

// Função principal: Gerar o documento (AGORA OTIMIZADA)
function generateDocument() {
    // 1. Coletar dados
    const patientName = document.getElementById('patient-name').value;
    const patientAddress = document.getElementById('patient-address').value;
    const compradorNome = document.getElementById('comprador-nome').value;
    const compradorRg = document.getElementById('comprador-rg').value;
    const compradorOrgao = document.getElementById('comprador-orgao').value;
    
    const patient = { name: patientName, address: patientAddress };
    const buyer = { name: compradorNome, rg: compradorRg, issuer: compradorOrgao };
    
    // 2. Coletar e agrupar medicamentos
    const items = [];
    const medItems = document.querySelectorAll('.medication-item');
    
    medItems.forEach(item => {
        items.push({
            via: item.querySelector('.med-via').value,
            item: item.querySelector('.med-item').value,
            posologia: item.querySelector('.med-posology').value,
            qnt: item.querySelector('.med-quantity').value,
            uso: item.querySelector('.med-usage').value
        });
    });
    
    // Agrupar medicamentos por 'via'
    const grouped = new Map();
    items.forEach(item => {
        if (!grouped.has(item.via)) {
            grouped.set(item.via, []);
        }
        grouped.get(item.via).push(item);
    });
    
    // 3. Determinar a data
    let finalDate = null;
    if (isDateEnabled && selectedDate) {
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const year = selectedDate.getFullYear();
        finalDate = `${day}/${month}/${year}`;
    }
    
    // 4. Criar o container de impressão
    const printOutput = document.getElementById('print-output');
    printOutput.innerHTML = ''; // Limpa conteúdo anterior
    
    // 5. Criar DUAS vias idênticas usando o componente reutilizável
    const via1 = createViaComponent(patient, buyer, grouped, finalDate);
    const via2 = createViaComponent(patient, buyer, grouped, finalDate);
    
    printOutput.appendChild(via1);
    printOutput.appendChild(via2);
    
    // 6. Abrir janela para impressão (mantenha o resto do código igual)
    printOutput.style.display = 'block';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        printOutput.style.display = 'none';
        alert('A impressão foi bloqueada pelo navegador. Por favor, habilite os pop-ups para este site.');
        return;
    }
    
    const printContent = printOutput.outerHTML; // Alterado de innerHTML para outerHTML
    printOutput.style.display = 'none';
    
    const mainCSS = document.querySelector('link[href="style.css"]').outerHTML;
    const printCSS = document.querySelector('link[href="print.css"]').outerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <title>Receituário para Impressão</title>
            ${mainCSS}
            ${printCSS}
        </head>
        <body>
            ${printContent}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.addEventListener('load', () => {
        printWindow.print();
        printWindow.close();
    });
}

    // Função para alternar o estado da data (ON/OFF)
    function toggleDate() {
        isDateEnabled = !isDateEnabled;
        addDateBtn.classList.toggle('active');
        dateOptionsContainer.classList.toggle('visible'); // Usa a nova classe para a animação

        // Se desativado, reseta tudo
        if (!isDateEnabled) {
            selectedDate = null;
            dateSelectionMode = null;
            dateTodayBtn.classList.remove('active');
            dateOtherBtn.classList.remove('active');
            customDateInput.classList.add('hidden');
            customDateInput.value = '';
        }
    }

    // Adiciona os ouvintes de eventos
    addItemBtn.addEventListener('click', addNewItem);
    addDateBtn.addEventListener('click', toggleDate);
    generateBtn.addEventListener('click', generateDocument);

    dateTodayBtn.addEventListener('click', () => {
        dateSelectionMode = 'today';
        selectedDate = new Date();
        dateTodayBtn.classList.add('active');
        dateOtherBtn.classList.remove('active');
        customDateInput.classList.add('hidden');
    });

    dateOtherBtn.addEventListener('click', () => {
        dateSelectionMode = 'custom';
        dateOtherBtn.classList.add('active');
        dateTodayBtn.classList.remove('active');
        customDateInput.classList.remove('hidden');
        // Se já houver uma data no input, usa ela. Senão, limpa a seleção.
        if (customDateInput.value) {
            parseAndSetCustomDate(customDateInput.value);
        } else {
            selectedDate = null;
        }
    });

    // Função para formatar a data enquanto o usuário digita
    customDateInput.addEventListener('input', (e) => {
        customDateInput.classList.remove('input-error', 'input-success'); // Limpa o status ao digitar

        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não for dígito
        if (value.length > 2) {
            value = `${value.slice(0, 2)}/${value.slice(2)}`;
        }
        if (value.length > 5) {
            value = `${value.slice(0, 5)}/${value.slice(5, 9)}`;
        }
        e.target.value = value;
    });

    // Função para validar e definir a data customizada
    function parseAndSetCustomDate(dateString) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Mês no JS é base 0
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);

            // Verifica se a data é válida (ex: não é 31/02/2024) e se o ano é razoável
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day && year > 1900 && year < 2100) {
                selectedDate = date;
                return true; // Data válida
            } else {
                selectedDate = null; // Data inválida
                return false; // Data inválida
            }
        } else {
            selectedDate = null;
            return false; // Formato inválido
        }
    }

    customDateInput.addEventListener('change', (e) => {
        const isValid = parseAndSetCustomDate(e.target.value);
        customDateInput.classList.remove('input-error', 'input-success'); // Limpa antes de aplicar o novo status

        if (!isValid && e.target.value !== '') {
            alert('Data inválida! Por favor, insira uma data no formato dd/mm/aaaa e verifique se os valores são corretos.');
            customDateInput.classList.add('input-error');
        } else if (isValid) {
            customDateInput.classList.add('input-success');
        }
    });

    // Adiciona o evento de clique ao novo botão de reset
    resetBtn.addEventListener('click', () => {
        location.reload(); // Recarrega a página, limpando todos os campos
    });

    // Adiciona um item inicial ao carregar a página
    addNewItem();
});