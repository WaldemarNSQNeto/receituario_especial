let medicineCount = 1;

function addMedicine() {
    medicineCount++;

    const medicineContainer = document.getElementById("medicines");

    const medicineDiv = document.createElement("div");
    medicineDiv.classList.add("medicine");

    medicineDiv.innerHTML = `
        <div class="top-row">
            <div class="field">
                <label for="route${medicineCount}">Via:</label>
                <select id="route${medicineCount}" class="route">
                    <option value="Oral" selected>Oral</option>
                    <option value="Epidural">Epidural</option>
                    <option value="Endovenoso">Endovenoso</option>
                    <option value="Inalatório">Inalatório</option>
                    <option value="Intra-arterial">Intra-arterial</option>
                    <option value="Intradérmico">Intradérmico</option>
                    <option value="Intramuscular">Intramuscular</option>
                    <option value="Intraperitoneal">Intraperitoneal</option>
                    <option value="Intratecal">Intratecal</option>
                    <option value="Nasal">Nasal</option>
                    <option value="Oftalmológico">Oftalmológico</option>
                    <option value="Otológico">Otológico</option>
                    <option value="Retal">Retal</option>
                    <option value="Subcutâneo">Subcutâneo</option>
                    <option value="Sublingual">Sublingual</option>
                    <option value="Tópico">Tópico</option>
                    <option value="Vaginal">Vaginal</option>
                </select>
            </div>

            <div class="field">
                <label for="medicine${medicineCount}">Item:</label>
                <input type="text" id="medicine${medicineCount}" required>
            </div>

            <div class="field">
                <label for="posology${medicineCount}">Posologia:</label>
                <input type="text" id="posology${medicineCount}" required>
            </div>

            <div class="field">
                <label for="quantity${medicineCount}">Qnt:</label>
                <input type="text" id="quantity${medicineCount}" required>
            </div>
        </div>

        <div class="bottom-row">
            <div class="field full-width">
                <label for="usage${medicineCount}">Forma de Utilização:</label>
                <input type="text" id="usage${medicineCount}" required>
            </div>
            <button type="button" class="remove-medicine" onclick="removeMedicine(this)">&#10060;</button>
        </div>
    `;
    
    medicineContainer.appendChild(medicineDiv);
}

function removeMedicine(button) {
    button.parentElement.parentElement.remove();
}

function gerarReceita() {
    // Coleta os dados do paciente e endereço
    document.getElementById("prevPaciente").textContent = document.getElementById("paciente").value;
    document.getElementById("prevEndereco").textContent = document.getElementById("endereco").value;

    // Objeto para agrupar medicamentos por via
    const medicamentosAgrupados = {};

    // Contador global para a numeração dos itens
    let contadorItens = 1;

    // Percorre todos os medicamentos
    for (let i = 1; i <= medicineCount; i++) {
        const route = document.getElementById(`route${i}`)?.value;
        const medicine = document.getElementById(`medicine${i}`)?.value;
        const posology = document.getElementById(`posology${i}`)?.value;
        const quantity = document.getElementById(`quantity${i}`)?.value;
        const usage = document.getElementById(`usage${i}`)?.value;

        // Verifica se todos os campos estão preenchidos
        if (route && medicine && posology && quantity && usage) {
            // Se a via ainda não existe no objeto, cria um array para ela
            if (!medicamentosAgrupados[route]) {
                medicamentosAgrupados[route] = [];
            }

            // Adiciona o medicamento ao grupo correspondente, com o número do item
            medicamentosAgrupados[route].push({
                numero: contadorItens, // Usa o contador global
                medicine,
                posology,
                quantity,
                usage
            });

            // Incrementa o contador global
            contadorItens++;
        }
    }

    // Variável para construir a prescrição formatada
    let prescricao = "";

    // Percorre os grupos de medicamentos por via
    for (const [via, medicamentos] of Object.entries(medicamentosAgrupados)) {
        // Adiciona o título da via centralizado
        prescricao += `<div style="text-align: center; font-weight: bold; margin: 5px 0; font-size: 14px">Via ${via}</div>`;

        // Percorre os medicamentos da via atual
        medicamentos.forEach((med) => {
            // Formata o item conforme o modelo solicitado
            prescricao += `
                <div> <div style="font-size: 12px"; margin-bottom: 2px;>
                    ${med.numero}. ${med.medicine} (${med.posology}) -------------------- ${med.quantity}
                </div>
                <div style="margin-left: 20px; font-size: 12px">
                    &#9679; ${med.usage}
                </div>
            `;
        });
    }

    // Exibe a prescrição formatada na pré-visualização
    document.getElementById("prevPrescricao").innerHTML = prescricao;

    // Exibe a pré-visualização
    document.getElementById("preview").classList.remove("hidden");
}

function inserirData() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    const dataFormatada = `${dia}/${mes}/${ano}`;
    document.getElementById("dataField").textContent = dataFormatada;
}

function removerData() {
    document.getElementById("dataField").textContent = "";
}


function imprimirReceita() {
    // Captura a pré-visualização como uma imagem
    html2canvas(document.getElementById("preview")).then((canvas) => {
        // Cria um novo canvas para recortar a imagem
        const canvasRecortado = document.createElement("canvas");
        const ctx = canvasRecortado.getContext("2d");

        // Define as dimensões do canvas recortado
        const larguraRecorte = canvas.width * 0.6; // Recorta 10% das laterais (5% de cada lado)
        const alturaRecorte = canvas.height;
        canvasRecortado.width = larguraRecorte;
        canvasRecortado.height = alturaRecorte;

        // Recorta as laterais da imagem
        const offsetX = (canvas.width - larguraRecorte) / 2; // Calcula o deslocamento horizontal
        ctx.drawImage(
            canvas,
            offsetX, 0, // Coordenadas de início do recorte (x, y)
            larguraRecorte, alturaRecorte, // Largura e altura do recorte
            0, 0, // Coordenadas de destino no canvas recortado (x, y)
            larguraRecorte, alturaRecorte // Largura e altura do canvas recortado
        );

        // Converte o canvas recortado para uma imagem (URL de dados)
        const imagemRecortada = canvasRecortado.toDataURL("image/png");

        // Abre uma nova janela para impressão
        const janelaImpressao = window.open("", "_blank");

        // Escreve o conteúdo na nova janela
        janelaImpressao.document.write(`
            <html>
                <head>
                    <title>Impressão da Receita</title>
                    <style>
                        /* Define o tamanho da página como A4 paisagem */
                        @page {
                            size: A4 landscape;
                            margin: 2mm; /* Reduz as margens para 2mm */
                        }

                        /* Estilo para o corpo da página */
                        body {
                            margin: 0;
                            padding: 0;
                            display: flex; /* Divide a página em duas colunas */
                            justify-content: flex-start; /* Alinha as colunas à esquerda */
                            align-items: flex-start; /* Alinha as colunas no topo */
                        }

                        /* Estilo para cada imagem */
                        .imagem-container {
                            width: 49,5%; /* Aumenta a largura das colunas para ocupar mais espaço */
                            page-break-inside: avoid; /* Evita que a imagem seja dividida entre páginas */
                            transform: translateX(-10px); /* Move a imagem 10px para a esquerda */
                        }

                        .imagem-container img {
                            width: 100%; /* A imagem ocupa toda a largura da coluna */
                            height: auto; /* Mantém a proporção da imagem */
                            transform-origin: top left; /* Mantém o alinhamento no topo e à esquerda */
                        }
                    </style>
                </head>
                <body onload="window.print(); window.close();">
                    <!-- Primeira imagem -->
                    <div class="imagem-container">
                        <img src="${imagemRecortada}" alt="Receita">
                    </div>

                    <!-- Segunda imagem -->
                    <div class="imagem-container">
                        <img src="${imagemRecortada}" alt="Receita">
                    </div>
                </body>
            </html>
        `);

        // Fecha o documento para carregar o conteúdo
        janelaImpressao.document.close();
    });
}

