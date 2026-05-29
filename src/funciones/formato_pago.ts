export const formatearMetodoPago = (metodo: string) => {
  switch (metodo) {
    case "efectivo":
      return "Efectivo";

    case "tarjeta_credito":
      return "Tarjeta de crédito";

    case "tarjeta_debito":
      return "Tarjeta de débito";

    default:
      return metodo;
  }
};