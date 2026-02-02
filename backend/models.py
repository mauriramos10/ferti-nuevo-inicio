from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Text, ForeignKey,
    Enum, Date
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from db import Base

class EquipoTipo(str, enum.Enum):
    tractor = "tractor"
    implemento = "implemento"
    unidad_movil = "unidad_movil"

class EquipoEstatus(str, enum.Enum):
    operando = "operando"
    parqueado = "parqueado"
    mantenimiento = "mantenimiento"
    fuera_servicio = "fuera_servicio"

class OrdenEstado(str, enum.Enum):
    abierta = "abierta"
    en_proceso = "en_proceso"
    cerrada = "cerrada"
    cancelada = "cancelada"

class Prioridad(str, enum.Enum):
    baja = "baja"
    media = "media"
    alta = "alta"

class AvisoEstado(str, enum.Enum):
    activo = "activo"
    resuelto = "resuelto"

class OrdenTipo(str, enum.Enum):
    asistencia = "asistencia"
    preventivo = "preventivo"
    correctivo = "correctivo"

class ComentarioObjetivo(str, enum.Enum):
    equipo = "equipo"
    orden = "orden"

class Colaborador(Base):
    __tablename__ = "colaboradores"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=True)
    nombre = Column(String, nullable=False)
    puesto = Column(String, nullable=True)
    telefono = Column(String, nullable=False)
    activo = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Equipo(Base):
    __tablename__ = "equipos"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, nullable=False, index=True)
    tipo = Column(Enum(EquipoTipo), nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    estatus = Column(Enum(EquipoEstatus), default=EquipoEstatus.parqueado, nullable=False, index=True)

    ubicacion_unidad = Column(String, nullable=False, index=True)
    ubicacion_sector = Column(String, nullable=True, index=True)
    ubicacion_lote = Column(String, nullable=True, index=True)
    ubicacion_referencia = Column(String, nullable=True)

    responsable_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=True)
    responsable = relationship("Colaborador", foreign_keys=[responsable_id])

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Orden(Base):
    __tablename__ = "ordenes"
    id = Column(Integer, primary_key=True, index=True)
    folio = Column(String, unique=True, nullable=True, index=True)

    tipo = Column(Enum(OrdenTipo), default=OrdenTipo.asistencia, nullable=False)
    estado = Column(Enum(OrdenEstado), default=OrdenEstado.abierta, nullable=False, index=True)
    prioridad = Column(Enum(Prioridad), default=Prioridad.media, nullable=False, index=True)

    descripcion = Column(Text, nullable=False)

    ubicacion_unidad = Column(String, nullable=False, index=True)
    ubicacion_sector = Column(String, nullable=True, index=True)
    ubicacion_lote = Column(String, nullable=True, index=True)
    ubicacion_referencia = Column(String, nullable=True)

    unidad_movil_id = Column(Integer, ForeignKey("equipos.id"), nullable=False, index=True)
    unidad_movil = relationship("Equipo", foreign_keys=[unidad_movil_id])

    asignado_colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=False, index=True)
    asignado = relationship("Colaborador", foreign_keys=[asignado_colaborador_id])

    fecha_programada = Column(DateTime, nullable=True)
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_cierre = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class OrdenEquipo(Base):
    __tablename__ = "orden_equipos"
    orden_id = Column(Integer, ForeignKey("ordenes.id", ondelete="CASCADE"), primary_key=True)
    equipo_id = Column(Integer, ForeignKey("equipos.id", ondelete="RESTRICT"), primary_key=True)

class Comentario(Base):
    __tablename__ = "comentarios"
    id = Column(Integer, primary_key=True, index=True)
    objetivo_tipo = Column(Enum(ComentarioObjetivo), nullable=False, index=True)
    objetivo_id = Column(Integer, nullable=False, index=True)

    autor_colaborador_id = Column(Integer, ForeignKey("colaboradores.id"), nullable=True)
    autor = relationship("Colaborador", foreign_keys=[autor_colaborador_id])

    comentario = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Aviso(Base):
    __tablename__ = "avisos"
    id = Column(Integer, primary_key=True, index=True)
    equipo_id = Column(Integer, ForeignKey("equipos.id", ondelete="CASCADE"), nullable=False, index=True)
    equipo = relationship("Equipo", foreign_keys=[equipo_id])

    titulo = Column(String, nullable=False)
    detalle = Column(Text, nullable=True)
    severidad = Column(Enum(Prioridad), default=Prioridad.media, nullable=False, index=True)
    estado = Column(Enum(AvisoEstado), default=AvisoEstado.activo, nullable=False, index=True)

    fecha_limite = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resuelto_at = Column(DateTime, nullable=True)
