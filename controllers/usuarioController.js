import { check, validationResult } from "express-validator";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from "../models/Usuario.js";
import { generarId, generarJWT } from "../helpers/tokens.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/emails.js";

const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesion",
    csrfToken: req.csrfToken(),
  });
};

const autenticar = async (req, res) => {
  // Validacion
  await check("email").isEmail().withMessage("El email es obligatorio").run(req);
  await check("password")
    .notEmpty()
    .withMessage("El password es obligatorio")
    .run(req);
  
  let resultado = validationResult(req);

  if(!resultado.isEmpty()) {
    // Errores
    return res.render('auth/login', {
      pagina: 'Iniciar Sesion',
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    })
  }


  const { email, password } = req.body;

  // Comprobar si el usuario existe
  const usuario = await Usuario.findOne({ where: { email }});
  if (!usuario) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesion",
      csrfToken: req.csrfToken(),
      errores: [{msg: 'El usuario no existe'}],
    });
  }

  // Comprobar si el usuario esta confirmado
  if(!usuario.confirmado) {
    return res.render("auth/login", {
      pagina: "Iniciar Sesion",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "Tu cuenta no ha sido confirmada" }],
    });
  }

  // Revisar el password
  if(!usuario.verificarPassword(password)){
    return res.render("auth/login", {
      pagina: "Iniciar Sesion",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El password es incorrecto" }],
    });
  }

  // Autenticar al usuario
  const token = generarJWT(usuario.id);

  

  // Almacenar en un cookie
  return res.cookie('_token', token, {
    httpOnly: true,
    //secure: true,
  }).redirect('/mis-propiedades');

}

const formularioRegistro = (req, res) => {
  res.render("auth/registro", {
    pagina: "Crear Cuenta",
    csrfToken: req.csrfToken(),
  });
};

const registar = async (req, res) => {
  // Validacion
  await check("nombre")
    .notEmpty()
    .withMessage("El nombre no puede ir vacio")
    .run(req);
  await check("email").isEmail().withMessage("Eso no parece un email").run(req);
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El password debe de ser de al menos de 6 caracteres")
    .run(req);
  await check("password")
    .equals("password")
    .withMessage("Los passwords no son iguales")
    .run(req);

  let resultado = validationResult(req);

  // Verificar que no haya errores en las validaciones
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
      usuario: {
        nombre: req.body.nombre,
        email: req.body.email,
      },
    });
  }

  // Extraer el los datos
  const { nombre, email, password } = req.body;

  // Verificar que el usuario no este duplicado
  const existeUsuario = await Usuario.findOne({ where: { email } });

  if (existeUsuario) {
    return res.render("auth/registro", {
      pagina: "Crear Cuenta",
      csrfToken: req.csrfToken(),
      errores: [{ msg: "El usuario ya esta registado" }],
      usuario: {
        nombre,
        email,
      },
    });
  }

  // Almacenar un usuario
  const usuario = await Usuario.create({
    nombre,
    email,
    password,
    token: generarId(),
  });

  // Envia email de confirmacion
  emailRegistro({
    nombre: usuario.nombre,
    email: usuario.email,
    token: usuario.token,
  });

  // Mostrar mensaje de confirmacion
  res.render("templates/mensaje", {
    pagina: "Cuenta Creada Correctamente",
    mensaje:
      "Hemos Enviado un Email de Confirmacion, presiona el Boton de Enlace",
  });
};

// Funcion para comprueba una cuenta
const confirmar = async (req, res) => {
  const { token } = req.params;

  // Verificar si el token es valido
  const usuario = await Usuario.findOne({ where: { token } });

  if (!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Error al confirmar la cueta",
      mensaje: "Hubo un error al confirmar tu cuenta, intenta de nuevo",
      error: true,
    });
  }

  // Confirmar la cuenta
  usuario.token = null;
  usuario.confirmado = true;
  await usuario.save();

  res.render("auth/confirmar-cuenta", {
    pagina: "Cuenta Confirmada",
    mensaje: "La cuenta se confirmo correctamente",
    error: false,
  });
};

const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    pagina: "Recupera tu acceso a Bienes Raices",
    csrfToken: req.csrfToken(),
  });
};

const resetPassword = async (req, res) => {
  // Validacion
  await check("email").isEmail().withMessage("Eso no parece un email").run(req);

  let resultado = validationResult(req);

  // Verificar que no haya errores en las validaciones
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/olvide-password", {
      pagina: "Recuperatu acceso a Bienes Raices",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  // Extraer los datos
  const { email } = req.body;

  // Verificar que existe el usuario
  const usuario = await Usuario.findOne({ where: { email } });

  if (!usuario) {
    return res.render("auth/olvide-password", {
      pagina: "Recuperatu acceso a Bienes Raices",
      csrfToken: req.csrfToken(),
      errores: [{ msg: 'El email no pertenece a ningun usuario'}],
    });
  }


  // Generar un token
  usuario.token = generarId();
  await usuario.save();

  // Envia email de confirmacion
  emailOlvidePassword({
    email: usuario.email,
    nombre: usuario.nombre,
    token: usuario.token,
  });

  // Mostrar mensaje de confirmacion
  res.render("templates/mensaje", {
    pagina: "Restablece tu Password",
    mensaje:
      "Hemos enviado un email con las instrucciones",
  });
};


const comprobarToken = async (req, res) => {
  const { token } = req.params;

  const usuario = await Usuario.findOne({where: {token}});
  
  if(!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Restablece tu Password",
      mensaje: "Hubo un error al validar tu informacion, intenta de nuevo",
      error: true,
    });
  }

  // Mostrar formulario para modificar el password
  res.render('auth/reset-password', {
    pagina: 'Reestablece tu Password',
    csrfToken: req.csrfToken(),
  })

}

const nuevoPassword = async (req, res) => {
  // Validad el password
  await check("password")
    .isLength({ min: 6 })
    .withMessage("El password debe de ser del al menos 6 caracteres")
    .run(req);

  let resultado = validationResult(req);

  // Verificar que no haya errores en las validaciones
  if (!resultado.isEmpty()) {
    //Errores
    return res.render("auth/reset-password", {
      pagina: "Restablece tu password",
      csrfToken: req.csrfToken(),
      errores: resultado.array(),
    });
  }

  const { token } = req.params;
  const { password } = req.body;

  // Identificar quien hace el cambio
  const usuario = await Usuario.findOne({ where: {token} })


  // Hashear el nuevo password
  const salt = await bcrypt.genSalt(10);
  usuario.password = await bcrypt.hash( password, salt);
  usuario.token = null;
  
  await usuario.save();

  res.render('auth/confirmar-cuenta', {
    pagina: 'Password Restablecido',
    mensaje: 'El Password se guardo correctamente'
  })


}

export {
  formularioLogin,
  autenticar,
  formularioRegistro,
  registar,
  confirmar,
  formularioOlvidePassword,
  resetPassword,
  comprobarToken,
  nuevoPassword,
};
