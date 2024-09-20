import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext"; // Importamos el contexto global

const ToDoLis = () => {
    const { store, actions } = useContext(Context); // Usamos el contexto
    const [tarea, setTarea] = useState(""); // Estado para la nueva tarea

    useEffect(() => { // useEffect para cargar las tareas y crear usuario si no existe
        actions.crearUsuario(); // Crea el usuario
        actions.obtenerTareas(); // Obtiene las tareas
    }, []);

    const añadirTarea = () => {
        if (tarea.trim() !== "") {
            const nuevaTarea = { label: tarea, done: false };
            actions.añadirTarea(nuevaTarea); // Añade la tarea usando Flux
            setTarea(""); // Limpia el input
        }
    };

    return (
        <div className="container text-center mt-5">
            <h1>Mi lista de tareas</h1>
            <input
                type="text"
                value={tarea}
                onChange={(e) => setTarea(e.target.value)}
                placeholder="Añade una nueva tarea"
            />
            <button onClick={añadirTarea} className="btn btn-primary ms-2">Añadir</button>
            <ul className="list-group mt-3">
                {Array.isArray(store.todos) && store.todos.map((tarea, index) => ( //Asegura que store.todos es una lista antes de intentar mostrarla y toma cada tarea de la lista y crea un elemento de lista para ella.
                    <li key={tarea.id || index} className="list-group-item d-flex justify-content-between align-items-center"> {/* un identificador único para cada tarea para ayudar a React */}
                        {tarea.label}
                        <button onClick={() => actions.eliminarTarea(index, tarea.id)} className="btn btn-danger">Eliminar</button>
                    </li>
                ))}
            </ul>
            <button onClick={actions.borrarTodasLasTareas} className="btn btn-warning mt-3">Borrar todas las tareas</button>
        </div>
    );
};

export default ToDoLis;
