import bcrypt from 'bcrypt';

const usuarios = [
    {
        nombre: 'Alberto',
        email: 'alberto@correo.com',
        confirmado: 1,
        password: bcrypt.hashSync('password', 10),
    }
]

export default usuarios;