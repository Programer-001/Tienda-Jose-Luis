import { useEffect, useState } from "react";
import { get, ref, set, update } from "firebase/database";
import { db } from "../firebase/configuracion";
import "../css/catalogosAlmacen.css";

type TipoCatalogo =
  | "departamentos"
  | "categorias"
  | "subcategorias"
  | "marcas";

type ItemCatalogo = {
  id: string;
  nombre: string;
  activo: boolean;
};

const tiposCatalogo: { key: TipoCatalogo; titulo: string; placeholder: string }[] = [
  {
    key: "departamentos",
    titulo: "DEPARTAMENTOS",
    placeholder: "Nuevo departamento",
  },
  {
    key: "categorias",
    titulo: "CATEGORÍAS",
    placeholder: "Nueva categoría",
  },
  {
    key: "subcategorias",
    titulo: "SUBCATEGORÍAS",
    placeholder: "Nueva subcategoría",
  },
  {
    key: "marcas",
    titulo: "MARCAS",
    placeholder: "Nueva marca",
  },
];

const crearId = (texto: string) => {
  return texto
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export default function CatalogosAlmacen() {
  const [seccionAbierta, setSeccionAbierta] =
    useState<TipoCatalogo | null>("departamentos");

  const [datos, setDatos] = useState<Record<TipoCatalogo, ItemCatalogo[]>>({
    departamentos: [],
    categorias: [],
    subcategorias: [],
    marcas: [],
  });

  const [inputs, setInputs] = useState<Record<TipoCatalogo, string>>({
    departamentos: "",
    categorias: "",
    subcategorias: "",
    marcas: "",
  });

  const [editando, setEditando] = useState<{
    tipo: TipoCatalogo;
    id: string;
  } | null>(null);

  const [cargando, setCargando] = useState(false);

  const cargarCatalogos = async () => {
    setCargando(true);

    const snap = await get(ref(db, "catalogosAlmacen"));

    const base: Record<TipoCatalogo, ItemCatalogo[]> = {
      departamentos: [],
      categorias: [],
      subcategorias: [],
      marcas: [],
    };

    if (snap.exists()) {
      const data = snap.val();

      tiposCatalogo.forEach(({ key }) => {
        const grupo = data[key] || {};

        base[key] = Object.entries(grupo).map(([id, value]: any) => ({
          id,
          nombre: value.nombre || id,
          activo: value.activo ?? true,
        }));
      });
    }

    setDatos(base);
    setCargando(false);
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const toggleSeccion = (tipo: TipoCatalogo) => {
    setSeccionAbierta((actual) => (actual === tipo ? null : tipo));
  };

  const guardarItem = async (tipo: TipoCatalogo) => {
    const nombre = inputs[tipo].trim().toUpperCase();

    if (!nombre) {
      alert("Escribe un nombre");
      return;
    }

    const id = editando?.tipo === tipo ? editando.id : crearId(nombre);

    await set(ref(db, `catalogosAlmacen/${tipo}/${id}`), {
      nombre,
      activo: true,
    });

    setInputs((prev) => ({ ...prev, [tipo]: "" }));
    setEditando(null);
    cargarCatalogos();
  };

  const editarItem = (tipo: TipoCatalogo, item: ItemCatalogo) => {
    setSeccionAbierta(tipo);
    setInputs((prev) => ({ ...prev, [tipo]: item.nombre }));
    setEditando({ tipo, id: item.id });
  };

  const cambiarEstado = async (tipo: TipoCatalogo, item: ItemCatalogo) => {
    await update(ref(db, `catalogosAlmacen/${tipo}/${item.id}`), {
      activo: !item.activo,
    });

    cargarCatalogos();
  };

  const cancelarEdicion = (tipo: TipoCatalogo) => {
    setInputs((prev) => ({ ...prev, [tipo]: "" }));
    setEditando(null);
  };

  return (
    <div className="catalogos-page">
      <div className="catalogos-card">
        <h2>CATÁLOGOS ALMACÉN</h2>
        <p className="catalogos-subtitulo">
          Administra departamentos, categorías, subcategorías y marcas.
        </p>

        {cargando && <p>Cargando catálogos...</p>}

        <div className="catalogos-acordeon">
          {tiposCatalogo.map(({ key, titulo, placeholder }) => {
            const abierto = seccionAbierta === key;
            const estaEditando = editando?.tipo === key;

            return (
              <div className="catalogo-seccion" key={key}>
                <button
                  type="button"
                  className="catalogo-header"
                  onClick={() => toggleSeccion(key)}
                >
                  <span>{abierto ? "▼" : "▶"} {titulo}</span>
                  <span className="catalogo-contador">
                    {datos[key].length} registros
                  </span>
                </button>

                {abierto && (
                  <div className="catalogo-contenido">
                    <div className="catalogo-form">
                      <input
                        value={inputs[key]}
                        placeholder={placeholder}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            [key]: e.target.value.toUpperCase(),
                          }))
                        }
                      />

                      <button
                        type="button"
                        className="btn-guardar"
                        onClick={() => guardarItem(key)}
                      >
                        {estaEditando ? "Actualizar" : "Guardar"}
                      </button>

                      {estaEditando && (
                        <button
                          type="button"
                          className="btn-cancelar"
                          onClick={() => cancelarEdicion(key)}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    <div className="catalogo-tabla-wrapper">
                      <table className="catalogo-tabla">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>

                        <tbody>
                          {datos[key].length === 0 ? (
                            <tr>
                              <td colSpan={3} className="sin-registros">
                                No hay registros
                              </td>
                            </tr>
                          ) : (
                            datos[key]
                              .sort((a, b) => a.nombre.localeCompare(b.nombre))
                              .map((item) => (
                                <tr key={item.id}>
                                  <td>{item.nombre}</td>

                                  <td>
                                    <span
                                      className={
                                        item.activo
                                          ? "estado-activo"
                                          : "estado-inactivo"
                                      }
                                    >
                                      {item.activo ? "ACTIVO" : "INACTIVO"}
                                    </span>
                                  </td>

                                  <td className="acciones">
                                    <button
                                      type="button"
                                      className="btn-editar"
                                      onClick={() => editarItem(key, item)}
                                    >
                                      Editar
                                    </button>

                                    <button
                                      type="button"
                                      className={
                                        item.activo
                                          ? "btn-desactivar"
                                          : "btn-activar"
                                      }
                                      onClick={() => cambiarEstado(key, item)}
                                    >
                                      {item.activo ? "Desactivar" : "Activar"}
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}