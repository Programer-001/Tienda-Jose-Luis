export const formatearMoneda = (
  valor: number | undefined | null
): string => {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return "$0.00";
  }

  return valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const procesarInputMoneda = (valor: string) => {
  let limpio = valor.replace(/\$/g, "").replace(/,/g, "");
  limpio = limpio.replace(/[^0-9.]/g, "");

  const partes = limpio.split(".");
  if (partes.length > 2) {
    limpio = partes[0] + "." + partes.slice(1).join("");
  }

  const [entero, decimal] = limpio.split(".");
  const enteroFormateado = entero ? Number(entero).toLocaleString("es-MX") : "";

  return {
    texto: decimal !== undefined ? `${enteroFormateado}.${decimal}` : enteroFormateado,
    numero: limpio === "" || limpio === "." ? 0 : Number(limpio),
  };
};