import React from "react";
import ToDoList from "../component/toDoList.jsx"; // "hoja especial", llamada ToDolist de mi cuaderno "Tareas"

const Tareas = () => {

    
    return (
        <div className="container">
            <ToDoList /> {/* Aquí insertas el componente de la lista de tareas */}
        </div>
    );
};

export default Tareas;
