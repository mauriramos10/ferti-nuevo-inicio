from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from datetime import datetime

from db import Base, engine, get_db
import models
import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ferti - Nuevo Inicio (MVP)", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringe a tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def validar_unidad_movil(db: Session, unidad_movil_id: int):
    eq = db.get(models.Equipo, unidad_movil_id)
    if not eq:
        raise HTTPException(404, "Unidad móvil no existe")
    if eq.tipo != models.EquipoTipo.unidad_movil:
        raise HTTPException(400, "unidad_movil_id no es de tipo unidad_movil")
    return eq

@app.post("/colaboradores", response_model=schemas.ColaboradorOut)
def crear_colaborador(payload: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    obj = models.Colaborador(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.get("/colaboradores", response_model=list[schemas.ColaboradorOut])
def listar_colaboradores(activo: bool | None = None, db: Session = Depends(get_db)):
    stmt = select(models.Colaborador)
    if activo is not None:
        stmt = stmt.where(models.Colaborador.activo == activo)
    return db.scalars(stmt.order_by(models.Colaborador.nombre.asc())).all()

@app.put("/colaboradores/{colaborador_id}", response_model=schemas.ColaboradorOut)
def actualizar_colaborador(colaborador_id: int, payload: schemas.ColaboradorCreate, db: Session = Depends(get_db)):
    obj = db.get(models.Colaborador, colaborador_id)
    if not obj:
        raise HTTPException(404, "Colaborador no existe")
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj

@app.post("/equipos", response_model=schemas.EquipoOut)
def crear_equipo(payload: schemas.EquipoCreate, db: Session = Depends(get_db)):
    obj = models.Equipo(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.get("/equipos", response_model=list[schemas.EquipoOut])
def listar_equipos(
    tipo: models.EquipoTipo | None = None,
    estatus: models.EquipoEstatus | None = None,
    codigo: str | None = None,
    ubicacion_unidad: str | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(models.Equipo)
    if tipo:
        stmt = stmt.where(models.Equipo.tipo == tipo)
    if estatus:
        stmt = stmt.where(models.Equipo.estatus == estatus)
    if codigo:
        stmt = stmt.where(models.Equipo.codigo.ilike(f"%{codigo}%"))
    if ubicacion_unidad:
        stmt = stmt.where(models.Equipo.ubicacion_unidad.ilike(f"%{ubicacion_unidad}%"))
    return db.scalars(stmt.order_by(models.Equipo.codigo.asc())).all()

@app.put("/equipos/{equipo_id}", response_model=schemas.EquipoOut)
def actualizar_equipo(equipo_id: int, payload: schemas.EquipoCreate, db: Session = Depends(get_db)):
    obj = db.get(models.Equipo, equipo_id)
    if not obj:
        raise HTTPException(404, "Equipo no existe")
    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj

@app.post("/ordenes", response_model=schemas.OrdenOut)
def crear_orden(payload: schemas.OrdenCreate, db: Session = Depends(get_db)):
    validar_unidad_movil(db, payload.unidad_movil_id)

    orden = models.Orden(**payload.model_dump(exclude={"equipos_ids"}))
    db.add(orden)
    db.commit()
    db.refresh(orden)

    for eq_id in payload.equipos_ids:
        eq = db.get(models.Equipo, eq_id)
        if not eq:
            raise HTTPException(404, f"Equipo {eq_id} no existe")
        if eq.tipo == models.EquipoTipo.unidad_movil:
            raise HTTPException(400, "No agregues unidad_movil en equipos_ids (ya va en unidad_movil_id)")
        db.add(models.OrdenEquipo(orden_id=orden.id, equipo_id=eq_id))

    db.commit()
    return orden

@app.get("/ordenes", response_model=list[schemas.OrdenOut])
def listar_ordenes(
    estado: models.OrdenEstado | None = None,
    prioridad: models.Prioridad | None = None,
    unidad_movil_id: int | None = None,
    asignado_colaborador_id: int | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(models.Orden)
    if estado:
        stmt = stmt.where(models.Orden.estado == estado)
    if prioridad:
        stmt = stmt.where(models.Orden.prioridad == prioridad)
    if unidad_movil_id:
        stmt = stmt.where(models.Orden.unidad_movil_id == unidad_movil_id)
    if asignado_colaborador_id:
        stmt = stmt.where(models.Orden.asignado_colaborador_id == asignado_colaborador_id)
    return db.scalars(stmt.order_by(models.Orden.created_at.desc())).all()

@app.put("/ordenes/{orden_id}", response_model=schemas.OrdenOut)
def actualizar_orden(orden_id: int, payload: schemas.OrdenBase, db: Session = Depends(get_db)):
    obj = db.get(models.Orden, orden_id)
    if not obj:
        raise HTTPException(404, "Orden no existe")
    validar_unidad_movil(db, payload.unidad_movil_id)

    for k, v in payload.model_dump().items():
        setattr(obj, k, v)
    obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj

@app.get("/ordenes/{orden_id}/equipos", response_model=list[schemas.EquipoOut])
def equipos_de_orden(orden_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        select(models.Equipo)
        .join(models.OrdenEquipo, models.OrdenEquipo.equipo_id == models.Equipo.id)
        .where(models.OrdenEquipo.orden_id == orden_id)
    ).scalars().all()
    return rows

@app.post("/comentarios", response_model=schemas.ComentarioOut)
def crear_comentario(payload: schemas.ComentarioCreate, db: Session = Depends(get_db)):
    if payload.objetivo_tipo == models.ComentarioObjetivo.equipo:
        if not db.get(models.Equipo, payload.objetivo_id):
            raise HTTPException(404, "Equipo objetivo no existe")
    if payload.objetivo_tipo == models.ComentarioObjetivo.orden:
        if not db.get(models.Orden, payload.objetivo_id):
            raise HTTPException(404, "Orden objetivo no existe")

    obj = models.Comentario(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.get("/comentarios", response_model=list[schemas.ComentarioOut])
def listar_comentarios(objetivo_tipo: models.ComentarioObjetivo, objetivo_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(models.Comentario)
        .where(and_(
            models.Comentario.objetivo_tipo == objetivo_tipo,
            models.Comentario.objetivo_id == objetivo_id
        ))
        .order_by(models.Comentario.created_at.desc())
    )
    return db.scalars(stmt).all()

@app.post("/avisos", response_model=schemas.AvisoOut)
def crear_aviso(payload: schemas.AvisoCreate, db: Session = Depends(get_db)):
    if not db.get(models.Equipo, payload.equipo_id):
        raise HTTPException(404, "Equipo no existe")
    obj = models.Aviso(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@app.get("/avisos", response_model=list[schemas.AvisoOut])
def listar_avisos(estado: models.AvisoEstado | None = None, equipo_id: int | None = None, db: Session = Depends(get_db)):
    stmt = select(models.Aviso)
    if estado:
        stmt = stmt.where(models.Aviso.estado == estado)
    if equipo_id:
        stmt = stmt.where(models.Aviso.equipo_id == equipo_id)
    return db.scalars(stmt.order_by(models.Aviso.created_at.desc())).all()

@app.put("/avisos/{aviso_id}/resolver", response_model=schemas.AvisoOut)
def resolver_aviso(aviso_id: int, db: Session = Depends(get_db)):
    obj = db.get(models.Aviso, aviso_id)
    if not obj:
        raise HTTPException(404, "Aviso no existe")
    obj.estado = models.AvisoEstado.resuelto
    obj.resuelto_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj
