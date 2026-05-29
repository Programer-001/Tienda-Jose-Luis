import { useEffect, useMemo, useRef, useState } from "react";
import { get, ref, update,set } from "firebase/database";
import { db } from "../firebase/configuracion";
import { imprimirTicketCompra } from "../plantilla/ticket_compra";
import { generarTicketId } from "../funciones/generar_ticket";
import "../css/caja.css";
import {
  obtenerFechaLocal,
  formatearFechaMX,
} from "../funciones/formato_fechas";



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
  const [efectivoRecibido, setEfectivoRecibido] = useState("");

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

  try {
    const fechaISO = obtenerFechaLocal();
    const fecha = formatearFechaMX(fechaISO);

    const hora = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const ticketId = await generarTicketId();

    const articulosTicket = ticket.map((item) => ({
      cantidad: item.cantidadVenta,
      articulo: item.nombre,
      subtotal: item.precio * item.cantidadVenta,
    }));

    const total = articulosTicket.reduce(
      (acc, item) => acc + item.subtotal,
      0
    );

    const ticketData = {
      id: ticketId,
      transaccion: ticketId,
      fecha,
      hora,
      metodoPago,
      articulos: articulosTicket,
      total,
      creadoEn: Date.now(),
    };

    await set(ref(db, `tickets_compra/${ticketId}`), ticketData);

    imprimirTicketCompra({
      transaccion: ticketId,
      fecha,
      hora,
      metodoPago,
      articulos: articulosTicket,
    });

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
  } catch (error) {
    console.error("Error finalizando venta:", error);
  }
};

const totalPagar = total;
const efectivoNumero = Math.max(
  0,
  Number(efectivoRecibido) || 0
);

const cambio = Math.max(
  0,
  efectivoNumero - totalPagar
);


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
          onClick={() => {
            setEfectivoRecibido("");
            setMetodoPago("efectivo");
            setMostrarModalPago(true);
          }}
        >
          Pagar
        </button>
          </div>
        </aside>
      </div>

{mostrarModalPago && (
  <div className="modal-fondo">
    <div className="modal-pago">

      <div className="pago-grid">
        <div>
        <div className="total-pagar-box">
          <span>Total a pagar</span>

          <strong>
            {formatearMoneda(total)}
          </strong>
        </div>
        </div>

        <div className="pago-metodo">
          <label>Método</label>

          <select
            value={metodoPago}
            onChange={(e) => {
            setMetodoPago(e.target.value);
            setEfectivoRecibido("");
          }}
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta_credito">Tarjeta de crédito</option>
            <option value="tarjeta_debito">Tarjeta de débito</option>
          </select>

          {metodoPago === "efectivo" && (
            <div className="efectivo-box">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Efectivo recibido"
                value={efectivoRecibido}
                onChange={(e) => {
                  const valor = Math.max(0, Number(e.target.value));

                  setEfectivoRecibido(
                    e.target.value === "" ? "" : String(valor)
                  );
                }}
              />

              <p>Cambio: {formatearMoneda(cambio)}</p>
            </div>
          )}
        </div>

        <button
          className="btn-finalizar"
          onClick={finalizarVenta}
          disabled={
            metodoPago === "efectivo" &&
            (
              efectivoRecibido === "" ||
              efectivoNumero < totalPagar
            )
          }
        >
          Finalizar
        </button>
      </div>

      <button
        className="btn-cancelar"
        onClick={() => {
          setEfectivoRecibido("");
          setMostrarModalPago(false);
        }}
      >
        Cancelar
      </button>

    </div>
  </div>
)}
    </div>
  );
}