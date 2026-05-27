// src/App.tsx
// src/App.tsx
import { useState } from "react";
import Caja from "./Caja/caja";
//import { useState } from "react";
//import Almacen from "./Almacen/almacen";
//import Proveedores from "./Proveedores/Proveedores";

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <div className={`app ${theme}`}>
      <div className="page">

        <button
          className="theme-btn"
          onClick={() =>
            setTheme(theme === "light" ? "dark" : "light")
          }
        >
          {theme === "light" ? "🌙 Oscuro" : "☀ Claro"}
        </button>

        <h1>Tienda Jose Luis</h1>

        <Caja />
      </div>
    </div>
  );
}

export default App;