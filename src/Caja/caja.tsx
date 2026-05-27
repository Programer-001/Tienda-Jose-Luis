import { useEffect, useMemo, useRef, useState } from "react";
import { get, ref, update } from "firebase/database";
import { db } from "../firebase/configuracion";
import "../css/Caja.css";

type Producto = {
  id: string;
  codigoBarras: string;
  nombre: string;
  precio: number;
  cantidad: number;
  activo?: boolean;
};

type ItemTicket = Producto & {
  cantidadVenta: number;
};

export default function Caja() {
  const [codigo, setCodigo] = useState("");
  const [ticket, setTicket] = useState<ItemTicket[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Caja";
    inputRef.current?.focus();
  }, []);

  const cargarProductos = async () => {
    const snapshot = await get(ref(db, "almacen/productos"));
    const data = snapshot.val() || {};

const lista: Producto[] = Object.entries(data).map(
  ([key, value]: [string, any]) => ({
    id: key,

    codigoBarras: String(value.codigoBarras || ""),

    nombre: String(value.nombre || ""),

    precio: Number(value.precio || 0),

    cantidad: Number(value.cantidad || 0),

    activo: value.activo ?? true,
  })
);

    setProductos(lista.filter((p) => p.activo !== false));
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const formatearMoneda = (valor: number) =>
    valor.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

const total = useMemo(() => {
  return ticket.reduce(
    (sum, item) => sum + item.precio * item.cantidadVenta,
    0
  );
}, [ticket]);

  const agregarProducto = (producto: Producto) => {
    if (producto.cantidad <= 0) {
      alert("Este producto no tiene stock.");
      return;
    }

    setTicket((prev) => {
      const existe = prev.find((item) => item.id === producto.id);

      if (existe) {
        if (existe.cantidadVenta >= producto.cantidad) {
          alert("No hay más stock disponible.");
          return prev;
        }

        return prev.map((item) =>
          item.id === producto.id
            ? { ...item, cantidadVenta: item.cantidadVenta + 1 }
            : item
        );
      }

      return [...prev, { ...producto, cantidadVenta: 1 }];
    });
  };

  const buscarPorCodigo = () => {
    const codigoLimpio = codigo.trim();

    if (!codigoLimpio) return;

    const producto = productos.find(
      (p) =>
        p.codigoBarras === codigoLimpio ||
        p.id === codigoLimpio
    );

    if (!producto) {
      alert("Producto no encontrado.");
      setCodigo("");
      inputRef.current?.focus();
      return;
    }

    agregarProducto(producto);
    setCodigo("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const cambiarCantidad = (id: string, cambio: number) => {
    setTicket((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;

          const nuevaCantidad = item.cantidadVenta + cambio;

          if (nuevaCantidad <= 0) return null;

          if (nuevaCantidad > item.cantidad) {
            alert("No hay más stock disponible.");
            return item;
          }

          return { ...item, cantidadVenta: nuevaCantidad };
        })
        .filter(Boolean) as ItemTicket[]
    );
  };

  const finalizarVenta = async () => {
    if (ticket.length === 0) return;

    for (const item of ticket) {
      const nuevaCantidad = Math.max(
        0,
        item.cantidad - item.cantidadVenta
      );

      await update(ref(db, `almacen/productos/${item.id}`), {
        cantidad: nuevaCantidad,
      });
    }

    setTicket([]);
    setCodigo("");
    setMetodoPago("efectivo");
    setMostrarModalPago(false);

    await cargarProductos();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="caja-page">
      <div className="caja-shell">
        <section className="caja-main">
          <div className="caja-header">
            <div>
              <h1>Caja</h1>
              <p>Sistema de cobro por código de barras</p>
            </div>
          </div>

          <div className="scanner-card">
            <label>Escanear / buscar código de barras</label>

            <input
              ref={inputRef}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") buscarPorCodigo();
              }}
              placeholder="Pasa el código de barras..."
              autoComplete="off"
            />

            <button onClick={buscarPorCodigo}>Agregar</button>
          </div>

          <div className="productos-grid">
            {productos.map((producto) => (
              <button
                key={producto.id}
                className="producto-card"
                onClick={() => agregarProducto(producto)}
              >
                <strong>{producto.nombre}</strong>
                <span>{producto.codigoBarras}</span>
                <b>{formatearMoneda(producto.precio)}</b>
                <small>Stock: {producto.cantidad}</small>
              </button>
            ))}
          </div>
        </section>

        <aside className="ticket-panel">
          <div className="ticket-header">
            <h2>Venta actual</h2>

            {ticket.length > 0 && (
              <button className="btn-limpiar" onClick={() => setTicket([])}>
                Limpiar
              </button>
            )}
          </div>

          <div className="ticket-list">
            {ticket.length === 0 ? (
              <div className="ticket-empty">
                Escanea un producto para iniciar la venta.
              </div>
            ) : (
              ticket.map((item) => (
                <div className="ticket-item" key={item.id}>
                  <div className="ticket-info">
                    <strong>{item.nombre}</strong>
                    <small>Cantidad: {item.cantidadVenta}</small>
                  </div>

                  <div className="ticket-actions">
                    <span>
                      {formatearMoneda(item.precio * item.cantidadVenta)}
                    </span>

                    <div className="cantidad-btns">
                      <button onClick={() => cambiarCantidad(item.id, -1)}>
                        -
                      </button>

                      <button onClick={() => cambiarCantidad(item.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="ticket-footer">
            <div className="ticket-total">
              <span>Total</span>
              <strong>{formatearMoneda(total)}</strong>
            </div>

            <button
              className="btn-pagar"
              disabled={ticket.length === 0}
              onClick={() => setMostrarModalPago(true)}
            >
              Pagar
            </button>
          </div>
        </aside>
      </div>

      {mostrarModalPago && (
        <div className="modal-fondo">
          <div className="modal-pago">
            <div className="pago-linea">
              <strong>Total a pagar: {formatearMoneda(total)}</strong>

              <label>Método</label>

              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta_credito">Tarjeta de crédito</option>
                <option value="tarjeta_debito">Tarjeta de débito</option>
              </select>

              <button className="btn-finalizar" onClick={finalizarVenta}>
                Finalizar
              </button>
            </div>

            <button
              className="btn-cancelar"
              onClick={() => setMostrarModalPago(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}