import { useState } from "react";
import { ref, get, update, remove } from "firebase/database";
import { db } from "../firebase/configuracion";
import { formatearMoneda } from "../funciones/formato_moneda";

interface ArticuloTicket {
  articulo: string;
  cantidad: number;
  subtotal: number;
}

interface Ticket {
  id: string;
  transaccion: string;
  fecha: string;
  hora: string;
  metodoPago: string;
  total: number;
  articulos: ArticuloTicket[];
  cancelado?: boolean;
}

function ConsultaTicket() {
  const [ticketId, setTicketId] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const buscarTicket = async () => {
    if (!ticketId.trim()) {
      alert("Escribe el número de ticket");
      return;
    }

    const snap = await get(ref(db, `tickets_compra/${ticketId.trim()}`));

    if (!snap.exists()) {
      alert("No se encontró el ticket");
      setTicket(null);
      return;
    }

    setTicket(snap.val());
  };

  const cancelarTicket = async () => {
    if (!ticket) return;

    const confirmar = confirm("¿Seguro que deseas cancelar este ticket?");
    if (!confirmar) return;

    await update(ref(db, `tickets_compra/${ticket.id}`), {
      cancelado: true,
    });

    setTicket({
      ...ticket,
      cancelado: true,
    });
  };

  const borrarTicket = async () => {
    if (!ticket) return;

    const confirmar = confirm(
      "¿Seguro que deseas BORRAR este ticket? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    await remove(ref(db, `tickets_compra/${ticket.id}`));

    setTicket(null);
    setTicketId("");
  };

  const editarCantidad = (index: number, cantidad: number) => {
    if (!ticket) return;

    const nuevosArticulos = [...ticket.articulos];
    nuevosArticulos[index].cantidad = cantidad;

    const nuevoTotal = nuevosArticulos.reduce(
      (acc, item) => acc + Number(item.subtotal || 0),
      0
    );

    setTicket({
      ...ticket,
      articulos: nuevosArticulos,
      total: nuevoTotal,
    });
  };

  const borrarArticulo = (index: number) => {
    if (!ticket) return;

    const nuevosArticulos = ticket.articulos.filter((_, i) => i !== index);

    const nuevoTotal = nuevosArticulos.reduce(
      (acc, item) => acc + Number(item.subtotal || 0),
      0
    );

    setTicket({
      ...ticket,
      articulos: nuevosArticulos,
      total: nuevoTotal,
    });
  };

  const guardarCambios = async () => {
    if (!ticket) return;

    await update(ref(db, `tickets_compra/${ticket.id}`), {
      articulos: ticket.articulos,
      total: ticket.total,
    });

    alert("Ticket actualizado");
  };

  const nombreMetodo = (metodo: string) => {
    if (metodo === "efectivo") return "Efectivo";
    if (metodo === "tarjeta_debito") return "Tarjeta de débito";
    if (metodo === "tarjeta_credito") return "Tarjeta de crédito";
    return metodo;
  };

  return (
    <div className="ventas-card">
      <h3>Consulta de Ticket</h3>

      <div className="corte-filtros">
        <label>
          Número de ticket:
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="Ej. 3005202601"
          />
        </label>

        <button onClick={buscarTicket}>Buscar</button>
      </div>

      {ticket && (
        <div className="ticket-consulta">
          <div>
            <h3>Ticket #{ticket.transaccion}</h3>
            <p>Fecha: {ticket.fecha}</p>
            <p>Hora: {ticket.hora}</p>
            <p>Método: {nombreMetodo(ticket.metodoPago)}</p>
            <p>
              Estado:{" "}
              <strong>
                {ticket.cancelado ? "Cancelado" : "Vigente"}
              </strong>
            </p>
          </div>

          <div className="corte-table-scroll">
            <table className="corte-table">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {ticket.articulos?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.articulo}</td>
                    <td>
                      <input
                        type="number"
                        value={item.cantidad}
                        min="0"
                        onChange={(e) =>
                          editarCantidad(index, Number(e.target.value))
                        }
                      />
                    </td>
                    <td>{formatearMoneda(item.subtotal)}</td>
                    <td>
                      <button
                    className="btn-borrar-articulo"
                    onClick={() => borrarArticulo(index)}
                    >
                    Borrar
                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Total: {formatearMoneda(ticket.total)}</h3>

          <div className="ventas-acciones">
            <button onClick={guardarCambios}>Guardar cambios</button>
            <button onClick={cancelarTicket}>Cancelar ticket</button>
            <button onClick={borrarTicket}>Borrar ticket</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultaTicket;