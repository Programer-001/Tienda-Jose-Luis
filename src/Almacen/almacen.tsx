import { useEffect, useMemo, useState } from "react";
import { get, onValue, ref, set, update } from "firebase/database";
import JsBarcode from "jsbarcode";
import { db } from "../firebase/configuracion";
import { formatearMoneda, procesarInputMoneda } from "../funciones/formato_moneda";
import { formatearPeso } from "../funciones/formato_peso";
import "../css/Almacen.css";


interface Proveedor {
  id: string;
  nombre: string;
  alias: string;
}

interface ProductoAlmacen {
  id: string;
  codigoBarras?: string;
  nombre: string;
  precio: number;
  precioProveedor?: number;
  cantidad: number;
  proveedorId?: string;
  proveedorNombre?: string;
  nombreProveedor?: string;
  activo?: boolean;
  ventaPor?: "pieza" | "peso";
  unidad?: "pz" | "g";
  fecha?: string;
}

type ModoPanel = "ninguno" | "agregar" | "ingresar" | "detalle" | "editar";

const productoVacio: ProductoAlmacen = {
  id: "",
  codigoBarras: "",
  nombre: "",
  precio: 0,
  precioProveedor: 0,
  cantidad: 0,
  proveedorId: "",
  proveedorNombre: "",
  nombreProveedor: "",
  activo: true,
  ventaPor: "pieza",
  unidad: "pz",
};

export default function Almacen() {
  const [productos, setProductos] = useState<ProductoAlmacen[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [modoPanel, setModoPanel] = useState<ModoPanel>("ninguno");

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<ProductoAlmacen | null>(null);

  const [form, setForm] = useState<ProductoAlmacen>(productoVacio);
  const [precioTexto, setPrecioTexto] = useState("");

  const [productoStockId, setProductoStockId] = useState("");
  const [cantidadIngreso, setCantidadIngreso] = useState("");

  const [busqueda, setBusqueda] = useState("");

// nombre de la página
  useEffect(() => {
  document.title = "Almacén";
    }, []);

  useEffect(() => {
    const productosRef = ref(db, "almacen/productos");

    const cancelar = onValue(productosRef, (snapshot) => {
      const data = snapshot.val() || {};

      const lista: ProductoAlmacen[] = Object.entries(data).map(
        ([key, value]: [string, any]) => ({
          id: value.id || key,
          codigoBarras: value.codigoBarras || value.id || key,
          nombre: value.nombre || value.material || "",
          precio: Number(value.precio || 0),
          cantidad: Number(value.cantidad || 0),
          proveedorId: value.proveedorId || "",
          proveedorNombre: value.proveedorNombre || "",
          nombreProveedor: value.nombreProveedor || "",
          precioProveedor: Number(value.precioProveedor || 0),
          activo: value.activo ?? true,
          ventaPor: value.ventaPor || "pieza",
          unidad: value.unidad || "pz",
          fecha: value.fecha || "",
        })
      );

      lista.sort((a, b) => a.id.localeCompare(b.id));
      setProductos(lista);
    });

    return () => cancelar();
  }, []);
// Cargar proveedores para el select
  useEffect(() => {
    const cargarProveedores = async () => {
      const snapshot = await get(ref(db, "proveedores"));
      const data = snapshot.val() || {};

      const lista: Proveedor[] = Object.entries(data).map(
        ([id, value]: [string, any]) => ({
          id,
          nombre: value.nombre || "",
          alias: value.alias || "",
        })
      );

      setProveedores(lista);
    };

    cargarProveedores();
  }, []);
// Generar código de barras al seleccionar producto
useEffect(() => {
  const codigo = productoSeleccionado?.codigoBarras || productoSeleccionado?.id;

  if (codigo) {
    JsBarcode("#barcode-producto", codigo, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
    });
  }
}, [productoSeleccionado]);

  const totalPiezas = useMemo(() => {
    return productos.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  }, [productos]);

  const fechaHoy = () => new Date().toLocaleDateString("es-MX");

  const generarId = () => {
    const numeros = productos
      .map((p) => Number(p.id.replace("A", "")))
      .filter((n) => !isNaN(n));

    const siguiente = numeros.length ? Math.max(...numeros) + 1 : 1;
    return `A${String(siguiente).padStart(4, "0")}`;
  };

  const guardarMovimiento = async (movimiento: any) => {
    const idMovimiento = `${Date.now()}`;

    await set(ref(db, `almacen/movimientos/${idMovimiento}`), {
      ...movimiento,
      fecha: fechaHoy(),
      creadoEn: new Date().toISOString(),
    });
  };

  const limpiarFormulario = () => {
    setForm(productoVacio);
    setPrecioTexto("");
  };

  const abrirAgregar = () => {
    limpiarFormulario();
    setProductoSeleccionado(null);
    setModoPanel("agregar");
  };

  const seleccionarProducto = (producto: ProductoAlmacen) => {
    setProductoSeleccionado(producto);
    setForm(producto);
    setPrecioTexto(producto.precio ? formatearMoneda(producto.precio) : "");
    setModoPanel("detalle");
  };

  const abrirEditar = () => {
    if (!productoSeleccionado) return;

    setForm(productoSeleccionado);
    setPrecioTexto(
      productoSeleccionado.precio
        ? formatearMoneda(productoSeleccionado.precio)
        : ""
    );
    setModoPanel("editar");
  };

const handleForm = (
  campo: keyof ProductoAlmacen,
  valor: string | number | boolean
) => {
  setForm((prev) => ({
    ...prev,
    [campo]: valor,
  }));
};

  const handleProveedor = (proveedorId: string) => {
    const proveedor = proveedores.find((p) => p.id === proveedorId);

    setForm((prev) => ({
      ...prev,
      proveedorId,
      proveedorNombre: proveedor ? proveedor.alias || proveedor.nombre : "",
    }));
  };

  const guardarProducto = async () => {
    const nombre = form.nombre.trim().toUpperCase();

    if (!nombre) {
      alert("Escribe el nombre del producto.");
      return;
    }

    const idProducto = modoPanel === "editar" && form.id ? form.id : generarId();

    const datosProducto: ProductoAlmacen = {
      id: idProducto,
      codigoBarras: (form.codigoBarras || idProducto).trim().toUpperCase(),
      nombre,
      precio: Number(form.precio || 0),
      cantidad: Number(form.cantidad || 0),
      proveedorId: form.proveedorId || "",
      proveedorNombre: form.proveedorNombre || "",
      nombreProveedor: (form.nombreProveedor || "").trim().toUpperCase(),
      precioProveedor: Number(form.precioProveedor || 0),
      activo: form.activo ?? true,
      ventaPor: form.ventaPor || "pieza",
      unidad: form.ventaPor === "peso" ? "g" : "pz",
      fecha: fechaHoy(),
    };

    await set(ref(db, `almacen/productos/${idProducto}`), datosProducto);

    await guardarMovimiento({
      tipo: modoPanel === "editar" ? "edicion_producto" : "alta_producto",
      productoId: idProducto,
      productoNombre: nombre,
      cantidadNueva: datosProducto.cantidad,
      precio: datosProducto.precio,
      proveedorNombre: datosProducto.proveedorNombre,
    });

    limpiarFormulario();
    setProductoSeleccionado(datosProducto);
    setModoPanel("detalle");
  };

  const ingresarStock = async () => {
    const cantidadAgregar = Number(cantidadIngreso || 0);

    if (!productoStockId) {
      alert("Selecciona un producto.");
      return;
    }

    if (cantidadAgregar <= 0) {
      alert("La cantidad debe ser mayor a 0.");
      return;
    }

    const producto = productos.find((p) => p.id === productoStockId);

    if (!producto) {
      alert("No se encontró el producto.");
      return;
    }

    const cantidadAnterior = Number(producto.cantidad || 0);
    const cantidadNueva = cantidadAnterior + cantidadAgregar;

    await update(ref(db, `almacen/productos/${producto.id}`), {
      cantidad: cantidadNueva,
      fecha: fechaHoy(),
    });

    await guardarMovimiento({
      tipo: "ingreso_stock",
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidadMovimiento: cantidadAgregar,
      cantidadAnterior,
      cantidadNueva,
    });

    setProductoStockId("");
    setCantidadIngreso("");
    setModoPanel("ninguno");
  };

  const claseStock = (cantidad: number) => {
    if (cantidad <= 10) return "rojo-indicador";
    if (cantidad <= 30) return "amarillo-indicador";
    return "verde-indicador";
  };

  // Filtrar productos según búsqueda
  const productosFiltrados = useMemo(() => {
  const texto = busqueda.trim().toUpperCase();

  if (!texto) return productos;

  return productos.filter((p) => {
    return (
      p.id.toUpperCase().includes(texto) ||
      (p.codigoBarras || "").toUpperCase().includes(texto) ||
      p.nombre.toUpperCase().includes(texto) ||
      (p.proveedorNombre || "").toUpperCase().includes(texto) ||
      (p.nombreProveedor || "").toUpperCase().includes(texto)
    );
  });
}, [busqueda, productos]);

  return (
    <div className="almacen-layout">
      <section className="almacen-card card">
        <div className="almacen-header">
          <div>
            <h2>Almacén</h2>
            <p>Total piezas: {totalPiezas}</p>
          </div>

          <div className="almacen-actions">
            <button className="btn verde" onClick={abrirAgregar}>
              Agregar producto
            </button>

            <button className="btn azul" onClick={() => setModoPanel("ingresar")}>
              Ingresar stock
            </button>
          </div>
        </div>
        {/* Buscador de productos */}
      <div className="buscador-almacen">
      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, ID o código de barras..."
      />
    </div>
    {/* Tabla de productos */}
        <div className="tabla-scroll">
          <table className="almacen-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Proveedor</th>
                <th>Indicador</th>
              </tr>
            </thead>

            <tbody>
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="vacio">
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="fila-producto"
                    onClick={() => seleccionarProducto(item)}
                  >
                    <td>{item.id}</td>
                    <td>{item.nombre}</td>
                    <td className="cantidad">
                      {item.ventaPor === "peso"
                        ? formatearPeso(item.cantidad)
                        : item.cantidad}
                    </td>
                    <td>{item.proveedorNombre || "-"}</td>
                    <td>
                      <span className={`indicador ${claseStock(item.cantidad)}`} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="movimientos-card card">
        <div className="movimientos-header">
          <h2>Movimientos</h2>

          {modoPanel !== "ninguno" && (
            <button className="btn naranja" onClick={() => setModoPanel("ninguno")}>
              Cerrar
            </button>
          )}
        </div>

        {modoPanel === "ninguno" && (
          <div className="placeholder">
            Selecciona una acción:
            <br />
            agregar material, ingresar stock o selecciona un producto.
          </div>
        )}

        {modoPanel === "detalle" && productoSeleccionado && (
          <div className="detalle-producto">
            <h3>{productoSeleccionado.nombre}</h3>

            <p><strong>ID:</strong> {productoSeleccionado.id}</p>
            <p><strong>Precio:</strong> {formatearMoneda(productoSeleccionado.precio)}</p>
            <p><strong>Venta por:</strong>{" "}{productoSeleccionado.ventaPor === "peso" ? "Peso" : "Pieza"}</p>
            <p>
            <strong>Cantidad:</strong>{" "}
            {productoSeleccionado.ventaPor === "peso"
              ? formatearPeso(productoSeleccionado.cantidad)
              : productoSeleccionado.cantidad}
          </p>
            <p><strong>Proveedor:</strong> {productoSeleccionado.proveedorNombre || "-"}</p>
            <p><strong>Nombre con proveedor:</strong> {productoSeleccionado.nombreProveedor || "-"}</p>
            <p><strong>Precio proveedor:</strong>{" "}{formatearMoneda(productoSeleccionado.precioProveedor || 0)}</p>
            <p><strong>Activo:</strong>{" "}{productoSeleccionado.activo ? "Sí" : "No"}</p>

            <div className="movimiento-barcode">
            <svg id="barcode-producto"></svg>
            </div>

            <button className="btn azul" onClick={abrirEditar}>
              Editar producto
            </button>
          </div>
        )}

        {(modoPanel === "agregar" || modoPanel === "editar") && (
          <div className="formulario">
            <h3>{modoPanel === "editar" ? "Editar producto" : "Agregar material"}</h3>

            <label>Nombre</label>
            <input
              value={form.nombre}
              onChange={(e) => handleForm("nombre", e.target.value)}
              placeholder="Ej. REFRESCO COCA COLA 600ML"
            />
            <label>Código de barras</label>
            <input
              value={form.codigoBarras || ""}
              onChange={(e) =>
                handleForm("codigoBarras", e.target.value.toUpperCase())
              }
              placeholder="Escanea o escribe el código"
            />
            <label>Precio</label>
            <input
              value={precioTexto}
              onChange={(e) => {
                const procesado = procesarInputMoneda(e.target.value);
                setPrecioTexto(procesado.texto);
                handleForm("precio", procesado.numero);
              }}
              placeholder="$0.00"
            />
            {/* TIPO DE VENTA */}
            <label>Tipo de venta</label>
            <select
              value={form.ventaPor || "pieza"}
              onChange={(e) => {
                const ventaPor = e.target.value as "pieza" | "peso";

                setForm((prev) => ({
                  ...prev,
                  ventaPor,
                  unidad: ventaPor === "peso" ? "g" : "pz",
                }));
              }}
            >
              <option value="pieza">Por pieza</option>
              <option value="peso">Por peso</option>
            </select>
              {/* CANTIDAD*/}
            <label>
              {form.ventaPor === "peso"
                ? "Cantidad en stock en gramos"
                : "Cantidad en stock"}
            </label>
            <input
              type="number"
              min="0"
              value={form.cantidad}
              onChange={(e) => handleForm("cantidad", Number(e.target.value))}
              placeholder={form.ventaPor === "peso" ? "Ej. 25000 = 25 KG" : "0"}
            />

            <label>Proveedor</label>
            <select
              value={form.proveedorId || ""}
              onChange={(e) => handleProveedor(e.target.value)}
            >
              <option value="">Sin proveedor</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.alias || p.nombre}
                </option>
              ))}
            </select>

            <label>Nombre con proveedor</label>
            <input
              value={form.nombreProveedor || ""}
              onChange={(e) => handleForm("nombreProveedor", e.target.value)}
              placeholder="Nombre como lo maneja el proveedor"
            />
          <label>Precio proveedor</label>
          <input
            type="number"
            min="0"
            value={form.precioProveedor || ""}
            onChange={(e) =>
              handleForm("precioProveedor", Number(e.target.value))
            }
            placeholder="0"
          />
          <label className="check-activo">
            <input
              type="checkbox"
              checked={form.activo ?? true}
              onChange={(e) => handleForm("activo", e.target.checked)}
            />
            Producto activo
          </label>
            <button className="btn verde" onClick={guardarProducto}>
              Guardar producto
            </button>
          </div>
        )}

        {modoPanel === "ingresar" && (
          <div className="formulario">
            <h3>Ingresar stock</h3>

            <label>Producto</label>
            <select
              value={productoStockId}
              onChange={(e) => setProductoStockId(e.target.value)}
            >
              <option value="">Selecciona producto</option>
              {productos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>

            <label>
            {productos.find((p) => p.id === productoStockId)?.ventaPor === "peso"
              ? "Cantidad a ingresar en gramos"
              : "Cantidad a ingresar"}
          </label>
            <input
              type="number"
              min="1"
              value={cantidadIngreso}
              onChange={(e) => setCantidadIngreso(e.target.value)}
              placeholder={
              productos.find((p) => p.id === productoStockId)?.ventaPor === "peso"
                ? "Ej. 1300 = 1.300 KG"
                : "0"
            }
            />

            <button className="btn azul" onClick={ingresarStock}>
              Guardar movimiento
            </button>
          </div>
        )}
      </section>
    </div>
  );
}