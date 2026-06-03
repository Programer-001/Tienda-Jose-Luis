// src/App.tsx

import { useEffect, useState } from "react";

import Caja from "./Caja/caja";
import Proveedores from "./Proveedores/Proveedores";
import Almacen from "./Almacen/almacen";
import CatalogosAlmacen from "./Almacen/CatalogosAlmacen";
import Ventas from "./Ventas/Ventas";

import Menu from "./navbar/menu";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const [pagina, setPagina] = useState("caja");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);

    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className={`app ${theme}`}>
      <Menu pagina={pagina} setPagina={setPagina} />

      <main className="main-content">
        <button
          className="theme-btn"
          onClick={() =>
            setTheme(theme === "light" ? "dark" : "light")
          }
        >
          {theme === "light" ? "🌙 Oscuro" : "☀ Claro"}
        </button>

        <h1>Abarrotes Lulu</h1>

        {pagina === "caja" && <Caja />}

        {pagina === "proveedores" && <Proveedores />}

        {pagina === "almacen" && <Almacen />}

        {pagina === "configuracion" && <CatalogosAlmacen />}

        {pagina === "ventas" && <Ventas />}
      </main>
    </div>
  );
}

export default App;