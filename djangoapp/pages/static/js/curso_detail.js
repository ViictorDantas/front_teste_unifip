document.addEventListener('DOMContentLoaded', function() {
    const disciplinaSearchInput = document.getElementById('disciplinaSearchInput');
    const disciplinasTableContainer = document.getElementById('disciplinasTableContainer');
    const cursoId = "{{ curso.id }}";
    const API_BASE_URL = "{{ API_BASE_URL }}";

    function renderDisciplinas(disciplinas) {
        let tbodyHtml = '';
        let totalDisciplinasAtivas = 0;
        let somaCargaHorariaDisciplinasAtivas = 0;

        if (disciplinas.length === 0) {
            tbodyHtml = `
                <tr>
                    <td colspan="4" class="text-center">Nenhuma disciplina encontrada para este curso.</td>
                </tr>
            `;
        } else {
            disciplinas.forEach(d => {
                totalDisciplinasAtivas++;
                somaCargaHorariaDisciplinasAtivas += d.carga_horaria || 0;
                tbodyHtml += `
                    <tr>
                        <td>${d.codigo}</td>
                        <td>${d.nome}</td>
                        <td>${d.carga_horaria}</td>
                        <td>${d.ativo ? "Sim" : "Não"}</td>
                    </tr>
                `;
            });
        }

        disciplinasTableContainer.querySelector('tbody').innerHTML = tbodyHtml;
        disciplinasTableContainer.querySelector('tfoot tr:nth-child(1) td:nth-child(2)').textContent = totalDisciplinasAtivas;
        disciplinasTableContainer.querySelector('tfoot tr:nth-child(2) td:nth-child(2)').textContent = `${somaCargaHorariaDisciplinasAtivas} horas`;
    }

    async function filterDisciplinas(searchTerm) {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        
        let url = `${API_BASE_URL}/disciplinas/?curso=${cursoId}`;
        if (searchTerm) {
            url += `&search=${encodeURIComponent(searchTerm)}`;
        }

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Authorization': `Bearer {{ request.session.access }}`
                }
            });

            if (!response.ok) {
                if (response.headers.get('Content-Type') && !response.headers.get('Content-Type').includes('application/json')) {
                    console.error('Erro: Resposta não é JSON. Redirecionando para o login.');
                    window.location.href = '/login/'; 
                    return;
                }
                throw new Error(`Erro ao buscar disciplinas: ${response.status}`);
            }

            const data = await response.json();
            console.log('Disciplinas recebidas da API:', data);
            renderDisciplinas(data.results || data);

        } catch (error) {
            console.error('Erro ao buscar disciplinas:', error);
            
        }
    }

    // Initial load and event listeners
    const initialDisciplinasRawData = document.getElementById('disciplinas_data').textContent;
    const initialDisciplinasParsedData = JSON.parse(initialDisciplinasRawData);
    const initialDisciplinas = Array.isArray(initialDisciplinasParsedData) ? initialDisciplinasParsedData : (initialDisciplinasParsedData.results || []);
    console.log('Disciplinas parseadas (carga inicial):', initialDisciplinas);
    renderDisciplinas(initialDisciplinas);

    let searchTimeout;

    disciplinaSearchInput.addEventListener('keyup', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterDisciplinas(this.value);
        }, 300); 
    });
});