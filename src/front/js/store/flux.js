const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			token: localStorage.getItem('token') || null, // Se debe almacenar en el estado del frontend (y opcionalmente en localStorage). Esto permite que el usuario permanezca autenticado incluso después de cerrar y reabrir el navegador.
			todos: [], 
            user: [],


			
		},

		actions: {

			crearUsuario: async (formData) => {
                try {
                     // Enviamos una solicitud al servidor para crear un nuevo usuario
                    const response = await fetch(`${process.env.BACKEND_URL}/api/signup`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(formData) // Enviar los datos del usuario
                    });
            
                    if (response.ok) {
                        const data = await response.json();
                        console.log("Usuario creado:", data);
                        return true; // Registro exitoso
                    } else {
                        console.error("Error al crear el usuario");
                        return false; // Registro fallido
                    }
                } catch (error) {
                    console.error("Error al crear el usuario:", error);
                    return false; // Registro fallido
                }
            },


            login: async (email, password) => { 
                try {
                     // Enviamos una solicitud al servidor para iniciar sesión
                     const response = await fetch(`${process.env.BACKEND_URL}/api/login`, { //hasta que esto termine
                        method: "POST",
                        body: JSON.stringify({ email, password }), //convierte nuestro correo y contraseña en un formato que el servidor puede entender.
                        headers: {
                            "Content-Type": "application/json"
                        }
                    });
            
                    if (response.ok) {
                        const data = await response.json(); //convierte la respuesta del servidor en un formato que podamos usar (en este caso, un objeto con la información del usuario).
                        if (data.token) { // revisa si el servidor nos dio un token. Si sí, eso significa que el inicio de sesión fue exitoso.
                            localStorage.setItem("token", data.token); // Guardar token en localStorage
                            setStore({ token: data.token });
                            setStore({ user: data.user }); // Opcional: almacenar información del usuario
                            return true; // Login exitoso
                        }
                    } else {
                        console.error("Error al iniciar sesión");
                        return false; // Login fallido
                    }
                } catch (error) { //es como una red de seguridad. Si algo sale mal (por ejemplo, si el servidor no responde)
                    console.error("Error del servidor:", error);
                    return false; // Login fallido
                }
            },            

			

			obtenerTareas: () => {
                const token = getStore().token;
                const BACKEND_URL = process.env.BACKEND_URL; // Asegúrate de que esté definido en tu entorno
            
                fetch(`${BACKEND_URL}/api/tareas`, { // URL del endpoint de tareas
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // Añadimos el token JWT en el header
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error en la obtención de las tareas');
                    }
                    return response.json(); // Convertimos la respuesta a JSON
                })
                .then(data => {
                    // Si el objeto de respuesta es un array de tareas, guardamos directamente
                    setStore({ todos: data });
                })
                .catch(error => console.log("Error al obtener tareas:", error));
            },
            

			// Añadir una nueva tarea
            añadirTarea: (nuevaTarea) => {
                const store = getStore();
                const actualizarTodos = [...store.todos, nuevaTarea]; // Añadir la nueva tarea a la lista de tareas actual
                setStore({ todos: actualizarTodos }); // Actualizar el estado local
                getActions().sincroConServidor(actualizarTodos); // Sincronizar con el servidor
            },

           // Eliminar una tarea por ID y su índice en la lista local
            eliminarTarea: (index, id) => {
                const BACKEND_URL = process.env.BACKEND_URL; // Asegúrate de que esté definido

                fetch(`${BACKEND_URL}/api/tareas/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
                    }
                })
                .then(() => {
                    const store = getStore();
                    const nuevaListaDeTareas = store.todos.filter((_, i) => i !== index); // Filtrar para eliminar la tarea por su índice
                    setStore({ todos: nuevaListaDeTareas }); // Actualizar la lista local
                    getActions().sincroConServidor(nuevaListaDeTareas); // Sincronizar con el servidor
                })
                .catch(error => console.log("Error al eliminar la tarea: ", error));
            },


                        // Borrar todas las tareas
            borrarTodasLasTareas: () => {
                const BACKEND_URL = process.env.BACKEND_URL; // Asegúrate de que esté definido

                fetch(`${BACKEND_URL}/api/tareas`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
                    }
                })
                .then(() => {
                    setStore({ todos: [] }); // Limpiar todas las tareas del estado local
                    getActions().sincroConServidor([]); // Sincronizar con el servidor
                })
                .catch(error => console.log("Error al borrar todas las tareas: ", error));
            },


			// Sincronizar la lista de tareas actual con el servidor
            sincroConServidor: (actualizarTodos) => {
                const BACKEND_URL = process.env.BACKEND_URL; // Asegúrate de que esté definido

                fetch(`${BACKEND_URL}/api/tareas`, {
                    method: "PUT",
                    body: JSON.stringify(actualizarTodos), // Enviar la lista actualizada de tareas al servidor
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error al sincronizar con el servidor');
                    }
                    return response.json();
                })
                .then(data => console.log("Lista sincronizada con el servidor:", data)) // Confirmar la sincronización
                .catch(error => console.log("Error al sincronizar con el servidor: ", error));
            },
			
		}
	};
};

export default getState;
