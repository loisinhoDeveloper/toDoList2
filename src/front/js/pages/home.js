import React, { useContext } from "react";
import { Context } from "../store/appContext";
import rigoImageUrl from "../../img/rigo-baby.jpg";
import "../../styles/home.css";
import { Link } from 'react-router-dom';




export const Home = () => {
	const { store, actions } = useContext(Context);

	return (
        <div className="hero-section">
            <h1>MIOLOS</h1>
            <p>Donde los DETALLES también cuentan.</p>
            <Link to="/signup" className="home-button">¡Regístrate ahora!</Link>
        </div>
    );
};
