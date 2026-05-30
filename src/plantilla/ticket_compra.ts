// src/plantilla/ticket_compra.ts

import { formatearMetodoPago } from "../funciones/formato_pago";
export interface TicketArticulo {
  cantidad: number;
  articulo: string;
  subtotal: number;
}

export interface TicketCompraData {
  transaccion: string;
  fecha: string;
  hora: string;
  articulos: TicketArticulo[];
  metodoPago: string;
}

const formatoMoneda = (valor: number) =>
  valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

export const imprimirTicketCompra = (data: TicketCompraData) => {
const total = data.articulos.reduce(
  (acc, item) => acc + item.subtotal,
  0
);

// PRECIOS YA INCLUYEN IVA
const subtotal = total / 1.16;

const iva = total - subtotal;

  const totalArticulos = data.articulos.reduce(
    (acc, item) => acc + item.cantidad,
    0
  );

  const ventana = window.open("", "_blank", "width=400,height=700");

  if (!ventana) return;

  ventana.document.write(`
    <html>
      <head>
        <title>Ticket ${data.transaccion}</title>

        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            color: #000;
          }

          .ticket {
            width: 80mm;
            padding: 8mm 5mm;
          }

          .center {
            text-align: center;
          }

          .logo {
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 12px;
          }

          .fecha {
            font-size: 16px;
            margin-bottom: 20px;
          }

          .titulo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .transaccion {
            font-size: 14px;
            margin-bottom: 24px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }

          th {
            text-align: left;
            padding-bottom: 8px;
            font-size: 14px;
          }

          td {
            padding: 4px 0;
            vertical-align: top;
          }

          .cant {
            width: 18%;
          }

          .articulo {
            width: 52%;
          }

          .subtotal {
            width: 30%;
            text-align: right;
          }

          .resumen {
            margin-top: 35px;
            font-size: 16px;
          }

          .resumen-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
          }

          .total {
            font-weight: bold;
            font-size: 18px;
          }

          .footer {
            margin-top: 30px;
            font-size: 16px;
          }

          .footer p {
            margin: 8px 0;
          }

          .gracias {
            margin-top: 30px;
            font-size: 14px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        <div class="ticket">

          <div class="center">
            <div class="logo">Abarrotes Lulu</div>
            <div class="fecha">${data.fecha} ${data.hora}</div>
            <div class="transaccion">
              Transacción: ${data.transaccion}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="cant">Cantidad</th>
                <th class="articulo">Artículo</th>
                <th class="subtotal">Subtotal</th>
              </tr>
            </thead>

            <tbody>
              ${data.articulos
                .map(
                  (item) => `
                    <tr>
                      <td class="cant">${item.cantidad}</td>
                      <td class="articulo">${item.articulo}</td>
                      <td class="subtotal">${formatoMoneda(item.subtotal)}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>

            <div class="resumen-row total">
              <span>Total</span>
              <span>${formatoMoneda(total)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Artículos: ${totalArticulos}</p>
            <p>Método de pago: ${formatearMetodoPago(data.metodoPago)}</p>
            
          </div>

          <div class="gracias">
            Gracias por su compra
          </div>

        </div>

        <script>
          window.onload = () => {
            window.print();
            setTimeout(() => window.close(), 500);
          };
        </script>
      </body>
    </html>
  `);

  ventana.document.close();
};