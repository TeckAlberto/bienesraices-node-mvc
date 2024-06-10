import { validationResult } from 'express-validator';
import { Precio, Categoria, Propiedad, Usuario } from '../models/index.js';

const admin = (req, res) => {
    res.render('propiedades/admin', {
        pagina: "Mis propiedades",
        barra: true,
    });
}

// Formulario para crear un registro de propiedad
const crear = async (req, res) => {
    
    // Consultar base de datos
    const [ categorias, precios ] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll()
    ])

    res.render("propiedades/crear", {
      pagina: "Crear Propiedad",
      barra: true,
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      datos: {},
    });
}

const guardar = async (req, res) => {
    // Validacion
    let resultado = validationResult(req);

    if(!resultado.isEmpty()) {
        const [ categorias, precios ] = await Promise.all([
            Categoria.findAll(),
            Precio.findAll()
        ]);

        res.render("propiedades/crear", {
          pagina: "Crear Propiedad",
          barra: true,
          csrfToken: req.csrfToken(),
          categorias,
          precios,
          errores: resultado.array(),
          datos: req.body,
        });
    }

    // Crear un registro
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body
    
    return
    try {
        const propiedadGuardada = await Propiedad.create({
            titulo,
            descripcion,
            habitaciones,
            estacionamiento,
            wc,
            calle,
            lat,
            lng,
            precioId,
            categoriaId
        })
    } catch (err) {
        console.error(err);
    }
    console.log(req.body);
}

export {
    admin,
    crear,
    guardar,
}