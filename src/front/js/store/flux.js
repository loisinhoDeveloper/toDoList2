const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			token: localStorage.getItem('token') || null, // Se debe almacenar en el estado del frontend (y opcionalmente en localStorage). Esto permite que el usuario permanezca autenticado incluso después de cerrar y reabrir el navegador.
			todos: [], 
            user: [],
            usuarioLogueado: localStorage.getItem('token') !== null, // Inicializa según si hay un token


			
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
                        const data = await response.json();
                        if (data.token) {
                            localStorage.setItem("token", data.token); // Guardar token en localStorage
                            
                            // Actualiza el store con el token, estado de login y la información del usuario
                            setStore({ 
                                token: data.token, 
                                usuarioLogueado: true, 
                                user: data.user // Almacena la información del usuario
                            });
            
                            localStorage.setItem('usuarioImage', data.user.photo || 'default-image-url');
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
            
            // Cerrar sesión
            logout: () => {
                localStorage.removeItem('token'); // Elimina el token del localStorage
                setStore({ user: null, usuarioLogueado: false, todos: [] });
            },

			

			obtenerTareas: () => {
                const token = getStore().token;
                const BACKEND_URL = process.env.BACKEND_URL; 
            
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
                    console.log("Datos recibidos:", data); //  para ver qué se devuelve
                    // Si el objeto de respuesta es un array de tareas, guardamos directamente
                    setStore({ todos: data });
                })
                .catch(error => console.log("Error al obtener tareas:", error));
            },
            

			// Añadir una nueva tarea
            añadirTarea: (nuevaTarea) => {
                const BACKEND_URL = process.env.BACKEND_URL; 
                fetch(`${BACKEND_URL}/api/tareas`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
                    },
                    body: JSON.stringify(nuevaTarea)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Error al añadir la tarea");
                    }
                    return response.json(); // Obtengo la tarea creada con el ID
                })
                .then(tareaCreada => {
                    const store = getStore();
                    const actualizarTodos = [...store.todos, tareaCreada]; // Añadir la nueva tarea con ID
                    setStore({ todos: actualizarTodos }); // Actualizar el estado local
                })
                .catch(error => console.log("Error al añadir la tarea:", error));
            },
            

           // Eliminar una tarea por ID y su índice en la lista local
            eliminarTarea: (index, id) => {
                console.log("ID de la tarea:", id); // Verifica el ID aquí
                const BACKEND_URL = process.env.BACKEND_URL; // Asegúrate de que esté definido
                console.log("URL del backend:", BACKEND_URL);

                fetch(`${BACKEND_URL}/api/tareas/${id}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
                    }
                })
                .then(() => {
                    const store = getStore();
                    console.log("Lista de tareas antes de eliminar:", store.todos);
                    const nuevaListaDeTareas = store.todos.filter((_, i) => i !== index); // Filtrar para eliminar la tarea por su índice
                    setStore({ todos: nuevaListaDeTareas }); // Actualizar la lista local
                    getActions().sincroConServidor(nuevaListaDeTareas); // Sincronizar con el servidor
                })
                .catch(error => console.log("Error al eliminar la tarea: ", error));
            },


                        // Borrar todas las tareas
            borrarTodasLasTareas: () => {
                const BACKEND_URL = process.env.BACKEND_URL; 

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
                const BACKEND_URL = process.env.BACKEND_URL; 

                fetch(`${BACKEND_URL}/api/tareas`, {
                    method: "PUT",
                    body: JSON.stringify(actualizarTodos), // Enviamos la lista actualizada de tareas al servidor
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
                .then(data => console.log("Lista sincronizada con el servidor:", data))
                .catch(error => console.log("Error al sincronizar con el servidor: ", error));
            },
			
		}
	};
};

export default getState;
