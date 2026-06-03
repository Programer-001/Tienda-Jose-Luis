import { useState } from "react";
import CorteDiario from "./CorteDiario";
import ConsultaTicket from "./ConsultaTicket";
import Historial from "./Historial";
import Reportes from "./Reportes";
import "../css/ventas.css";

function Ventas() {
  const [vista, setVista] = useState("corte");

  return (
    <div className="ventas-page">
      <div className="ventas-header">
        <h2>Ventas</h2>
        <p>Consulta cortes, historial y reportes de ventas.</p>
      </div>

      <div className="ventas-tabs">
        {/* Aquí van los botones para cambiar de vista */}
        <button
          className={vista === "corte" ? "ventas-tab activo" : "ventas-tab"}
          onClick={() => setVista("corte")}
        >
          Corte Diario
        </button>
        <button
        className={vista === "consulta" ? "ventas-tab activo" : "ventas-tab"}
        onClick={() => setVista("consulta")}
        >
        Consulta de Ticket
        </button>
        <button
          className={vista === "historial" ? "ventas-tab activo" : "ventas-tab"}
          onClick={() => setVista("historial")}
        >
          Historial
        </button>

        <button
          className={vista === "reportes" ? "ventas-tab activo" : "ventas-tab"}
          onClick={() => setVista("reportes")}
        >
          Reportes
        </button>
      </div>

      <div className="ventas-content">
        {/* Aquí se renderiza la vista seleccionada */}
        {vista === "corte" && <CorteDiario />}
        {vista === "consulta" && <ConsultaTicket />}
        {vista === "historial" && <Historial />}
        {vista === "reportes" && <Reportes />}
        
      </div>
    </div>
  );
}

export default Ventas;