//src/funciones/formato_peso.ts
// Función para formatear el peso en gramos a una representación legible

export const formatearPeso = (gramos: number) => {
  if (gramos < 1000) {
    return `${gramos} G`;
  }

  return `${(gramos / 1000).toFixed(3)} KG`;
};