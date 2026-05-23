import { useEffect, useMemo, useState } from "react";
import { get, push, ref, set, update,remove } from "firebase/database";
import { db } from "../firebase/configuracion";
import "../css/Proveedores.css";

interface Proveedor {
  id?: string;
  nombre: string;
  alias: string;
  rfc: string;
  telefono: string;
  whatsapp: string;
  email: string;
  domicilio: string;
  notas: string;
  activo?: boolean;
}

const proveedorVacio: Proveedor = {
  nombre: "",
  alias: "",
  rfc: "",
  telefono: "",
  whatsapp: "",
  email: "",
  domicilio: "",
  notas: "",
  activo: true,
};

export default function Proveedores() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [form, setForm] = useState<Proveedor>(proveedorVacio);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const cargarProveedores = async () => {
    const snapshot = await get(ref(db, "proveedores"));
    const data = snapshot.val() || {};

    const lista: Proveedor[] = Object.entries(data).map(
      ([id, value]: [string, any]) => ({
        id,
        nombre: value.nombre || "",
        alias: value.alias || "",
        rfc: value.rfc || "",
        telefono: value.telefono || "",
        whatsapp: value.whatsapp || "",
        email: value.email || "",
        domicilio: value.domicilio || "",
        notas: value.notas || "",
        activo: value.activo ?? true,
      })
    );

    setProveedores(lista);
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const proveedoresFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase();

    return proveedores.filter((p) =>
      `${p.nombre} ${p.alias} ${p.rfc}`.toLowerCase().includes(texto)
    );
  }, [proveedores, busqueda]);

  const handleChange = (campo: keyof Proveedor, valor: string) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const nuevoProveedor = () => {
    setForm(proveedorVacio);
    setEditandoId(null);
  };

  const seleccionarProveedor = (proveedor: Proveedor) => {
    setForm(proveedor);
    setEditandoId(proveedor.id || null);
  };
  // Eliminar proveedor
  const eliminarProveedor = async () => {
  if (!editandoId) return;

  const confirmar = confirm(
    "¿Seguro que quieres eliminar este proveedor?"
  );

  if (!confirmar) return;

  try {
    await remove(ref(db, `proveedores/${editandoId}`));

    nuevoProveedor();
    cargarProveedores();
  } catch (error) {
    console.error(error);
    alert("Error al eliminar proveedor");
  }
};
// Guardar proveedor (nuevo o editado)
  const guardarProveedor = async () => {
    if (!form.nombre.trim()) {
      alert("El proveedor necesita nombre.");
      return;
    }

    const datosProveedor = {
      nombre: form.nombre.trim().toUpperCase(),
      alias: form.alias.trim().toUpperCase(),
      rfc: form.rfc.trim().toUpperCase(),
      telefono: form.telefono.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      domicilio: form.domicilio.trim().toUpperCase(),
      notas: form.notas.trim(),
      activo: form.activo ?? true,
    };

    if (editandoId) {
      await update(ref(db, `proveedores/${editandoId}`), datosProveedor);
    } else {
      const nuevoRef = push(ref(db, "proveedores"));
      await set(nuevoRef, datosProveedor);
    }

    nuevoProveedor();
    cargarProveedores();
  };

  return (
    <div className="proveedores-layout">
      <section className="proveedores-card card">
        <div className="proveedores-header">
          <div>
            <h2>{editandoId ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            <p>Registra los proveedores para usarlos en almacén.</p>
          </div>

          <button className="btn azul" onClick={nuevoProveedor}>
            Nuevo
          </button>
        </div>
{/* Formulario de proveedor */}
        <div className="proveedores-form">
          <label>Nombre *</label>
          <input
            value={form.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            placeholder="Nombre del proveedor"
          />

          <label>Alias</label>
          <input
            value={form.alias}
            onChange={(e) => handleChange("alias", e.target.value)}
            placeholder="Nombre corto"
          />

          <label>RFC</label>
          <input
            value={form.rfc}
            onChange={(e) => handleChange("rfc", e.target.value)}
            placeholder="RFC"
          />

          <label>Teléfono</label>
          <input
            value={form.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            placeholder="Teléfono"
          />

          <label>WhatsApp</label>
          <input
            value={form.whatsapp}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            placeholder="WhatsApp"
          />

          <label>Email</label>
          <input
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="correo@ejemplo.com"
          />

          <label>Domicilio</label>
          <input
            value={form.domicilio}
            onChange={(e) => handleChange("domicilio", e.target.value)}
            placeholder="Dirección"
          />

          <label>Notas</label>
          <textarea
            value={form.notas}
            onChange={(e) => handleChange("notas", e.target.value)}
            placeholder="Notas del proveedor"
          />

          <button className="btn verde" onClick={guardarProveedor}>
            Guardar proveedor
          </button>
          {/* Si estamos editando, mostrar botón de eliminar */}
          {editandoId && (
            <button
                className="btn rojo"
                onClick={eliminarProveedor}
            >
                Eliminar proveedor
            </button>
            )}
          {/* Si el proveedor tiene domicilio, mostrar mapa */}
          {form.domicilio.trim() && (
        <div className="proveedor-mapa">
            <h3>Ubicación</h3>

            <iframe
            title="mapa-proveedor"
            width="100%"
            height="300"
            loading="lazy"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
                form.domicilio
            )}&output=embed`}
            />

            <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                form.domicilio
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            >
            Abrir en Google Maps
            </a>
        </div>
        )}
        </div>
      </section>
{/* Lista de proveedores */}
      <section className="proveedores-lista card">
        <h2>Libreta de proveedores</h2>

        <input
          className="buscador-proveedor"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar proveedor..."
        />

        <div className="proveedores-items">
          {proveedoresFiltrados.length === 0 ? (
            <div className="proveedor-vacio">No hay proveedores.</div>
          ) : (
            proveedoresFiltrados.map((p) => (
              <div
                key={p.id}
                className="proveedor-item"
                onClick={() => seleccionarProveedor(p)}
              >
                <strong>{p.alias || p.nombre}</strong>
                <span>{p.nombre}</span>
                <small>{p.telefono || "Sin teléfono"}</small>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}