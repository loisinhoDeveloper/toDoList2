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






# Devuelve todas las tareas asociadas al usuario que ha iniciado sesión.
@api.route('/tareas', methods=['GET'])
@jwt_required()
def obtener_Tareas():

    user_id_autenticado = get_jwt_identity()  # Obtén el ID del usuario autenticado
    tareas = Tarea.query.filter_by(user_id=user_id_autenticado).all()  # Consulta las tareas en la base de datos filtradas por el ID del usuario.

    return jsonify([tarea.serialize() for tarea in tareas]), 200  # Devuelve una lista de tareas en formato JSON.




# Endpoint para agregar una nueva tarea
@api.route('/tareas', methods=['POST'])
@jwt_required()  # Solo usuarios autenticados pueden acceder
def añadir_Tarea():

    user_id_autenticado = get_jwt_identity()  # ID del usuario autenticado
    body = request.get_json()  # Obtiene los datos de la petición
    nuevaTarea = Tarea(label=body['label'], done=False, user_id=user_id_autenticado)  # Crea una nueva tarea


    db.session.add(nuevaTarea)  # Añade la tarea a la base de datos
    db.session.commit()  # Guarda los cambios
    return jsonify(nuevaTarea.serialize()), 201  # Devuelve la nueva tarea en formato JSON




# Endpoint para eliminar una tarea
@api.route('/tareas/<int:tarea_id>', methods=['DELETE'])
@jwt_required()
def eliminar_tarea(tarea_id):

    user_id_autenticado = get_jwt_identity()  # ID del usuario autenticado
    tarea = Tarea.query.filter_by(id=tarea_id, user_id=user_id_autenticado).first()  # Busca la tarea del usuario autenticado
    if not tarea:
        return jsonify({"message": "Tarea no encontrada"}), 404  # Devuelve error si no se encuentra la tarea
    

    db.session.delete(tarea)  # Elimina la tarea
    db.session.commit()  # Guarda los cambios
    return jsonify({"message": "Tarea eliminada"}), 200




# Endpoint para borrar todas las tareas
@api.route('/tareas', methods=['DELETE'])
@jwt_required()  # Solo usuarios autenticados pueden acceder
def borrar_Todas_Las_Tareas():

    user_id_autenticado = get_jwt_identity()  # ID del usuario autenticado
    tareas = Tarea.query.filter_by(user_id=user_id_autenticado).all()  # Obtiene todas las tareas del usuario
    for tarea in tareas:

        db.session.delete(tarea)  # Elimina cada tarea de la lista
    db.session.commit()  # Guarda los cambios
    return jsonify({"message": "Todas las tareas han sido eliminadas"}), 200  # Devuelve un mensaje de éxito





