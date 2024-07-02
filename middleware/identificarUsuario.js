import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const identificarUsuario = async (req, res, next) => {

    // Identificar si hay usuario
    const { _token } = req.cookies;

    if(!_token) {
        req.usuario = null;
        return next();
    }

    // Comprobar el token
    try {
        const decoded = jwt.verify(_token, process.env.JWT_SECRET);
        const usuario = await Usuario.scope('eliminarPassword').findByPk(decoded.id);

        // Almacenar el usuario al req
        if(usuario){
            req.usuario = usuario;
        }
        return next();
    } catch (err) {
        console.error(err);
        return res.clearCookie('_token').redirect('/auth/login')
    }


}

export default identificarUsuario;