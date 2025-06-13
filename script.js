document.addEventListener('DOMContentLoaded', () => {
    // Referências aos Elementos do DOM
    const quizSection = document.getElementById('quiz-section');
    const loadingSection = document.getElementById('loading-section');
    const resultsSection = document.getElementById('results-section');
    const form = document.getElementById('personality-form');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressBar = document.getElementById('progress-bar');
    const errorMessage = document.getElementById('error-message');

    // Estrutura das Perguntas do Formulário
    const questions = [
        { id: 'intro', type: 'intro', title: 'Faça sua análise individual de imagem pessoal', description: 'Por favor, responda às próximas perguntas. Suas respostas nos ajudarão a montar uma análise de imagem e estilo perfeita para você.' },
        { id: 'describe', type: 'text', title: 'Como você se descreveria em poucas palavras?', required: true },
        { id: 'environment', type: 'radio', title: 'Você prefere ambientes...', options: ['Urbanos', 'Naturais', 'Clássicos', 'Criativos-descontraídos'], required: true },
        { id: 'personality', type: 'radio', title: 'Sua personalidade é mais:', options: ['Extrovertida', 'Introvertida', 'Equilibrada'], required: true },
        { id: 'lifestyle', type: 'radio', title: 'Seu estilo de vida é:', options: ['Agitado urbano', 'Tranquilo introspectivo', 'Equilibrado versátil'], required: true },
        { id: 'hobbies', type: 'checkbox', title: 'Quais seus hobbies/interesses?', options: ['Música', 'Leitura', 'Academia', 'Tecnologia', 'Moda', 'Natureza', 'Arte', 'Gastronomia'], max: 4 },
        { id: 'style_representation', type: 'checkbox', title: 'Quais estilos mais te representam?', options: ['Casual', 'Clássico', 'Moderno', 'Street', 'Minimalista', 'Criativo', 'Elegante'], max: 3, required: true },
        { id: 'boldness', type: 'radio', title: 'Nível de ousadia ao se vestir:', options: ['Discreto', 'Equilibrado', 'Ousado'], required: true },
        { id: 'colors_preference', type: 'checkbox', title: 'Cores preferidas:', options: ['Neutras', 'Terrosas', 'Vibrantes', 'Escuras'], max: 3, required: true },
        { id: 'prints_preference', type: 'radio', title: 'Estampas favoritas:', options: ['Liso', 'Listrado', 'Xadrez', 'Floral', 'Nenhuma'], required: true },
        { id: 'climate', type: 'radio', title: 'Clima predominante onde mora:', options: ['Frio', 'Quente', 'Equilibrado'], required: true },
        { id: 'occasions', type: 'checkbox', title: 'Ocasiões para recomendação:', options: ['Dia a dia', 'Trabalho', 'Eventos', 'Encontros', 'Viagens'], max: 3, required: true },
        { id: 'scents', type: 'checkbox', title: 'Aromas preferidos:', options: ['Doce', 'Amadeirado', 'Cítrico', 'Especiado', 'Fresco', 'Oriental'], max: 3, required: true },
        { id: 'perfume_intensity', type: 'radio', title: 'Intensidade do perfume:', options: ['Leve', 'Moderada', 'Forte'], required: true },
        { id: 'used_perfumes', type: 'text', title: 'Algum perfume que já usou e gostou?' },
        { id: 'skin_tone', type: 'radio', title: 'Qual seu tom de pele?', options: ['Muito claro', 'Claro rosado', 'Bege neutro', 'Dourado', 'Bronzeado', 'Moreno', 'Negro'], required: true },
        { id: 'body_type', type: 'radio', title: 'Qual seu tipo físico?', options: ['Ectomorfo', 'Mesomorfo', 'Endomorfo'], required: true },
        { id: 'height', type: 'number', title: 'Sua altura (em cm)?', required: true },
        { id: 'gender', type: 'radio', title: 'Seu gênero:', options: ['Masculino', 'Feminino', 'Outro'], required: true },
        { id: 'price_preference', type: 'radio', title: 'Você prefere recomendações com:', options: ['Melhor custo-benefício', 'Produtos de maior valor/agregação', 'Uma mistura equilibrada'], required: true }
    ];

    let currentQuestionIndex = 0;
    const formData = {};

    // Inicialização do formulário
    function initializeForm() {
        form.innerHTML = questions.map((q, index) => {
            let inputHtml = '';
            if (q.type === 'intro') {
                return `<div class="question-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <h1 class="question-title">${q.title}</h1>
                            <p class="question-description">${q.description}</p>
                        </div>`;
            } else if (q.type === 'text' || q.type === 'number') {
                inputHtml = `<input type="${q.type}" id="${q.id}" name="${q.id}" class="full-width" ${q.required ? 'required' : ''}>`;
            } else if (q.type === 'radio' || q.type === 'checkbox') {
                inputHtml = q.options.map(option => `
                    <label>
                        <input type="${q.type}" name="${q.id}" value="${option}" ${q.required ? 'required' : ''}>
                        <span class="custom-${q.type}"></span>
                        ${option}
                    </label>
                `).join('');
            }

            return `<div class="question-slide" data-index="${index}">
                        <h2 class="question-title">${q.title}</h2>
                        <div class="input-group">${inputHtml}</div>
                    </div>`;
        }).join('');
        showQuestion(0);
    }

    // Exibe a pergunta atual
    function showQuestion(index) {
        document.querySelectorAll('.question-slide').forEach(slide => slide.classList.remove('active'));
        const activeSlide = document.querySelector(`.question-slide[data-index="${index}"]`);
        if(activeSlide) activeSlide.classList.add('active');

        updateProgressBar();
        updateNavButtons();
    }

    // Atualiza a barra de progresso
    function updateProgressBar() {
        const progress = ((currentQuestionIndex) / (questions.length - 1)) * 100;
        progressBar.style.setProperty('--progress-width', `${progress}%`);
    }
    
    // Atualiza os botões de navegação
    function updateNavButtons() {
        prevBtn.style.display = currentQuestionIndex > 0 ? 'inline-block' : 'none';
        nextBtn.style.display = currentQuestionIndex < questions.length - 1 ? 'inline-block' : 'none';
        submitBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'inline-block' : 'none';

        if (questions[currentQuestionIndex].type === 'intro') {
            nextBtn.textContent = 'Começar';
            prevBtn.style.display = 'none';
        } else {
            nextBtn.textContent = 'Avançar';
        }
    }
    
    // Valida a resposta da pergunta atual
    function validateCurrentQuestion() {
        errorMessage.textContent = '';
        const question = questions[currentQuestionIndex];
        if (!question.required && question.type !== 'checkbox') return true;

        const inputs = form.querySelectorAll(`[name="${question.id}"]`);
        if (question.type === 'text' || question.type === 'number') {
            if (question.required && !inputs[0].value.trim()) {
                errorMessage.textContent = 'Este campo é obrigatório.';
                return false;
            }
        } else if (question.type === 'radio') {
            if (question.required && !form.querySelector(`[name="${question.id}"]:checked`)) {
                errorMessage.textContent = 'Por favor, selecione uma opção.';
                return false;
            }
        } else if (question.type === 'checkbox') {
            const checkedCount = form.querySelectorAll(`[name="${question.id}"]:checked`).length;
            if (question.required && checkedCount === 0) {
                errorMessage.textContent = 'Selecione ao menos uma opção.';
                return false;
            }
            if (question.max && checkedCount > question.max) {
                errorMessage.textContent = `Selecione no máximo ${question.max} opções.`;
                return false;
            }
        }
        return true;
    }
    
    // Salva os dados da pergunta atual
    function saveCurrentData() {
        const question = questions[currentQuestionIndex];
        const inputs = form.querySelectorAll(`[name="${question.id}"]`);

        if (question.type === 'text' || question.type === 'number' || question.type === 'radio') {
             const input = form.querySelector(`[name="${question.id}"]:checked`) || inputs[0];
             if(input) formData[question.id] = input.value;
        } else if (question.type === 'checkbox') {
            formData[question.id] = Array.from(inputs)
                .filter(i => i.checked)
                .map(i => i.value);
        }
    }
    
    // Lógica para ir para a próxima pergunta
    function handleNext() {
        if (!validateCurrentQuestion()) return;
        saveCurrentData();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    }

    // Lógica para voltar para a pergunta anterior
    function handlePrev() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    }
    
    // Constrói o prompt para a API
    function buildPrompt(data) {
        return `
            **Análise de Perfil para Recomendação de Imagem Pessoal**

            Por favor, atue como um consultor de imagem especialista e analise o perfil detalhado abaixo para gerar recomendações personalizadas. O resultado deve ser um objeto JSON único e bem estruturado, contendo as chaves: "looks", "perfumes", "palette", e "charts".

            **1. Perfil do Usuário:**
            - **Descrição Pessoal:** ${data.describe || 'Não informado'}
            - **Gênero:** ${data.gender}
            - **Personalidade:** ${data.personality}
            - **Estilo de Vida:** ${data.lifestyle}
            - **Hobbies e Interesses:** ${data.hobbies ? data.hobbies.join(', ') : 'Não informado'}

            **2. Preferências de Estilo e Visuais:**
            - **Estilos que Representam:** ${data.style_representation.join(', ')}
            - **Nível de Ousadia:** ${data.boldness}
            - **Cores Preferidas:** ${data.colors_preference.join(', ')}
            - **Estampas Favoritas:** ${data.prints_preference}

            **3. Contexto e Ocasiões:**
            - **Clima Predominante:** ${data.climate}
            - **Ocasiões de Interesse:** ${data.occasions.join(', ')}

            **4. Preferências Olfativas:**
            - **Aromas Preferidos:** ${data.scents.join(', ')}
            - **Intensidade de Perfume Desejada:** ${data.perfume_intensity}
            - **Perfumes que já Gostou:** ${data.used_perfumes || 'Nenhum informado (evite sugerir os mais comuns se possível)'}

            **5. Informações Físicas:**
            - **Tom de Pele:** ${data.skin_tone}
            - **Tipo Físico:** ${data.body_type}
            - **Altura:** ${data.height} cm

            **6. Preferência de Custo:**
            - **Foco de Preço:** ${data.price_preference}

            **--- INSTRUÇÕES PARA A SAÍDA JSON ---**

            Com base em *toda* a análise acima, gere o seguinte JSON:

            {
              "looks": [
                {
                  "name": "Nome do Estilo do Look 1",
                  "description": "Descrição visual detalhada do look.",
                  "occasions": "Ocasiões ideais para este look (ex: Trabalho, Happy Hour).",
                  "justification": "Justificativa da escolha baseada na personalidade, tipo físico e preferências do usuário."
                },
                {
                  "name": "Nome do Estilo do Look 2",
                  "description": "Descrição visual detalhada de um segundo look.",
                  "occasions": "Ocasiões ideais para este look.",
                  "justification": "Justificativa da escolha."
                }
              ],
              "perfumes": [
                {
                  "name": "Nome do Perfume 1",
                  "notes": "Notas predominantes (ex: Bergamota, Couro, Âmbar).",
                  "intensity": "Intensidade (Leve, Moderada ou Forte).",
                  "justification": "Justificativa da escolha baseada na personalidade e preferências olfativas.",
                  "price_average": 150.00 
                },
                {
                  "name": "Nome do Perfume 2",
                  "notes": "Notas predominantes.",
                  "intensity": "Intensidade.",
                  "justification": "Justificativa da escolha.",
                  "price_average": 300.00
                }
              ],
              "palette": {
                "colors": [
                  {"name": "Nome da Cor 1", "hex": "#XXXXXX"},
                  {"name": "Nome da Cor 2", "hex": "#XXXXXX"},
                  {"name": "Nome da Cor 3", "hex": "#XXXXXX"},
                  {"name": "Nome da Cor 4", "hex": "#XXXXXX"}
                ],
                "justification": "Justificativa da escolha da paleta baseada no tom de pele e no estilo pessoal desejado."
              },
              "charts": {
                "radar": {
                  "labels": ["Ousadia", "Formalidade", "Versatilidade", "Modernidade", "Intensidade Olfativa"],
                  "data": [/* Array de 5 números de 0 a 10, ex: 7, 5, 9, 8, 6 */]
                },
                "bar": {
                  "labels": [/* Array de strings com os estilos, ocasiões ou climas, ex: 'Casual', 'Trabalho', 'Quente' */],
                  "data": [/* Array de números representando a frequência/interesse, ex: 8, 9, 7 */]
                },
                "price": {
                  "labels": [/* Nomes dos produtos sugeridos */],
                  "data": [/* Preços médios dos produtos sugeridos */]
                }
              }
            }
        `;
    }

    // Submete o formulário
    async function handleSubmit(e) {
        e.preventDefault();
        if (!validateCurrentQuestion()) return;
        saveCurrentData();
        
        quizSection.classList.remove('active');
        loadingSection.classList.add('active');

        const prompt = buildPrompt(formData);

        try {
            const response = await fetch('https://person-analise-api.onrender.com/recomended-person', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const resultText = await response.text();
            const parsedResult = JSON.parse(JSON.parse(resultText).legenda);
            
            renderResults(parsedResult);

        } catch (error) {
            console.error("Error fetching or parsing API response:", error);
            resultsSection.innerHTML = `<div class="result-block" style="text-align:center;">
                                          <h2>Ocorreu um Erro</h2>
                                          <p>Não foi possível gerar sua análise no momento. Por favor, tente novamente mais tarde.</p>
                                          <p style="font-size:0.8em; color:#757575;">Detalhes: ${error.message}</p>
                                          <button onclick="window.location.reload()" class="nav-btn primary" style="margin-top: 1rem; flex-grow:0;">Refazer Análise</button>
                                        </div>`;
        } finally {
            loadingSection.classList.remove('active');
            resultsSection.classList.add('active');
        }
    }
    
    // Renderiza os resultados na página
    function renderResults(data) {
        renderLooks(data.looks);
        renderPerfumes(data.perfumes);
        renderPalette(data.palette);
        renderCharts(data.charts);
    }

    // === FUNÇÃO MODIFICADA PARA ADICIONAR LINKS ===
    function renderLooks(looks) {
        const container = document.getElementById('looks-results');
        container.innerHTML = looks.map(look => {
            // Cria um termo de busca e codifica para URL
            const searchQuery = encodeURIComponent(`${look.name} ${look.description.split(',')[0]}`);
            const searchUrl = `https://www.google.com/search?tbm=shop&q=${searchQuery}`;

            return `
            <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="result-link">
                <div class="card">
                    <h3>${look.name}</h3>
                    <span class="tag">${look.occasions}</span>
                    <p>${look.description}</p>
                    <p><strong>Justificativa:</strong> ${look.justification}</p>
                </div>
            </a>
            `;
        }).join('');
    }

    // === FUNÇÃO MODIFICADA PARA ADICIONAR LINKS ===
    function renderPerfumes(perfumes) {
        const container = document.getElementById('perfumes-results');
        container.innerHTML = perfumes.map(perfume => {
            // Cria um termo de busca e codifica para URL
            const searchQuery = encodeURIComponent(perfume.name);
            const searchUrl = `https://www.google.com/search?tbm=shop&q=${searchQuery}`;

            return `
            <a href="${searchUrl}" target="_blank" rel="noopener noreferrer" class="result-link">
                <div class="card">
                    <h3>${perfume.name}</h3>
                    <span class="tag">Intensidade: ${perfume.intensity}</span>
                    <p><strong>Notas:</strong> ${perfume.notes}</p>
                    <p><strong>Preço Médio:</strong> R$ ${perfume.price_average.toFixed(2)}</p>
                    <p><strong>Justificativa:</strong> ${perfume.justification}</p>
                </div>
            </a>
            `;
        }).join('');
    }

    function renderPalette(palette) {
        const container = document.getElementById('palette-results');
        const justificationEl = document.getElementById('palette-justification');
        
        justificationEl.textContent = palette.justification;
        container.innerHTML = palette.colors.map(color => `
            <div class="color-swatch">
                <div class="color-circle" style="background-color: ${color.hex};"></div>
                <div class="color-hex">${color.hex}</div>
            </div>
        `).join('');
    }

    function renderCharts(charts) {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false // Essencial para o gráfico se adaptar ao contêiner com altura fixa
        };

        // Radar Chart
        new Chart(document.getElementById('radar-chart').getContext('2d'), {
            type: 'radar',
            data: {
                labels: charts.radar.labels,
                datasets: [{
                    label: 'Seu Perfil',
                    data: charts.radar.data,
                    backgroundColor: 'rgba(232, 168, 124, 0.2)',
                    borderColor: 'rgba(232, 168, 124, 1)',
                    pointBackgroundColor: 'rgba(232, 168, 124, 1)',
                    pointBorderColor: '#fff',
                }]
            },
            options: chartOptions
        });

        // Bar Chart
        new Chart(document.getElementById('bar-chart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: charts.bar.labels,
                datasets: [{
                    label: 'Frequência / Interesse',
                    data: charts.bar.data,
                    backgroundColor: ['#E8A87C', '#C38D9E', '#85CDCA', '#2D2D2D', '#FDFBF7'],
                    borderColor: '#EAEAEA',
                    borderWidth: 1
                }]
            },
            options: {...chartOptions, indexAxis: 'y' }
        });

        // Price Chart
        new Chart(document.getElementById('price-chart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: charts.price.labels,
                datasets: [{
                    label: 'Preço Médio (R$)',
                    data: charts.price.data,
                    backgroundColor: ['#E8A87C', '#C38D9E', '#85CDCA', '#2D2D2D'],
                }]
            },
            options: chartOptions
        });
    }

    // Event Listeners
    nextBtn.addEventListener('click', handleNext);
    prevBtn.addEventListener('click', handlePrev);
    submitBtn.addEventListener('click', handleSubmit);

    // Inicialização
    initializeForm();
});