from perfis.permissions import IsGerente, IsGerenteOrReadOnly


class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    permission_classes = [IsGerenteOrReadOnly]
    # ... existing code ...
