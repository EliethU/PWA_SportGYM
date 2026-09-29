import React, { useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, Users, X } from 'lucide-react';
import '../Styles/ClientesView.css';
import Modal from './Modal';
import NuevoClienteView from './NuevoClienteView';

/* ------------------------------------------------------------------ */
/*  TOKENS DE DISEÑO                                                   */
/* ------------------------------------------------------------------ */
const C = {
  fondo: '#F2F5F0',
  tarjeta: '#FFFFFF',
  borde: '#E1E8DD',
  tinta: '#14201F',
  tintaSuave: '#66756F',
  verde: '#4C9A3A',
  verdeOscuro: '#173230',
  verdeClaro: '#E6F2E1',
  azul: '#2F80B8',
  azulClaro: '#E3F0F8',
  rojo: '#D64545',
  rojoClaro: '#FBE7E7',
  ambar: '#B96F0B',
  ambarClaro: '#FCF0DD',
};

const ESTADOS = {
  Pagada: { texto: C.verde, fondo: C.verdeClaro },
  Vencida: { texto: C.rojo, fondo: C.rojoClaro },
  'Por vencer': { texto: C.ambar, fondo: C.ambarClaro },
};

/* ------------------------------------------------------------------ */
/*  DATOS (mockup - sin base de datos)                                 */
/* ------------------------------------------------------------------ */
const CLIENTES = [];

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

/* ------------------------------------------------------------------ */
/*  COMPONENTES                                                        */
/* ------------------------------------------------------------------ */
function Estado({ valor }) {
  const e = ESTADOS[valor];
  return (
    <div className="estado" style={{ backgroundColor: e.fondo }}>
      <div className="estado-punto" style={{ backgroundColor: e.texto }} />
      <span className="estado-texto" style={{ color: e.texto }}>{valor}</span>
    </div>
  );
}

function Acciones({ onEditar, onEliminar }) {
  return (
    <div className="acciones">
      <button
        onClick={onEditar}
        className="accion accion-editar"
        title="Editar cliente"
      >
        <Edit size={18} color={C.azul} />
      </button>
      <button
        onClick={onEliminar}
        className="accion accion-eliminar"
        title="Eliminar cliente"
      >
        <Trash2 size={18} color={C.rojo} />
      </button>
    </div>
  );
}

function Avatar({ nombre }) {
  return (
    <div className="avatar">
      <span className="avatar-texto">{iniciales(nombre)}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  VISTA                                                             */
/* ------------------------------------------------------------------ */
export default function ClientesView({ onNuevo, onEditar, onEliminar }) {
  const [busqueda, setBusqueda] = useState('');
  const [enfoque, setEnfoque] = useState(false);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  const handleNuevo = () => {
    setMostrarNuevo(true);
    onNuevo?.();
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return CLIENTES;
    return CLIENTES.filter(
      (c) => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
    );
  }, [busqueda]);

  return (
    <div className="clientes-view">
      <div className="clientes-container">
        {/* Título + acción principal */}
        <div className="titulo">
          <div style={{ flex: 1 }}>
            <h1 className="h1">Clientes</h1>
            <p className="subtitulo">{CLIENTES.length} clientes registrados</p>
          </div>
          <button
            onClick={handleNuevo}
            className="boton-primario"
          >
            <Plus size={20} color="#fff" />
            <span className="boton-primario-texto">Nuevo cliente</span>
          </button>
        </div>

        {/* Buscador */}
        <div className={`buscador ${enfoque ? 'buscador-enfoque' : ''}`}>
          <Search size={18} color={C.tintaSuave} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => setEnfoque(true)}
            onBlur={() => setEnfoque(false)}
            placeholder="Buscar por nombre o teléfono"
            className="buscador-input"
          />
          {busqueda.length > 0 && (
            <button onClick={() => setBusqueda('')} className="buscador-limpiar">
              <X size={18} color="#9AA79F" />
            </button>
          )}
        </div>

        {/* Listado */}
        <div className="tarjeta">
          <div className="fila-encabezado">
            <span className="th th-nombre">Nombre completo</span>
            <span className="th th-telefono">Teléfono</span>
            <span className="th th-inscripcion">Inscripción</span>
            <span className="th th-membresia">Membresía</span>
            <span className="th th-estado">Estado</span>
            <span className="th th-acciones">Acciones</span>
          </div>

          {filtrados.length === 0 ? (
            <div className="vacio">
              <Users size={40} color={C.borde} />
              <h3 className="vacio-titulo">No hay resultados</h3>
              <p className="vacio-texto">Prueba con otro nombre o número de teléfono.</p>
            </div>
          ) : (
            filtrados.map((c, i) => {
              const ultimo = i === filtrados.length - 1;
              const acciones = (
                <Acciones onEditar={() => onEditar?.(c)} onEliminar={() => onEliminar?.(c)} />
              );

              return (
                <div key={c.id} className={`fila ${ultimo ? 'fila-ultima' : ''}`}>
                  <div className="celda-nombre">
                    <Avatar nombre={c.nombre} />
                    <span className="nombre">{c.nombre}</span>
                  </div>
                  <span className="td td-telefono">{c.telefono}</span>
                  <span className="td td-inscripcion">{c.inscripcion}</span>
                  <span className="td td-membresia">{c.membresia}</span>
                  <div className="td td-estado">
                    <Estado valor={c.estado} />
                  </div>
                  <div className="td td-acciones">{acciones}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL PARA NUEVO CLIENTE */}
      <Modal
        isOpen={mostrarNuevo}
        onClose={() => setMostrarNuevo(false)}
        title="Nuevo Cliente"
        size="medium"
      >
        <NuevoClienteView
          onVolver={() => setMostrarNuevo(false)}
          onGuardar={(datos) => {
            console.log('Guardar cliente:', datos);
            setMostrarNuevo(false);
          }}
        />
      </Modal>

    </div>
  );
}