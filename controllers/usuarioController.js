import { check, validationResult } from "express-validator";
import Usuario from "../models/Usuario.js";
import { generarId } from "../helpers/token.js";
import { emailRegistro } from "../helpers/emails.js";
import { where } from "sequelize";

const formularioLogin = (req, res) => {
  res.render("auth/login", {
    pagina: "Iniciar Sesion",
  });
};

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
      token: generarId()
    });


    // Envia email de confirmacion
    emailRegistro({
      nombre: usuario.nombre,
      email: usuario.email,
      token: usuario.token
    });

    // Mostrar mensaje de confirmacion
    res.render('templates/mensaje', {
      pagina: "Cuenta Creada Correctamente",
      mensaje: "Hemos Enviado un Email de Confirmacion, presiona el Boton de Enlace"
    });
  
};


// Funcion para comprueba una cuenta
const confirmar = async (req, res) => {

  const { token } = req.params;

  // Verificar si el token es valido
  const usuario = await Usuario.findOne({ where: {token}})

  if(!usuario) {
    return res.render("auth/confirmar-cuenta", {
      pagina: "Error al confirmar la cueta",
      mensaje:"Hubo un error al confirmar tu cuenta, intenta de nuevo",
      error: true
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

}


const formularioOlvidePassword = (req, res) => {
  res.render("auth/olvide-password", {
    pagina: "Recupera tu acceso a Bienes Raices",
  });
};

export {
  formularioLogin,
  formularioRegistro,
  registar,
  confirmar,
  formularioOlvidePassword,
};
