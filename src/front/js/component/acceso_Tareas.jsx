//AccesoTareas actúa como un "guardia" para la ruta que muestra Tareas (layout)

import React from "react";
import { Navigate } from "react-router-dom";

const AccesoTareas = ({ listaTareas }) => {
    const token = localStorage.getItem('token'); // Revisamos si hay token guardado en localStorage.... si lo hay...

    if (!token) {
        return <Navigate to="/login" />; // Si no hay token, redirigimos a la página de login
    }

    return listaTareas // Si hay token, devolvemos listaTareas.
};

export default AccesoTareas;
