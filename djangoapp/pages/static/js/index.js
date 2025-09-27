    const API_BASE_URL = "{{ API_BASE_URL }}";
document.addEventListener('DOMContentLoaded', function() {
    const addCursoForm = document.getElementById('addCursoForm');
    const addCursoModalElement = document.getElementById('addCursoModal');
    const addCursoModal = new bootstrap.Modal(addCursoModalElement);
    const addCursoMessages = document.getElementById('addCursoMessages');
    const deleteCursoModalElement = document.getElementById('deleteCursoModal');
    const deleteCursoModal = new bootstrap.Modal(deleteCursoModalElement);
    const cursoToDeleteIdInput = document.getElementById('cursoToDeleteId');
    const cursoToDeleteNomeStrong = document.getElementById('cursoToDeleteNome');
    const confirmDeleteCursoBtn = document.getElementById('confirmDeleteCursoBtn');
    const deleteCursoMessages = document.getElementById('deleteCursoMessages');

    const editCursoModalElement = document.getElementById('editCursoModal');
    const editCursoModal = new bootstrap.Modal(editCursoModalElement);
    const editCursoForm = document.getElementById('editCursoForm');
    const editCursoIdInput = document.getElementById('editCursoId');
    const editCodigoInput = document.getElementById('editCodigo');
    const editNomeInput = document.getElementById('editNome');
    const editDescricaoInput = document.getElementById('editDescricao');
    const editCargaHorariaTotalInput = document.getElementById('editCargaHorariaTotal');
    const editAtivoInput = document.getElementById('editAtivo');
    const editCursoMessages = document.getElementById('editCursoMessages');

    function showMessage(message, type, targetElement) {
        targetElement.textContent = message;
        targetElement.className = `alert alert-${type}`;
        targetElement.style.display = 'block';
    }

    addCursoForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const formData = new FormData(addCursoForm);
        const data = Object.fromEntries(formData.entries());
        data.ativo = true; // Assumimos que o curso é criado como ativo

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch(`${API_BASE_URL}/cursos/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'Authorization': `Bearer {{ request.session.access }}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = `Erro ao adicionar curso: ${response.status}`;
                if (errorData) {
                    for (const field in errorData) {
                        errorMessage += `\n${field}: ${errorData[field].join(', ')}`;
                    }
                }
                throw new Error(errorMessage);
            }

            showMessage("Curso adicionado com sucesso!", "success", addCursoMessages);
            addCursoForm.reset();
            // setTimeout(() => { location.reload(); }, 1500);
            filterCursos('');
            addCursoModal.hide();

        } catch (error) {
            console.error('Erro:', error);
            showMessage(error.message || "Erro inesperado ao adicionar curso.", "danger", addCursoMessages);
        }
    });

    addCursoModalElement.addEventListener('hidden.bs.modal', function () {
        addCursoMessages.style.display = 'none';
        addCursoMessages.textContent = '';
        addCursoMessages.className = 'alert';
        addCursoForm.reset();
    });

    // Delete Curso Logic
    document.querySelectorAll('.delete-curso-btn').forEach(button => {
        button.addEventListener('click', function() {
            const cursoId = this.dataset.cursoId;
            const card = this.closest('.card');
            const cursoNome = card.querySelector('.card-title').textContent;

            cursoToDeleteIdInput.value = cursoId;
            cursoToDeleteNomeStrong.textContent = cursoNome;
        });
    });

    confirmDeleteCursoBtn.addEventListener('click', async function() {
        const cursoId = cursoToDeleteIdInput.value;
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch(`${API_BASE_URL}/cursos/${cursoId}/`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Authorization': `Bearer {{ request.session.access }}`
                }
            });

            if (!response.ok) {
                let errorMessage = `Erro ao excluir curso: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.detail) {
                        errorMessage += ` - ${errorData.detail}`;
                    }
                } catch (jsonError) {
                    // If response is not JSON, just use status
                }
                throw new Error(errorMessage);
            }

            showMessage("Curso excluído com sucesso!", "success", deleteCursoMessages);
            deleteCursoModal.hide(); // Hide the modal manually if using Bootstrap 5
            // setTimeout(() => { location.reload(); }, 1500);
            filterCursos('');

        } catch (error) {
            console.error('Erro ao deletar:', error);
            showMessage(error.message || "Erro inesperado ao excluir curso.", "danger", deleteCursoMessages);
        }
    });

    // Clear delete messages when modal is hidden
    deleteCursoModalElement.addEventListener('hidden.bs.modal', function () {
        deleteCursoMessages.style.display = 'none';
        deleteCursoMessages.textContent = '';
        deleteCursoMessages.className = 'alert';
    });

    // Edit Curso Logic
    document.querySelectorAll('.edit-curso-btn').forEach(button => {
        button.addEventListener('click', function() {
            editCursoIdInput.value = this.dataset.cursoId;
            editCodigoInput.value = this.dataset.cursoCodigo;
            editNomeInput.value = this.dataset.cursoNome;
            editDescricaoInput.value = this.dataset.cursoDescricao;
            editCargaHorariaTotalInput.value = this.dataset.cursoCargaHoraria;
            editAtivoInput.checked = (this.dataset.cursoAtivo === 'true');
        });
    });

    editCursoForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const cursoId = editCursoIdInput.value;
        const formData = new FormData(editCursoForm);
        const data = Object.fromEntries(formData.entries());
        data.ativo = editAtivoInput.checked;

        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            const response = await fetch(`${API_BASE_URL}/cursos/${cursoId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'Authorization': `Bearer {{ request.session.access }}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = `Erro ao editar curso: ${response.status}`;
                if (errorData) {
                    for (const field in errorData) {
                        errorMessage += `\n${field}: ${errorData[field].join(', ')}`;
                    }
                }
                throw new Error(errorMessage);
            }

            showMessage("Curso editado com sucesso!", "success", editCursoMessages);
            editCursoModal.hide();
            // setTimeout(() => { location.reload(); }, 1500);
            filterCursos('');

        } catch (error) {
            console.error('Erro ao editar:', error);
            showMessage(error.message || "Erro inesperado ao editar curso.", "danger", editCursoMessages);
        }
    });

    editCursoModalElement.addEventListener('hidden.bs.modal', function () {
        editCursoMessages.style.display = 'none';
        editCursoMessages.textContent = '';
        editCursoMessages.className = 'alert';
        editCursoForm.reset();
    });

    // Curso Search Logic
    const searchInput = document.getElementById('searchInput');
    const cursosListContainer = document.getElementById('cursosListContainer');

    let searchTimeout;

    searchInput.addEventListener('keyup', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterCursos(this.value);
        }, 300);
    });

    async function filterCursos(searchTerm) {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        let url = `${API_BASE_URL}/cursos/`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
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
                throw new Error(`Erro ao buscar cursos: ${response.status}`);
            }

            const data = await response.json();
            renderCursos(data.results || data);

        } catch (error) {
            console.error('Erro ao buscar cursos:', error);

        }
    }

    function renderCursos(cursos) {
        cursosListContainer.innerHTML = ''; 
        if (cursos.length === 0) {
            cursosListContainer.innerHTML = '<p>Nenhum curso encontrado.</p>';
            return;
        }

        let html = '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">';
        cursos.forEach(c => {
            html += `
            <div class="col">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${c.nome || "Sem nome"}</h5>
                        <p class="card-text"><small class="text-muted">Código: ${c.codigo}</small></p>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <a href="/cursos/${c.id}/" class="btn btn-sm btn-info">Detalhes</a>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-warning edit-curso-btn" 
                                data-bs-toggle="modal" data-bs-target="#editCursoModal" 
                                data-curso-id="${c.id}" 
                                data-curso-codigo="${c.codigo}" 
                                data-curso-nome="${c.nome}" 
                                data-curso-descricao="${c.descricao || ''}" 
                                data-curso-carga-horaria="${c.carga_horaria_total}"
                                data-curso-ativo="${c.ativo}"
                            >Editar</button>
                            <button type="button" class="btn btn-sm btn-danger delete-curso-btn" 
                                data-bs-toggle="modal" data-bs-target="#deleteCursoModal" 
                                data-curso-id="${c.id}"
                            >Excluir</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });
        html += '</div>';
        cursosListContainer.innerHTML = html;

        attachCursoEventListeners();
    }

    function attachCursoEventListeners() {
        document.querySelectorAll('.delete-curso-btn').forEach(button => {
            button.addEventListener('click', function() {
                const cursoId = this.dataset.cursoId;
                const card = this.closest('.card');
                const cursoNome = card.querySelector('.card-title').textContent;
                cursoToDeleteIdInput.value = cursoId;
                cursoToDeleteNomeStrong.textContent = cursoNome;
            });
        });

        document.querySelectorAll('.edit-curso-btn').forEach(button => {
            button.addEventListener('click', function() {
                editCursoIdInput.value = this.dataset.cursoId;
                editCodigoInput.value = this.dataset.cursoCodigo;
                editNomeInput.value = this.dataset.cursoNome;
                editDescricaoInput.value = this.dataset.cursoDescricao;
                editCargaHorariaTotalInput.value = this.dataset.cursoCargaHoraria;
                editAtivoInput.checked = (this.dataset.cursoAtivo === 'true');
            });
        });
    }


    attachCursoEventListeners();
    filterCursos('');
});
