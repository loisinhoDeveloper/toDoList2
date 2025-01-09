import React, { useState, useEffect, useContext } from 'react';
import { Context } from '../store/appContext'; // Importamos el contexto global
import { useNavigate } from 'react-router-dom'; // Importamos el hook useNavigate para la redirección
import "../../styles/perfil.css";


const EditarPerfil = () => {
    // Usamos el contexto global
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();

    // Estados locales para los datos del perfil
    const [nombre, setNombre] = useState(store.usuarioLogueado?.nombre || '');
    const [email, setEmail] = useState(store.usuarioLogueado?.email || '');
    const [foto, setFoto] = useState(null);  // Estado para la foto de perfil

    const handleSubmit = (e) => {
        e.preventDefault();
        // Crear un objeto con los datos actualizados
        const datosActualizados = { nombre, email, foto };
        // Llamar a la acción de Flux para actualizar el perfil
        editarPerfil(datosActualizados);
    };

    const handleFotoChange = (e) => {
        setFoto(URL.createObjectURL(e.target.files[0]));
    };

    return (
        <div>
            <h2>Editar Perfil</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nombre:</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label>Foto de Perfil:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                    />
                    {foto && <img src={foto} alt="Foto de perfil" width="100" />}
                </div>
                <button type="submit">Actualizar</button>
            </form>
        </div>
    );
};

export default EditarPerfil;
