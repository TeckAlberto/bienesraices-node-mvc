import { validationResult } from 'express-validator';
import { Precio, Categoria, Propiedad, Usuario } from '../models/index.js';

const admin = async (req, res) => {

    const { id } = req.usuario;

    console.log(id)

    const propiedades = await Propiedad.findAll({
      where: {
        usuarioId: id,
      },
      include: [
        {
            model: Categoria,
            as: "categoria",
        },
        {
            model: Precio,
            as: 'precio'
        }
      ],
    });

    res.render('propiedades/admin', {
        pagina: "Mis propiedades",
        propiedades
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
          csrfToken: req.csrfToken(),
          categorias,
          precios,
          errores: resultado.array(),
          datos: req.body,
        });
    }

    // Crear un registro
    const { titulo, descripcion, habitaciones, estacionamiento, wc, calle, lat, lng, precio: precioId, categoria: categoriaId } = req.body
    
    const { id: usuarioId } = req.usuario; 
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
            categoriaId,
            usuarioId,
            imagen: ''
        });

        const { id } = propiedadGuardada;

        res.redirect(`/propiedades/agregar-imagen/${id}`);
    } catch (err) {
        console.error(err);
    }
}

const agregarImagen = async (req, res) => {

    const { id } = req.params
    
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id)

    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }
    
    // Validar que la propiedad no este publicada
    if(propiedad.publicado) {
        return res.redirect('/mis-propiedades');
    }

    // Validar que la propiedad pertenece a quien la visita
    if(req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
        return res.redirect('/mis-propiedades');
    }


    res.render("propiedades/agregar-imagen", {
      pagina: `Agregar Imagen: ${propiedad.titulo}`,
      csrfToken: req.csrfToken(),
      propiedad,
    });
}

const almacenarImagen = async (req, res, next) => {
    
    const { id } = req.params;

    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);

    if (!propiedad) {
      return res.redirect("/mis-propiedades");
    }

    // Validar que la propiedad no este publicada
    if (propiedad.publicado) {
      return res.redirect("/mis-propiedades");
    }

    // Validar que la propiedad pertenece a quien la visita
    if (req.usuario.id.toString() !== propiedad.usuarioId.toString()) {
      return res.redirect("/mis-propiedades");
    }

    try {
        
        // Almacenar la imagen y publicar la propiedad
        propiedad.imagen = req.file.filename
        propiedad.publicado = 1;

        await propiedad.save();
        
        next();

    } catch (err) {
        console.log(err)
    }
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
}