import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "../firebase/configuracion";
import { formatearMoneda } from "../funciones/formato_moneda";

interface ArticuloTicket {
  articulo: string;
  cantidad: number;
  subtotal: number;
}

interface Ticket {
  id: string;
  fecha: string;
  hora: string;
  metodoPago: string;
  total: number;
  articulos?: ArticuloTicket[];
  cancelado?: boolean;
}

function Reportes() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const ticketsRef = ref(db, "tickets_compra");

    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setTickets([]);
        return;
      }

      setTickets(Object.values(data));
    });
  }, []);

  const ticketsVigentes = tickets.filter((t) => !t.cancelado);

  const totalVendido = ticketsVigentes.reduce(
    (acc, t) => acc + Number(t.total || 0),
    0
  );

  const totalTickets = ticketsVigentes.length;

  const promedioTicket =
    totalTickets > 0 ? totalVendido / totalTickets : 0;

  const efectivo = ticketsVigentes
    .filter((t) => t.metodoPago === "efectivo")
    .reduce((acc, t) => acc + Number(t.total || 0), 0);

  const debito = ticketsVigentes
    .filter((t) => t.metodoPago === "tarjeta_debito")
    .reduce((acc, t) => acc + Number(t.total || 0), 0);

  const credito = ticketsVigentes
    .filter((t) => t.metodoPago === "tarjeta_credito")
    .reduce((acc, t) => acc + Number(t.total || 0), 0);

  const productos: Record<string, number> = {};

  ticketsVigentes.forEach((ticket) => {
    ticket.articulos?.forEach((item) => {
      productos[item.articulo] =
        (productos[item.articulo] || 0) + Number(item.cantidad || 0);
    });
  });

  const productosMasVendidos = Object.entries(productos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="ventas-card">
      <h3>Reportes</h3>

      <div className="reportes-grid">
        <div className="reporte-card">
          <p>Total vendido</p>
          <h2>{formatearMoneda(totalVendido)}</h2>
        </div>

        <div className="reporte-card">
          <p>Tickets vendidos</p>
          <h2>{totalTickets}</h2>
        </div>

        <div className="reporte-card">
          <p>Promedio por ticket</p>
          <h2>{formatearMoneda(promedioTicket)}</h2>
        </div>
      </div>

      <h3>Métodos de pago</h3>

      <div className="reportes-grid">
        <div className="reporte-card">
          <p>Efectivo</p>
          <h2>{formatearMoneda(efectivo)}</h2>
        </div>

        <div className="reporte-card">
          <p>Tarjeta débito</p>
          <h2>{formatearMoneda(debito)}</h2>
        </div>

        <div className="reporte-card">
          <p>Tarjeta crédito</p>
          <h2>{formatearMoneda(credito)}</h2>
        </div>
      </div>

      <h3>Productos más vendidos</h3>

      <div className="corte-table-scroll">
        <table className="corte-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad vendida</th>
            </tr>
          </thead>

          <tbody>
            {productosMasVendidos.map(([producto, cantidad]) => (
              <tr key={producto}>
                <td>{producto}</td>
                <td>{cantidad}</td>
              </tr>
            ))}

            {productosMasVendidos.length === 0 && (
              <tr>
                <td colSpan={2}>No hay datos todavía</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reportes;