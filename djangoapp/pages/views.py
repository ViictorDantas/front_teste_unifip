from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods
from django.contrib import messages
from django.conf import settings
from .services import get_client, obtain_token, refresh_token
import httpx


def _get_tokens(session):
    return session.get('access'), session.get('refresh')


def _save_tokens(session, access: str, refresh: str | None = None):
    session['access'] = access
    if refresh:
        session['refresh'] = refresh


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.method == "POST":
        email = request.POST.get('email', '')
        password = request.POST.get('password', '')
        try:
            tokens = obtain_token(email, password)   # <-- email aqui
            _save_tokens(request.session, tokens.get(
                'access'), tokens.get('refresh'))
            return redirect('index')
        except httpx.HTTPStatusError as e:
            messages.error(
                request, f"Login falhou: {e.response.status_code} - {e.response.text}")
        except Exception:
            messages.error(request, "Erro inesperado ao tentar logar.")
    return render(request, 'login.html')


def logout_view(request):
    request.session.flush()
    return redirect('login')


def index(request):
    access, refresh = _get_tokens(request.session)
    if not access:
        return redirect('login')

    with get_client(access) as api:
        r = api.get('/cursos/')
        if r.status_code == 401 and refresh:
            try:
                new_tokens = refresh_token(refresh)
                _save_tokens(request.session, new_tokens.get(
                    'access'))
                r = get_client(new_tokens.get('access')).get('/cursos/')
            except Exception:
                request.session.flush()
                return redirect('login')
        try:
            r.raise_for_status()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                messages.error(
                    request, "Você não tem permissão para acessar os cursos.")
                request.session.flush()
                return redirect('login')
            raise
        cursos = r.json()

    return render(request, 'index.html', {'cursos': cursos, 'API_BASE_URL': settings.API_BASE_URL})


@require_http_methods(["GET"])
def curso_detail_view(request, pk):
    access, refresh = _get_tokens(request.session)
    if not access:
        messages.error(
            request, "Você precisa estar logado para ver os detalhes do curso.")
        return redirect('login')

    try:
        with get_client(access) as api:
            curso_response = api.get(f'{settings.API_BASE_URL}/cursos/{pk}/')
            curso_response.raise_for_status()
            curso = curso_response.json()

            disciplinas = []
            try:
                disciplinas_url = f'{settings.API_BASE_URL}/disciplinas/?curso={pk}'
                disciplinas_response = api.get(disciplinas_url)
                disciplinas_response.raise_for_status()
                disciplinas = disciplinas_response.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    messages.info(
                        request, "Nenhuma disciplina encontrada para este curso.")
                    disciplinas = []
                else:
                    raise

            total_disciplinas_ativas = 0
            soma_carga_horaria_disciplinas_ativas = 0
            if disciplinas.get('results'):
                total_disciplinas_ativas = len(disciplinas['results'])
                soma_carga_horaria_disciplinas_ativas = sum(
                    d.get('carga_horaria', 0) for d in disciplinas['results'])
            elif isinstance(disciplinas, list):
                total_disciplinas_ativas = len(disciplinas)
                soma_carga_horaria_disciplinas_ativas = sum(
                    d.get('carga_horaria', 0) for d in disciplinas)

            context = {
                'curso': curso,
                'disciplinas': disciplinas,
                'total_disciplinas_ativas': total_disciplinas_ativas,
                'soma_carga_horaria_disciplinas_ativas': soma_carga_horaria_disciplinas_ativas,
                'API_BASE_URL': settings.API_BASE_URL,
            }
            return render(request, 'curso_detail.html', context)

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            messages.error(
                request, "Você não tem permissão para acessar este curso.")
            request.session.flush()
            return redirect('login')
        elif e.response.status_code == 404:
            messages.error(request, "Curso não encontrado.")
            return redirect('index')
        else:
            messages.error(
                request, f"Erro ao carregar curso: {e.response.status_code} - {e.response.text}")
            return redirect('index')
    except Exception as e:
        messages.error(request, f"Erro inesperado ao carregar curso: {e}")
        return redirect('index')
