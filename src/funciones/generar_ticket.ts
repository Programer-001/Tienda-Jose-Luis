// src/funciones/generar_ticket.ts

import { ref, get, set } from "firebase/database";

import { db } from "../firebase/configuracion";

import {
  obtenerFechaLocal,
  formatearFechaFirebase,
} from "./formato_fechas";

export const generarTicketId = async () => {
  // YYYY-MM-DD
  const fechaISO = obtenerFechaLocal();

  // DDMMYYYY
  const fechaFirebase = formatearFechaFirebase(fechaISO);

  const contadorRef = ref(db, "contadores/contador_ticket");

  const snap = await get(contadorRef);

  let contador = 1;

  if (snap.exists()) {
    const data = snap.val();

    // mismo día
    if (data.fecha === fechaFirebase) {
      contador = (data.contador || 0) + 1;
    }
  }

  await set(contadorRef, {
    fecha: fechaFirebase,
    contador,
  });

  const consecutivo = String(contador).padStart(2, "0");

  // 2805202601
  return `${fechaFirebase}${consecutivo}`;
};