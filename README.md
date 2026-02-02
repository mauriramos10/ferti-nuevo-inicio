# Ferti - Nuevo Inicio (MVP)

Sistema web para:
- Colaboradores (con teléfono)
- Equipos (tractor / implemento / unidad móvil)
- Ubicación manual
- Estatus de equipo
- Órdenes con unidad móvil + colaborador + equipos atendidos
- Comentarios y avisos (API lista)

## Requisitos (sin Docker)
- Python 3.11+

## Ejecutar backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload
```

Backend queda en: http://127.0.0.1:8000

## Ejecutar frontend
Abre `frontend/index.html` con tu navegador (doble click).

## Docker (opcional)
```bash
docker compose up
```

## Notas
- Base de datos: SQLite (backend/ferti.db)
- CORS abierto para pruebas. Restringir en producción.
