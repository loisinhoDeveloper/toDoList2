from flask_sqlalchemy import SQLAlchemy

# Crear una instancia global de SQLAlchemy
db = SQLAlchemy()


#Guarda la información. Cada usuario tiene un id, un email, una password y un campo is_active para saber si su cuenta está activa.

class User(db.Model):
    __tablename__ = "user"

    id = db.Column(db.Integer(), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), unique=False, nullable=False)
    photo = db.Column(db.String(250), unique=False, nullable=True)
    is_active = db.Column(db.Boolean, default=True)

    # Definición de la relación con Tarea
    tareas = db.relationship('Tarea', backref='user', lazy=True)



    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "photo": self.photo,
        }

    def __repr__(self):
        return f'<User {self.email}>'



  # Nuevo modelo para Tareas.
  #Guarda las tareas que cada usuario crea. Cada tarea tiene un id, un label (nombre de la tarea), un done (para saber si está completada), y un user_id para vincular la tarea a un usuario específico. 

class Tarea(db.Model):
    __tablename__ = "tarea"  # Nombre de la tabla en la base de datos

    id = db.Column(db.Integer(), primary_key=True)
    label = db.Column(db.String(120), nullable=False)  # Texto de la tarea
    descripcion = db.Column(db.String(255), nullable=True)  # Descripción opcional de la tarea
    done = db.Column(db.Boolean, default=False)  # Si la tarea está completada o no
    user_id = db.Column(db.Integer(), db.ForeignKey('user.id'), nullable=False)  # Relación con la tabla 'users'

    def serialize(self):
        return {
            "id": self.id,
            "label": self.label,
            "descripcion": self.descripcion,
            "done": self.done,
            "user_id": self.user_id
        }  

    def __repr__(self):
        return f'<Tarea {self.label}>'
