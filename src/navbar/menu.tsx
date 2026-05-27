// src/navbar/menu.tsx

import "../css/menu.css";

import {
  ArchiveBoxIcon,
  TruckIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

interface Props {
  pagina: string;
  setPagina: (pagina: string) => void;
}

function Menu({
  pagina,
  setPagina,
}: Props) {
  return (
    <aside className="sidebar">

      {/* LOGO */}
      <div className="sidebar-logo">

        <div className="logo-circle">
          JL
        </div>

        <h1>
          TIENDA
          <br />
          JOSE LUIS
        </h1>

      </div>

      {/* OPCIONES */}
      <nav className="sidebar-nav">

        <button
          className={`sidebar-item ${
            pagina === "caja"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setPagina("caja")
          }
        >
          <BanknotesIcon className="sidebar-icon" />
          <span>Caja</span>
        </button>

        <button
          className={`sidebar-item ${
            pagina === "ventas"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setPagina("ventas")
          }
        >
          <DocumentTextIcon className="sidebar-icon" />
          <span>Ventas</span>
        </button>

        <button
          className={`sidebar-item ${
            pagina === "almacen"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setPagina("almacen")
          }
        >
          <ArchiveBoxIcon className="sidebar-icon" />
          <span>Almacén</span>
        </button>

        <button
          className={`sidebar-item ${
            pagina === "proveedores"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setPagina("proveedores")
          }
        >
          <TruckIcon className="sidebar-icon" />
          <span>Proveedores</span>
        </button>

        <button
          className={`sidebar-item ${
            pagina === "configuracion"
              ? "active"
              : ""
          }`}
          onClick={() =>
            setPagina("configuracion")
          }
        >
          <Cog6ToothIcon className="sidebar-icon" />
          <span>Configuración</span>
        </button>

      </nav>

    </aside>
  );
}

export default Menu;