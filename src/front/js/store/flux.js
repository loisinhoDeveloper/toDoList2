//Este paso almacena el token en el localStorage del navegador, lo que permite que el token persista incluso si el usuario recarga la página o cierra el navegador. 
//Es útil para mantener la sesión activa entre recargas.

const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			token: localStorage.getItem('token') || null, // Se debe almacenar en el estado del frontend (y opcionalmente en localStorage). Esto permite que el usuario permanezca autenticado incluso después de cerrar y reabrir el navegador.
            user: null, // null para representar que no hay usuario inicialmente
            usuarioLogueado: localStorage.getItem('token') !== null, // Inicializa según si hay un token
            todos_user:[],// Almacena las tareas del usuario actual


			
		},

		actions: {

			crearUsuario: async (formData) => {
                try {
                    // Enviamos una solicitud al servidor para crear un nuevo usuario
                    const response = await fetch(process.env.BACKEND_URL + '/api/signup', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(formData) // Enviar los datos del usuario
                    });
            
                    // Verificamos si la respuesta fue exitosa
                    if (response.ok) {
                        const data = await response.json();
                        console.log("Usuario creado:", data);
                        return true; // Registro exitoso
                    } else {
                        // Manejo de errores
                        const errorData = await response.json(); // Obtén el mensaje de error del servidor
                        console.error("Error al crear el usuario:", errorData.message || 'Error desconocido');
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
                    const response = await fetch(process.env.BACKEND_URL + '/api/login', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ email, password }), // Convierte nuestro correo y contraseña en un formato que el servidor puede entender.
                    });
            
                    const data = await response.json();
                    console.log('Response data:', data);
            
                    if (response.ok) {
                        localStorage.setItem("token", data.token);  // Guardar token en el localStorage
                        setStore({ token: data.token, user: data.user }); //almaceno el token y la información usuario (id entre otros)... que regresa del backend en el estado global con setStore.
                        await getActions().obtenerTareas();  // Llama a obtenerTareas después de iniciar sesión
                        return { success: true, message: "Login exitoso" };
                    } else {
                        return { success: false, message: data.message || "Error en el login" };
                    }
                } catch (error) {
                    console.error("Error en login:", error);
                    return { success: false, message: "Error en el servidor" };
                }
            },
            
            
            // Cerrar sesión
            logout: () => {
                localStorage.removeItem('token'); // Elimina el token del localStorage
                setStore({ user: null, usuarioLogueado: false, todos_user: [] }); // Limpia el estado de tareas y usuario
            },

			

			// Obtener las tareas del usuario. Envía una solicitud GET al backend para obtener las tareas del usuario autenticado, y luego actualiza el estado global (todos_user) con las tareas obtenidas.
            obtenerTareas: async () => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + '/api/tareas', {
                        method: "GET",
                        headers: {
                           "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
                        }
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Si se obtienen las tareas correctamente, actualiza el estado
                        setStore({
                            todos_user: data.tareas // Actualiza el estado solo con las tareas del usuario autenticado
                        });
                        console.log('Tareas obtenidas satisfactoriamente:', data.tareas);
                    } else {
                        // Manejo de errores
                        console.error('Error al obtener las tareas:', data.msg);
                    }
                } catch (error) {
                    console.error('Error en la solicitud:', error);
                }
            },
            
            

            // Añadir una nueva tarea. solicitud POST al endpoint /api/tareas con los datos de la nueva tarea.
            //Usa el token JWT almacenado en el store para la autenticación.
            //Si la tarea se añade correctamente, se actualiza el estado (todos_user).
            añadirTarea: async (nuevaTarea) => {
                try {
                    const response = await fetch(process.env.BACKEND_URL + '/api/tareas', {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
                        },
                        body: JSON.stringify(nuevaTarea)
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Si la tarea se añade correctamente, actualiza el estado
                        setStore({
                            todos_user: [...getStore().todos_user, data.tarea] // Añadir la nueva tarea al estado
                        });
                        console.log('Tarea añadida satisfactoriamente:', data);
                    } else {
                        // Manejo de errores
                        console.error('Error al añadir la tarea:', data.msg);
                    }
                } catch (error) {
                    console.error('Error en la solicitud:', error);
                }
            },


            // Función para editar una tarea existente. Es decir, solicitud PUT al endpoint del backend y actualiza el estado del frontend con la nueva información de la tarea actualizada.
            actualizarTarea: (id, datosActualizados) => {
                const BACKEND_URL = process.env.BACKEND_URL; 
                                    
                fetch(`${BACKEND_URL}/api/tareas/${id}`, {
                    method: 'PUT',
                    headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getStore().token}`, // Obtener el token del store y añadir
                            },
                    body: JSON.stringify(datosActualizados), // Manda los nuevos datos (label y descripcion) del toDoList.jsx
                    
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error: ${response.status} - ${response.statusText}`);
                    }
                    return response.json(); // Obtengo la tarea actualizada
                })
                .then(tareaActualizada => {
                    const store = getStore();
                    const tareasActualizadas = store.todos_user.map(tarea => 
                        tarea.id === tareaActualizada.tarea.id ? tareaActualizada.tarea : tarea
                    ); // Actualiza la tarea en el estado
                    setStore({ todos_user: tareasActualizadas }); // Devuelve la tarea actualizada al frontend en el estado local del flux con tarea.label = label (titulo) y tarea.descripcion = descripcion (routes.py)
                })
                .catch(error => console.log("Error al actualizar la tarea:", error));
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
                    const nuevaListaDeTareas = store.todos_user.filter((_, i) => i !== index); // Filtrar para eliminar la tarea por su índice
                    setStore({ todos_user: nuevaListaDeTareas }); // Actualizar la lista local
                    // No es necesario llamar a actualizarTarea porque ya está limpiando el store.
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
                    setStore({ todos_user: [] }); // Limpiar todas las tareas del estado local
                      // No es necesario llamar a actualizarTarea porque ya está limpiando el store.
                })
                .catch(error => console.log("Error al borrar todas las tareas: ", error));
            },


			// // Sincronizar la lista de tareas actual con el servidor para una funcion de administrador, pero hay que conectar con routes.py!
            // sincroConServidor: (actualizarTodos) => {
            //     const BACKEND_URL = process.env.BACKEND_URL; 

            //     fetch(`${BACKEND_URL}/api/tareas`, {
            //         method: "PUT",
            //         body: JSON.stringify(actualizarTodos), // Enviamos la lista actualizada de tareas al servidor
            //         headers: {
            //             "Content-Type": "application/json",
            //             "Authorization": `Bearer ${getStore().token}` // Añadir el token JWT
            //         }
            //     })
            //     .then(response => {
            //         if (!response.ok) {
            //             throw new Error('Error al sincronizar con el servidor');
            //         }
            //         return response.json();
            //     })
            //     .then(data => console.log("Lista sincronizada con el servidor:", data))
            //     .catch(error => console.log("Error al sincronizar con el servidor: ", error));
            // },
			
		}
	};
};

export default getState;
