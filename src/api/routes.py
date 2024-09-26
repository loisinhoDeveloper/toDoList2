"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from api.models import db, User, Tarea  
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token




api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/')
def root():
    return "Home"


@api.route('/signup', methods=['POST'])
def signup():
    # Obtiene los datos enviados en la solicitud (deberían ser un JSON con email y password)
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    # Verifica que el email y la contraseña se hayan proporcionado
    if not email or not password:
        return jsonify({"error": "Email y password obligatorios."}), 400
    
    # Verifica si ya existe un usuario con el email proporcionado
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "El usuario con este correo electronico ya existe."}), 400
    
    # Hashea la contraseña usando método por defecto pbkdf2:sha256, que es más seguro y recomendado
    hashed_password = generate_password_hash(password)
    
    # Crea un nuevo usuario con el email y la contraseña hasheada
    nuevoUsuario = User(email=email, password=hashed_password, is_active=True)
    
    # Agrega el nuevo usuario a la base de datos
    db.session.add(nuevoUsuario)
    db.session.commit()
    
    # Devuelve los detalles del nuevo usuario en formato JSON
    return jsonify(nuevoUsuario.serialize()), 201


@api.route('/login', methods=['POST']) #el endpoint de login es como una puerta, y la llave es tu email y contraseña.
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password') 
    
    # Validar la entrada
    if not email or not password:
         return jsonify({'success': False, 'msg': 'Email y contraseña son requeridos'}), 400
    
    # Buscar al usuario por email
    user = User.query.filter_by(email=email).first()
    
    #  Una vez que un usuario ha sido autenticado correctamente (es decir, su contraseña ha sido verificada con check_password_hash), se crea un token para permitirle acceder a recursos protegidos.
    if user and check_password_hash(user.password, password):  # check_password_hash  verificar si la contraseña proporcionada coincide con la almacenada. (versión encriptada) para verificar si son iguales

        # Si todo está bien, "tarjeta de acceso" (un token) que puede usar para entrar en la aplicación más tarde. 
        access_token = create_access_token(identity=user.id)
        
        # Devolver respuesta con éxito, token y datos del usuario
        return jsonify({
            'success': True,
            'user': user.serialize(),  # Damos información sobre el usuario, pero sin incluir la contraseña.
            'token': access_token # Token para autenticación en futuras solicitudes
        }), 200
    
    # Si las credenciales son incorrectas
    return jsonify({
        'success': False,
        'msg': 'Combinación usuario/contraseña no es válida'
    }), 401


# @api.route('/perfil/<int:id>', methods=['PUT'])
# @jwt_required()
# def editar_perfil(id):
#     edited_user = User.query.get(id)
#     data=request.json
#     edited_user.email = data.get('email', None) if data.get('email') else edited_user.email
#     edited_user.password = data.get('password', None) if data.get('password') else edited_user.password

#     db.session.commit()
#     return jsonify(edited_user.serialize()), 200


#AÑADIR TAREA
@api.route('/tareas', methods=['POST'])
@jwt_required()  # Solo usuarios autenticados pueden acceder
def añadir_Tarea():
    try:
        data = request.json  # Obtiene los datos de la petición
        user_id = get_jwt_identity()  # ID del usuario autenticado
        
        # Verifica si el usuario existe
        usuario = User.query.get(user_id)  # Obtiene el usuario por su ID
        if not usuario:
            return jsonify({"success": False, "msg": "No se encontró el usuario"}), 404
        
        # Extrae los datos de la tarea
        label = data.get('label')
        done = data.get('done', False)  # Valor por defecto False si no se proporciona
        descripcion = data.get('descripcion', None) # La descripción es opcional

        # Verifica si la tarea ya existe
        if Tarea.query.filter_by(label=label, user_id=user_id).first():
            return jsonify({'success': False, 'msg': 'La tarea ya existe, escribe otra'}), 400
        
        # Crea una nueva tarea
        nueva_tarea = Tarea(label=label, done=done, descripcion=descripcion, user_id=user_id)
        
        # Añade la tarea a la base de datos
        db.session.add(nueva_tarea)
        db.session.commit()
        
        return jsonify({'success': True, 'msg': 'Tarea creada satisfactoriamente', 'tarea': nueva_tarea.serialize()}), 201

    except Exception as e:
        print('Error:', e)  # Para el log
        return jsonify({"success": False, "msg": "Error al crear la tarea"}), 500  # Código 500 para error interno del servidor


#  método GET para obtener todas las tareas del usuario autenticado a través del token JWT, devolviendo las tareas en formato JSON.
@api.route('/tareas', methods=['GET'])
@jwt_required()
def obtener_tareas():
    user_id = get_jwt_identity()  # el ID del usuario autenticado desde el token
    print(f"ID del usuario autenticado: {user_id}")  # Para verificar el ID

    try:
        tareas_usuario = Tarea.query.filter_by(user_id=user_id).all()  # Obtiene solo las tareas que pertenecen al usuario autenticado

        if not tareas_usuario:
            return jsonify({"message": "No se encontraron tareas para este usuario"}), 404
        
        # Serializa las tareas y las devuelve en formato JSON
        return jsonify({'success': True, 'tareas': [tarea.serialize() for tarea in tareas_usuario]}), 200


    except Exception as e:
        print("Error al obtener tareas:", e)  # Log del error
        return jsonify({"message": "Error al obtener las tareas"}), 500  # Error del servidor
    





# Endpoint para editar una tarea existente.  Solicitud PUT para editar una tarea, se valida que la tarea pertenezca al usuario autenticado y se actualizan los campos correspondientes.
@api.route('/tareas/<int:tarea_id>', methods=['PUT'])
@jwt_required()  # solo usuarios autenticados puedan actualizar tareas
def actualizar_tarea(tarea_id):
    try:
        data = request.json  # Obtiene los datos de la petición
        user_id = get_jwt_identity()  # ID del usuario autenticado

        # Verifica si la tarea existe y pertenece al usuario autenticado
        tarea = Tarea.query.filter_by(id=tarea_id, user_id=user_id).first()
        if not tarea:
            return jsonify({"success": False, "msg": "Tarea no encontrada o no pertenece al usuario"}), 404

        # Extrae los nuevos datos de la tarea
        label = data.get('label')
        descripcion = data.get('descripcion')

        # Se comprueba si se proporcionan nuevos valores para label y descripcion. Si están presentes, se actualizan en la tarea.
        if label is not None:
            tarea.label = label
        if descripcion is not None:
            tarea.descripcion = descripcion

        # Guarda los cambios en la base de datos
        db.session.commit()

        return jsonify({'success': True, 'msg': 'Tarea actualizada satisfactoriamente', 'tarea': tarea.serialize()}), 200

    except Exception as e:
        print('Error:', e)  # Para el log
        return jsonify({"success": False, "msg": "Error al actualizar la tarea"}), 500  # Código 500 para error interno del servidor






# Endpoint para eliminar una tarea
@api.route('/tareas/<int:tarea_id>', methods=['DELETE'])
@jwt_required()  # Solo usuarios autenticados pueden acceder
def eliminar_tarea(tarea_id):
    try:
        user_id = get_jwt_identity()  # ID del usuario autenticado

        # Verifica si la tarea existe y pertenece al usuario autenticado
        tarea = Tarea.query.filter_by(id=tarea_id, user_id=user_id).first()
        if not tarea:
            return jsonify({"success": False, "msg": "Tarea no encontrada o no pertenece al usuario"}), 404
        
        # Elimina la tarea de la base de datos
        db.session.delete(tarea)
        db.session.commit()

        return jsonify({'success': True, 'msg': 'Tarea eliminada satisfactoriamente'}), 200

    except Exception as e:
        print('Error:', e)  # Para el log
        return jsonify({"success": False, "msg": "Error al eliminar la tarea"}), 500  # Código 500 para error interno del servidor




# Endpoint para borrar todas las tareas del usuario autenticado
@api.route('/tareas', methods=['DELETE'])
@jwt_required()  # Solo usuarios autenticados pueden acceder
def borrar_todas_las_tareas():
    user_id = get_jwt_identity()  # ID del usuario autenticado
    tareas = Tarea.query.filter_by(user_id=user_id).all()  # Filtra tareas por usuario
    
    if not tareas:
        return jsonify({"success": False, "msg": "No hay tareas para eliminar"}), 404  # Mensaje si no hay tareas

    for tarea in tareas:
        db.session.delete(tarea)  # Elimina cada tarea de la lista
    db.session.commit()  # Guarda los cambios
    
    return jsonify({"success": True, "msg": "Todas las tareas han sido eliminadas satisfactoriamente"}), 200  # Mensaje de éxito

