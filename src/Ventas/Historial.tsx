import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase/configuracion";
import { formatearMoneda } from "../funciones/formato_moneda";

interface Ticket {
  id: string;
  fecha: string;
  hora: string;
  metodoPago: string;
  total: number;
  transaccion: string;
}

function Historial() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const ticketsRef = ref(db, "tickets_compra");

    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setTickets([]);
        return;
      }

      const lista: Ticket[] = Object.values(data);

      lista.sort((a, b) => {
        return (b.id || "").localeCompare(a.id || "");
      });

      setTickets(lista);
    });
  }, []);

  const ticketsFiltrados = tickets.filter((ticket) => {
    const texto = busqueda.toLowerCase();

    return (
      ticket.transaccion?.toLowerCase().includes(texto) ||
      ticket.fecha?.toLowerCase().includes(texto) ||
      ticket.metodoPago?.toLowerCase().includes(texto)
    );
  });

  const nombreMetodo = (metodo: string) => {
    if (metodo === "efectivo") return "Efectivo";
    if (metodo === "tarjeta_debito") return "Tarjeta débito";
    if (metodo === "tarjeta_credito") return "Tarjeta crédito";

    return metodo;
  };

  return (
    <div className="ventas-card">
      <h3>Historial de Tickets</h3>

      <div className="corte-filtros">
        <label>
          Buscar:
          <input
            type="text"
            placeholder="Ticket, fecha o método..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
      </div>

      <div className="corte-table-scroll">
        <table className="corte-table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Método</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {ticketsFiltrados.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.transaccion}</td>
                <td>{ticket.fecha}</td>
                <td>{ticket.hora}</td>
                <td>{nombreMetodo(ticket.metodoPago)}</td>
                <td>{formatearMoneda(ticket.total)}</td>
              </tr>
            ))}

            {ticketsFiltrados.length === 0 && (
              <tr>
                <td colSpan={5}>
                  No se encontraron tickets
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Historial;