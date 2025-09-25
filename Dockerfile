FROM python:3.11

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt /app/requirements.txt

RUN python -m venv /venv && /venv/bin/pip install -U pip && /venv/bin/pip install -r /app/requirements.txt

COPY . /app

ENV PATH="/venv/bin:$PATH"

EXPOSE 8080

CMD ["python", "manage.py", "runserver", "0.0.0.0:8080"]