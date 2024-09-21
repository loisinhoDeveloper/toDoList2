import React, { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";
import "../../styles/navbar.css";
import { Dropdown } from "react-bootstrap";
import logo from '../../img/Miolos.jpg';


export const Navbar = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();

    // Verifica si el usuario está autenticado.
    const logueado = localStorage.getItem('token');
    const usuarioImage = localStorage.getItem('usuarioImage'); // URL de la imagen del perfil . Si no hay una imagen guardada, podemos usar una imagen predeterminada

    useEffect(() => { 
        console.log(logueado);
    }, [logueado]); //se ejecuta cada vez que logueado cambia

    const handleLogout = () => {
        actions.logout(); // Llama a la acción de cierre de sesión
        navigate("/"); // Redirige a la página principal
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <img src={logo} alt="Logo Elearning" className="logo" />
            </Link>
            <div className="text-overlay"></div>
            {logueado ? ( // Si está autenticado
                <div className="navbar-buttons">
                    <Link to="/perfil" className="btn btn-secondary">
                        Mi Perfil
                    </Link>
                    <Dropdown>
                        <Dropdown.Toggle variant="success" id="dropdown-basic" className="foto-perfil-toggle">
                            <img src={usuarioImage} alt="Perfil" className="foto-perfilProfe" />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to="/perfil">Editar perfil</Dropdown.Item>
                            <Dropdown.Item onClick={handleLogout}>Cerrar sesión</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            ) : ( // Si no está autenticado
                <div className="navbar-buttons">
                    <Link to="/login" className="btnInicio btn-secondary">
                        Iniciar sesión
                    </Link>
                    <Link to="/signup" className="btnRegistro btn-secondary">
                        Registrarse
                    </Link>
                </div>
            )}
        </nav>
    );
};
