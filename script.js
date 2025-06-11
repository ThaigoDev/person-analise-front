document.addEventListener('DOMContentLoaded', () => {
    const formAnalise = document.getElementById('form-analise');
    const formularioSection = document.getElementById('formulario-perguntas');
    const resultadosSection = document.getElementById('resultados');
    const analiseGeralTexto = document.getElementById('analise-geral-texto');
    const recomendacoesLooksDiv = document.getElementById('recomendacoes-looks');
    const recomendacoesPerfumesDiv = document.getElementById('recomendacoes-perfumes');
    const recomendacoesSapatosDiv = document.getElementById('recomendacoes-sapatos');
    const dicasGeraisDiv = document.getElementById('dicas-gerais');
    const radarChartCanvas = document.getElementById('radar-chart');
    const barChartCanvas = document.getElementById('bar-chart');
    const colorPaletteContainer = document.getElementById('color-palette-container');
    const refazerQuizButton = document.getElementById('refazer-quiz');

    const slides = document.querySelectorAll('.slides-wrapper .slide');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressBar = document.getElementById('progress-bar');

    let currentSlideIndex = 0;
    let radarChartInstance = null;
    let barChartInstance = null;

    // --- Funções de Navegação e Progresso ---

    function showSlide(index, direction = 'next') {
        // Garante que o índice está dentro dos limites
        if (index < 0 || index >= slides.length) {
            console.error('Índice de slide inválido:', index);
            return;
        }

        // Adiciona a classe 'leaving' ao slide atual para animar a saída
        if (slides[currentSlideIndex] && currentSlideIndex !== index) {
            slides[currentSlideIndex].classList.remove('current');
            slides[currentSlideIndex].classList.add(direction === 'next' ? 'leaving-left' : 'leaving-right');

            // Remove a classe de leaving após a transição para limpar o estado
            slides[currentSlideIndex].addEventListener('transitionend', function handler() {
                slides[this.dataset.oldIndex].classList.remove('leaving-left', 'leaving-right');
                slides[this.dataset.oldIndex].removeEventListener('transitionend', handler);
            }, { once: true });
        }

        // Atualiza o índice do slide atual
        const oldIndex = currentSlideIndex;
        currentSlideIndex = index;
        slides[oldIndex].dataset.oldIndex = oldIndex; // Armazena o índice antigo para a remoção da classe

        // Adiciona a classe 'current' ao novo slide para animar a entrada
        slides[currentSlideIndex].classList.remove('leaving-left', 'leaving-right');
        slides[currentSlideIndex].classList.add('current');

        // Garante que a altura do slides-wrapper se ajuste ao novo slide
        adjustSlidesWrapperHeight();

        // Atualiza a visibilidade dos botões de navegação
        prevBtn.classList.toggle('hidden', currentSlideIndex === 0);
        nextBtn.classList.toggle('hidden', currentSlideIndex === slides.length - 1);
        submitBtn.classList.toggle('hidden', currentSlideIndex !== slides.length - 1);

        updateProgressBar();
    }

    function adjustSlidesWrapperHeight() {
        const slidesWrapper = document.querySelector('.slides-wrapper');
        const currentSlide = slides[currentSlideIndex];
        if (currentSlide && slidesWrapper) {
            // Define a altura do wrapper para a altura do slide atual
            // Isso evita que o container "pule" quando slides de diferentes alturas são carregados
            slidesWrapper.style.height = `${currentSlide.scrollHeight}px`;
        }
    }


    function updateProgressBar() {
        const progress = ((currentSlideIndex + 1) / slides.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function validateCurrentSlide() {
        const currentQuestionCard = slides[currentSlideIndex].querySelector('.question-card');
        if (!currentQuestionCard) {
            return true; // Considera válido se não há card de pergunta (pode ser um slide de transição ou outro)
        }

        const formGroups = currentQuestionCard.querySelectorAll('.form-group');
        let allValid = true;

        formGroups.forEach(group => {
            const requiredInputs = group.querySelectorAll('[required]');

            if (requiredInputs.length === 0) return;

            let groupValid = false;

            for (const input of requiredInputs) {
                if (input.type === 'radio') {
                    const radioGroupName = input.name;
                    if (currentQuestionCard.querySelector(`input[name="${radioGroupName}"]:checked`)) {
                        groupValid = true;
                        break;
                    }
                } else if (input.tagName.toLowerCase() === 'select') {
                    if (input.value && input.value !== '') {
                        groupValid = true;
                    }
                } else if (input.type === 'text' || input.type === 'number' || input.tagName.toLowerCase() === 'textarea') {
                    if (input.value.trim() !== '') {
                        groupValid = true;
                    }
                } else if (input.type === 'checkbox') {
                    // Para checkboxes 'required', eles precisam estar checados.
                    // Se você quer validar que PELO MENOS UM checkbox de um grupo seja marcado,
                    // precisaria de uma lógica mais específica, talvez usando um dataset attribute.
                    // A implementação atual valida que CADA checkbox marcado como 'required' deve ser checado.
                    if (input.checked) {
                        groupValid = true;
                        break;
                    }
                }
            }

            if (!groupValid) {
                allValid = false;
                // Opcional: Adicione feedback visual aqui, se desejar (ex: mudar borda, adicionar classe de erro)
            }
        });

        return allValid;
    }


    function goToNextSlide() {
        if (!validateCurrentSlide()) {
            alert('Por favor, preencha todos os campos obrigatórios antes de prosseguir.');
            return;
        }

        if (currentSlideIndex < slides.length - 1) {
            showSlide(currentSlideIndex + 1, 'next');
        }
    }

    function goToPrevSlide() {
        if (currentSlideIndex > 0) {
            showSlide(currentSlideIndex - 1, 'prev');
        }
    }

    // --- Lógica de Envio do Formulário e API ---

    formAnalise.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validateCurrentSlide()) {
            alert('Por favor, preencha todos os campos obrigatórios antes de obter a análise.');
            return;
        }

        const formData = new FormData(formAnalise);
        const collectedData = {};
        let perfumeJaGostou = ''; // Variável para armazenar o perfume que o usuário já gostou

        // Coleta dados do formulário, agrupando checkboxes e radios
        for (const [key, value] of formData.entries()) {
            if (key === 'perfume_gostou') { // Captura o valor do perfume que o usuário já gostou
                perfumeJaGostou = value.trim();
                continue; // Não adiciona ao collectedData, será usado no prompt
            }
            // Se o campo for um dos que podem ter múltiplas seleções (checkboxes)
            if (['hobbies', 'estilos_identificacao', 'preferencia_cores', 'ocasioes_recomendacao', 'preferencia_olfativa'].includes(key)) {
                if (!collectedData[key]) {
                    collectedData[key] = []; // Inicializa como array se for a primeira vez
                }
                collectedData[key].push(value); // Adiciona o valor ao array
            } else {
                collectedData[key] = value;
            }
        }

        // Limpar campos vazios ou arrays vazios
        for (const key in collectedData) {
            if (collectedData.hasOwnProperty(key)) {
                if (Array.isArray(collectedData[key]) && collectedData[key].length === 0) {
                    delete collectedData[key];
                } else if (typeof collectedData[key] === 'string' && collectedData[key].trim() === '' && key !== 'descricao') { // 'perfume_gostou' já foi extraído
                    delete collectedData[key];
                }
            }
        }

        const userPreferencesString = JSON.stringify(collectedData, null, 2);

        // Adiciona a restrição ao prompt se o usuário informou um perfume que gostou
        const perfumeRestriction = perfumeJaGostou ? `\n    **IMPORTANTE:** NÃO recomende o perfume "${perfumeJaGostou}" ou qualquer um muito similar a ele (com a mesma família olfativa predominante ou notas principais muito parecidas).` : '';

        const prompt = `
            Você é um estilista pessoal de alto nível e um consultor de imagem. Com base nas preferências detalhadas do usuário, gere uma análise completa e recomendações personalizadas para a imagem pessoal.
            ${perfumeRestriction}

            Sua resposta deve ser **SOMENTE um objeto JSON válido**. Não inclua nenhum outro texto, introdução ou conclusão antes ou depois do JSON.

            Aqui estão as preferências do usuário:
            ${userPreferencesString}

            O objeto JSON deve ter a seguinte estrutura exata:
            {
              "analise_geral": "Uma análise detalhada da personalidade e estilo do usuário com base nas respostas, descrevendo o perfil predominante e suas características.",
              "looks": [
                {
                  "nome": "Nome do Look (ex: Elegância Urbana Casual)",
                  "descricao": "Uma descrição detalhada do look, mencionando peças específicas (ex: calça chino de corte slim, camisa de linho, jaqueta bomber em tom neutro), tecidos, cores e para quais ocasiões é ideal (ex: dia a dia, encontro casual). Dê dicas de como combinar e a imagem que transmite."
                },
                {
                  "nome": "Nome do Look (ex: Estilo Profissional Confiante)",
                  "descricao": "Descrição detalhada do segundo look, focado em ambientes profissionais ou eventos mais formais, com sugestões de peças, materiais e como ele favorece a imagem profissional."
                },
                {
                  "nome": "Nome do Look (ex: Vibrações Criativas e Autênticas)",
                  "descricao": "Descrição detalhada do terceiro look, com foco em criatividade, cores, texturas e peças únicas, ideal para eventos sociais ou momentos de lazer descontraídos, destacando a autenticidade."
                }
              ],
              "perfumes": [
                {
                  "nome": "Nome do Perfume (ex: Essência Amadeirada Fresca)",
                  "descricao": "Descrição da fragrância, notas olfativas principais (ex: topo: bergamota e pimenta, coração: cedro e patchouli, base: sândalo e âmbar), e para quais momentos/ocasiões ele é ideal (dia/noite, formal/casual). Sugira a sensação que o perfume transmite."
                },
                {
                  "nome": "Nome do Perfume (ex: Aura Cítrica Vibrante)",
                  "descricao": "Descrição da segunda fragrância, com suas notas e sugestões de uso, e a sensação que ela evoca."
                }
              ],
              "sapatos": [
                {
                  "nome": "Nome do Sapato (ex: Tênis Branco Minimalista)",
                  "descricao": "Descrição do tipo de sapato (ex: tênis de couro branco liso), material, estilo, para quais ocasiões é adequado e como ele complementa os looks recomendados e a personalidade, adicionando um toque de conforto e modernidade."
                },
                 {
                  "nome": "Nome do Sapato (ex: Bota Chelsea Elegante)",
                  "descricao": "Descrição do segundo sapato, suas características, materiais e como ele se encaixa em um guarda-roupa versátil e elegante."
                }
              ],
              "dicas_genericas": [
                "Dica 1: Dica prática sobre como usar as recomendações no dia a dia para otimizar a imagem pessoal.",
                "Dica 2: Dica sobre tecidos, caimento ou cores que valorizam o tipo físico ou tom de pele.",
                "Dica 3: Dica sobre como aprimorar o estilo de forma consciente e autêntica."
              ],
              "graficos": {
                "radar": {
                  "labels": ["Ousadia", "Formalidade", "Versatilidade", "Intensidade Olfativa", "Criatividade", "Conforto"],
                  "datasets": [
                    {
                      "label": "Seu Perfil",
                      "data": [
                        // Valor de 1 a 10 para Ousadia (1=discreto, 10=ousado)
                        // Valor de 1 a 10 para Formalidade (1=descontraído, 10=formal)
                        // Valor de 1 a 10 para Versatilidade (1=específico, 10=adaptável a diversas ocasiões)
                        // Valor de 1 a 10 para Intensidade Olfativa (1=leve, 10=forte/marcante)
                        // Valor de 1 a 10 para Criatividade (1=tradicional, 10=inovador/autêntico)
                        // Valor de 1 a 10 para Conforto (1=prioriza estética, 10=prioriza conforto)
                      ],
                      "backgroundColor": "rgba(76, 175, 80, 0.4)",
                      "borderColor": "rgba(76, 175, 80, 1)",
                      "borderWidth": 2
                    }
                  ]
                },
                "bar": {
                  "labels": ["Dia a dia", "Trabalho", "Eventos Sociais", "Encontros", "Viagens"],
                  "datasets": [
                    {
                      "label": "Ocasiões Preferidas",
                      "data": [
                        // Frequência ou pontuação de 0 a 10 para cada ocasião (0=não relevante, 10=muito relevante).
                      ],
                      "backgroundColor": [
                        "#4CAF50", "#2196F3", "#FFC107", "#9C27B0", "#00BCD4"
                      ],
                      "borderColor": [
                        "#388E3C", "#1976D2", "#FFA000", "#7B1FA2", "#0097A7"
                      ],
                      "borderWidth": 1
                    }
                  ]
                },
                "paleta_cores": [
                  // Array de strings de cores em formato hexadecimal (ex: "#RRGGBB").
                ]
              }
            }
            Gere **3 recomendações diversas e detalhadas** para looks, **2** para perfumes e **2** para sapatos. Forneça **3 dicas gerais** para aprimorar a imagem pessoal.
            Certifique-se de que todas as descrições são ricas em detalhes, sugestões de combinação e como elas se alinham à personalidade do usuário.
            A análise geral deve ser um texto corrido.
            Os valores dos gráficos devem ser consistentes com a análise textual.
            `

        try {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-feedback';
            loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando sua análise...';
            // Insere antes do formulário (ou ajusta conforme seu HTML)
            formularioSection.parentNode.insertBefore(loadingDiv, formularioSection);
            formularioSection.classList.add('hidden-form'); // Adiciona uma classe para esconder o formulário durante o carregamento

            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';
            submitBtn.disabled = true;

            const response = await fetch('https://person-analise-api.onrender.com/recomended-person', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Erro da API:', errorData);
                throw new Error(`Erro ao obter recomendações: ${errorData.error || response.statusText}`);
            }

            const apiResult = await response.json();
            console.log('Resposta bruta da API:', apiResult);

            let parsedResult;
            try {
                parsedResult = JSON.parse(apiResult.legenda);
                console.log('Resultado parseado da API:', parsedResult);
            } catch (jsonError) {
                console.error('Erro ao parsear JSON da legenda:', jsonError);
                alert('A API retornou um formato inesperado. Por favor, tente novamente ou verifique a resposta do servidor.');
                return;
            }

            analiseGeralTexto.textContent = parsedResult.analise_geral || 'Não foi possível gerar uma análise geral no momento.';

            function populateRecommendationList(container, items, type) {
                container.innerHTML = '';
                if (items && Array.isArray(items) && items.length > 0) {
                    items.forEach(item => {
                        const p = document.createElement('p');
                        if (type === 'dicas') {
                            p.textContent = item;
                        } else {
                            p.innerHTML = item.nome ? `<strong>${item.nome}:</strong> ${item.descricao || ''}` : item.descricao;
                        }
                        container.appendChild(p);
                    });
                } else {
                    container.innerHTML = '<p class="no-recommendation">Nenhuma recomendação disponível no momento.</p>';
                }
            }

            const dicasParaExibir = parsedResult.dicas_genericas || parsedResult.dicas_gerais;

            populateRecommendationList(recomendacoesLooksDiv, parsedResult.looks, 'looks');
            populateRecommendationList(recomendacoesPerfumesDiv, parsedResult.perfumes, 'perfumes');
            populateRecommendationList(recomendacoesSapatosDiv, parsedResult.sapatos, 'sapatos');
            populateRecommendationList(dicasGeraisDiv, dicasParaExibir, 'dicas');


            if (parsedResult.graficos) {
                const style = getComputedStyle(document.body);
                const textColor = style.getPropertyValue('--text-primary').trim();
                const secondaryColor = style.getPropertyValue('--text-secondary').trim();
                const primaryChartColor = style.getPropertyValue('--primary-color').trim();
                const secondaryChartColor = style.getPropertyValue('--secondary-color').trim();
                const shadowDarkColor = style.getPropertyValue('--shadow-dark').trim();

                if (parsedResult.graficos.radar) {
                    radarChartCanvas.style.display = 'block';
                    parsedResult.graficos.radar.datasets[0].backgroundColor = primaryChartColor + '40';
                    parsedResult.graficos.radar.datasets[0].borderColor = primaryChartColor;
                    gerarGraficoRadar(radarChartCanvas, parsedResult.graficos.radar, textColor, secondaryColor, shadowDarkColor);
                } else {
                    radarChartCanvas.style.display = 'none';
                }

                if (parsedResult.graficos.bar) {
                    barChartCanvas.style.display = 'block';
                    if (!parsedResult.graficos.bar.datasets[0].backgroundColor || parsedResult.graficos.bar.datasets[0].backgroundColor.length === 0) {
                         parsedResult.graficos.bar.datasets[0].backgroundColor = [
                            primaryChartColor, secondaryChartColor, '#FFC107', '#9C27B0', '#00BCD4'
                        ];
                        parsedResult.graficos.bar.datasets[0].borderColor = [
                            primaryChartColor, secondaryChartColor, '#FFC107', '#9C27B0', '#0097A7'
                        ];
                    }
                    gerarGraficoBarra(barChartCanvas, parsedResult.graficos.bar, textColor, secondaryColor, shadowDarkColor);
                } else {
                    barChartCanvas.style.display = 'none';
                }

                if (parsedResult.graficos.paleta_cores && Array.isArray(parsedResult.graficos.paleta_cores)) {
                    exibirPaletaCores(colorPaletteContainer, parsedResult.graficos.paleta_cores);
                } else {
                    colorPaletteContainer.innerHTML = '<h4 class="chart-label">Sua Paleta de Cores</h4><p class="no-recommendation">Paleta de cores não disponível.</p>';
                }
            } else {
                radarChartCanvas.style.display = 'none';
                barChartCanvas.style.display = 'none';
                colorPaletteContainer.innerHTML = '<h4 class="chart-label">Sua Paleta de Cores</h4><p class="no-recommendation">Análise gráfica não disponível.</p>';
            }

            if (loadingDiv) loadingDiv.remove();
            formularioSection.classList.add('hidden'); // Esconde o formulário completamente
            resultadosSection.classList.remove('hidden'); // Mostra os resultados
            resultadosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });


        } catch (error) {
            console.error('Erro ao enviar dados para a API:', error);
            alert(`Ocorreu um erro ao obter as recomendações. Por favor, tente novamente mais tarde. Detalhes: ${error.message}`);
        } finally {
            submitBtn.innerHTML = 'Obter Análise <i class="fas fa-magic"></i>';
            submitBtn.disabled = false;
            const existingLoadingDiv = document.querySelector('.loading-feedback');
            if (existingLoadingDiv) existingLoadingDiv.remove();
            formularioSection.classList.remove('hidden-form'); // Garante que a classe de esconder seja removida se algo der errado
        }
    });

    // --- Event Listeners para Navegação ---
    nextBtn.addEventListener('click', goToNextSlide);
    prevBtn.addEventListener('click', goToPrevSlide);
    refazerQuizButton.addEventListener('click', () => {
        // Esconder a seção de resultados e mostrar o formulário
        resultadosSection.classList.add('hidden');
        formularioSection.classList.remove('hidden'); // Torna o formulário visível

        formAnalise.reset(); // Limpa todos os campos do formulário
        currentSlideIndex = 0; // Volta para o primeiro slide
        showSlide(currentSlideIndex); // Exibe o primeiro slide novamente

        // Rola para o topo do formulário
        formularioSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Destruir instâncias de gráficos para evitar duplicidade e problemas
        if (radarChartInstance) {
            radarChartInstance.destroy();
            radarChartInstance = null;
        }
        if (barChartInstance) {
            barChartInstance.destroy();
            barChartInstance = null;
        }
        // Assegurar que os canvases de gráfico estejam visíveis para a próxima renderização
        radarChartCanvas.style.display = 'block';
        barChartCanvas.style.display = 'block';
        // Limpar e resetar o container da paleta de cores
        colorPaletteContainer.innerHTML = '<h4 class="chart-label">Sua Paleta de Cores</h4>';
    });

    // --- Funções de Geração de Gráficos ---

    function gerarGraficoRadar(canvas, chartData, textColor, secondaryColor, gridColor) {
        if (radarChartInstance) {
            radarChartInstance.destroy();
        }
        radarChartInstance = new Chart(canvas, {
            type: 'radar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true,
                            color: gridColor
                        },
                        suggestedMin: 0,
                        suggestedMax: 10,
                        pointLabels: {
                            font: {
                                size: 12,
                                family: 'Inter',
                                weight: '500'
                            },
                            color: textColor
                        },
                        ticks: {
                            backdropColor: 'rgba(236, 240, 243, 0.8)',
                            color: secondaryColor,
                            font: {
                                family: 'Inter',
                                weight: '400'
                            },
                            stepSize: 2
                        },
                        grid: {
                            color: gridColor
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: {
                                family: 'Inter',
                                weight: '500'
                            }
                        }
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    function gerarGraficoBarra(canvas, chartData, textColor, secondaryColor, gridColor) {
        if (barChartInstance) {
            barChartInstance.destroy();
        }
        barChartInstance = new Chart(canvas, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: secondaryColor,
                            font: {
                                family: 'Inter',
                                weight: '400'
                            },
                             stepSize: 2
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: secondaryColor,
                            font: {
                                family: 'Inter',
                                weight: '400'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    function exibirPaletaCores(container, cores) {
        container.innerHTML = '<h4 class="chart-label">Sua Paleta de Cores</h4><div class="color-boxes"></div>';
        const colorBoxesContainer = container.querySelector('.color-boxes');
        if (cores && Array.isArray(cores) && cores.length > 0) {
            cores.forEach(cor => {
                const corDiv = document.createElement('div');
                corDiv.classList.add('color-box');
                corDiv.style.backgroundColor = cor;
                corDiv.title = `Cor: ${cor}`;
                colorBoxesContainer.appendChild(corDiv);
            });
        } else {
            colorBoxesContainer.innerHTML = '<p class="no-recommendation">Paleta de cores não disponível.</p>';
        }
    }

    // --- Inicialização ---
    showSlide(currentSlideIndex); // Garante que o primeiro slide seja exibido ao carregar a página
    adjustSlidesWrapperHeight(); // Ajusta a altura inicial do wrapper
    window.addEventListener('resize', adjustSlidesWrapperHeight); // Ajusta a altura ao redimensionar
});