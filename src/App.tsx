// src/App.tsx
import Almacen from "./Almacen/almacen";
//import Proveedores from "./Proveedores/Proveedores";

function App() {
  return (
    <div className="app light">
      <div className="page">
        <h1>Sistema Tienda Jose Luis</h1>
        <Almacen />
      </div>
    </div>
  );
}

export default App;