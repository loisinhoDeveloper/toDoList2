import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext"; // Importamos el contexto global

const ToDoList = () => {
    const { store, actions } = useContext(Context); // Usamos el contexto
    const [tarea, setTarea] = useState(""); // Estado para la nueva tarea
    const [editarId, setEditarId] = useState(null); // ID de la tarea a editar
    const [nuevoTitulo, setNuevoTitulo] = useState(""); // Nuevo título
    const [nuevaDescripcion, setNuevaDescripcion] = useState(""); // Nueva descripción

    useEffect(() => {
        if (store.user && store.user.id) {
            actions.obtenerTareas();  //cuando el usuario está autenticado, se llama a la acción obtenerTareas que está en el flux.js
        }
    }, [store.user]); 

    const añadirTarea = () => {
        if (tarea.trim() !== "") {
            const nuevaTarea = { label: tarea, done: false };
            actions.añadirTarea(nuevaTarea); // Añade la tarea usando Flux
            setTarea(""); // Limpia el input
        }
    };

    const actualizarTarea = (id) => { //Captura el nuevo título y descripción.
        const datosActualizados = { 
            label: nuevoTitulo,  // El nuevo título que el usuario escribió (tarea)
            descripcion: nuevaDescripcion // La nueva descripción
        }; 
    
        actions.actualizarTarea(id, datosActualizados); // Enviar datos a través del flux.js al backend para actualizar la tarea.
        setEditarId(null); // Resetea el modo edición
        setNuevoTitulo(""); // Limpia el nuevo título
        setNuevaDescripcion(""); // Limpia la nueva descripción

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
                {Array.isArray(store.todos_user) && store.todos_user.map((tarea, index) => (
                    <li key={tarea.id || index} className="list-group-item d-flex justify-content-between align-items-center">
                        {editarId === tarea.id ? (
                            <>
                                <input
                                    type="text"
                                    placeholder="Nuevo título"
                                    value={nuevoTitulo}
                                    onChange={(e) => setNuevoTitulo(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Nueva descripción"
                                    value={nuevaDescripcion}
                                    onChange={(e) => setNuevaDescripcion(e.target.value)}
                                />
                                <button onClick={() => actualizarTarea(tarea.id)} className="btn btn-success">Guardar</button>
                                <button onClick={() => setEditarId(null)} className="btn btn-secondary">Cancelar</button> {/* restablece el estado editarId a null*/}
                            </>
                        ) : (
                            <>
                                {tarea.label}
                                <button onClick={() => setEditarId(tarea.id)} className="btn btn-warning">Editar</button>
                                <button onClick={() => {
                                    console.log("ID de la tarea:", tarea.id);
                                    actions.eliminarTarea(index, tarea.id);
                                }} className="btn btn-danger">Eliminar</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
            <button onClick={actions.borrarTodasLasTareas} className="btn btn-warning mt-3">Borrar todas las tareas</button>
        </div>
    );
};

export default ToDoList;
