// src/App.tsx

import { useState } from "react";

import Caja from "./Caja/caja";
import Proveedores from "./Proveedores/Proveedores";
import Almacen from "./Almacen/almacen";

import Menu from "./navbar/menu";

function App() {
  const [theme, setTheme] =
    useState<"light" | "dark">("light");

  const [pagina, setPagina] =
    useState("caja");

  return (
    <div className={`app ${theme}`}>

      {/* SIDEBAR */}
      <Menu
        pagina={pagina}
        setPagina={setPagina}
      />

      {/* CONTENIDO */}
      <main className="main-content">

        <button
          className="theme-btn"
          onClick={() =>
            setTheme(
              theme === "light"
                ? "dark"
                : "light"
            )
          }
        >
          {theme === "light"
            ? "🌙 Oscuro"
            : "☀ Claro"}
        </button>

        <h1>Tienda Jose Luis</h1>

        {/* PAGINAS */}
        {pagina === "caja" && <Caja />}

        {pagina === "proveedores" && (
          <Proveedores />
        )}
        {pagina === "almacen" && <Almacen />}


      </main>
    </div>
  );
}

export default App;