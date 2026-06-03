import { useEffect, useState } from "react";
import { getDatabase, onValue, ref } from "firebase/database";
import {app  } from "../firebase/configuracion";
import { formatearMoneda } from "../funciones/formato_moneda";

interface TicketCompra {
  id: string;
  transaccion: string;
  fecha: string;
  hora: string;
  metodoPago: string;
  total: number;
}

function CorteDiario() {
  const db = getDatabase(app);

  const [fecha, setFecha] = useState("");
  const [tickets, setTickets] = useState<TicketCompra[]>([]);
  const [filtrados, setFiltrados] = useState<TicketCompra[]>([]);

  const [totales, setTotales] = useState({
    efectivo: 0,
    tarjetaDebito: 0,
    tarjetaCredito: 0,
    total: 0,
  });

  useEffect(() => {
    const ticketsRef = ref(db, "tickets_compra");

    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setTickets([]);
        setFiltrados([]);
        return;
      }

      const lista: TicketCompra[] = Object.values(data);

      setTickets(lista);
    });
  }, []);

  const formatearFechaInput = (fechaInput: string) => {
    const [anio, mes, dia] = fechaInput.split("-");
    return `${dia}/${mes}/${anio}`;
  };

  const filtrarPorFecha = () => {
    if (!fecha) {
      alert("Selecciona una fecha");
      return;
    }

    const fechaMX = formatearFechaInput(fecha);

    const ventasDia = tickets.filter(
      (ticket) => ticket.fecha === fechaMX
    );

    setFiltrados(ventasDia);

    const resumen = {
      efectivo: 0,
      tarjetaDebito: 0,
      tarjetaCredito: 0,
      total: 0,
    };

    ventasDia.forEach((ticket) => {
      const metodo = ticket.metodoPago;

      if (metodo === "efectivo") {
        resumen.efectivo += ticket.total;
      }

      if (metodo === "tarjeta_debito") {
        resumen.tarjetaDebito += ticket.total;
      }

      if (metodo === "tarjeta_credito") {
        resumen.tarjetaCredito += ticket.total;
      }

      resumen.total += ticket.total;
    });

    setTotales(resumen);
  };

  const nombreMetodo = (metodo: string) => {
    if (metodo === "efectivo") return "Efectivo";
    if (metodo === "tarjeta_debito") return "Tarjeta de débito";
    if (metodo === "tarjeta_credito") return "Tarjeta de crédito";
    return metodo;
  };

  return (
    <div className="corte-layout">
      <div className="corte-resumen ventas-card">
        <h3>Totales del Día</h3>

        <p>Efectivo: {formatearMoneda(totales.efectivo)}</p>
        <p>Tarjeta de débito: {formatearMoneda(totales.tarjetaDebito)}</p>
        <p>Tarjeta de crédito: {formatearMoneda(totales.tarjetaCredito)}</p>

        <hr />

        <h4>Total General: {formatearMoneda(totales.total)}</h4>
      </div>

      <div className="corte-tabla ventas-card">
        <h3>📅 Corte Diario</h3>

        <div className="corte-filtros">
          <label>
            Fecha:
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker()}
            />
          </label>

          <button onClick={filtrarPorFecha}>
            Filtrar
          </button>
        </div>

        <div className="corte-table-scroll">
          <table className="corte-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Ticket</th>
                <th>Hora</th>
                <th>Método</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.fecha}</td>
                  <td>{ticket.transaccion}</td>
                  <td>{ticket.hora}</td>
                  <td>{nombreMetodo(ticket.metodoPago)}</td>
                  <td>{formatearMoneda(ticket.total)}</td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5}>No hay ventas en esta fecha</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CorteDiario;