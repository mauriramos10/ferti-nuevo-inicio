from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from models import EquipoTipo, EquipoEstatus, OrdenEstado, Prioridad, AvisoEstado, OrdenTipo, ComentarioObjetivo

class ColaboradorBase(BaseModel):
    codigo: Optional[str] = None
    nombre: str
    puesto: Optional[str] = None
    telefono: str
    activo: bool = True

class ColaboradorCreate(ColaboradorBase):
    pass

class ColaboradorOut(ColaboradorBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class EquipoBase(BaseModel):
    codigo: str
    tipo: EquipoTipo
    descripcion: Optional[str] = None
    estatus: EquipoEstatus = EquipoEstatus.parqueado
    ubicacion_unidad: str
    ubicacion_sector: Optional[str] = None
    ubicacion_lote: Optional[str] = None
    ubicacion_referencia: Optional[str] = None
    responsable_id: Optional[int] = None

class EquipoCreate(EquipoBase):
    pass

class EquipoOut(EquipoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class OrdenBase(BaseModel):
    folio: Optional[str] = None
    tipo: OrdenTipo = OrdenTipo.asistencia
    estado: OrdenEstado = OrdenEstado.abierta
    prioridad: Prioridad = Prioridad.media
    descripcion: str

    ubicacion_unidad: str
    ubicacion_sector: Optional[str] = None
    ubicacion_lote: Optional[str] = None
    ubicacion_referencia: Optional[str] = None

    unidad_movil_id: int
    asignado_colaborador_id: int

    fecha_programada: Optional[datetime] = None
    fecha_inicio: Optional[datetime] = None
    fecha_cierre: Optional[datetime] = None

class OrdenCreate(OrdenBase):
    equipos_ids: List[int] = Field(default_factory=list)

class OrdenOut(OrdenBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class ComentarioCreate(BaseModel):
    objetivo_tipo: ComentarioObjetivo
    objetivo_id: int
    autor_colaborador_id: Optional[int] = None
    comentario: str

class ComentarioOut(BaseModel):
    id: int
    objetivo_tipo: ComentarioObjetivo
    objetivo_id: int
    autor_colaborador_id: Optional[int]
    comentario: str
    created_at: datetime
    class Config:
        from_attributes = True

class AvisoCreate(BaseModel):
    equipo_id: int
    titulo: str
    detalle: Optional[str] = None
    severidad: Prioridad = Prioridad.media
    estado: AvisoEstado = AvisoEstado.activo
    fecha_limite: Optional[date] = None

class AvisoOut(BaseModel):
    id: int
    equipo_id: int
    titulo: str
    detalle: Optional[str]
    severidad: Prioridad
    estado: AvisoEstado
    fecha_limite: Optional[date]
    created_at: datetime
    resuelto_at: Optional[datetime]
    class Config:
        from_attributes = True
