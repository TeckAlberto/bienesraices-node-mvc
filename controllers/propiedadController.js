import { unlink } from 'node:fs/promises'
import { validationResult } from 'express-validator';
import { Precio, Categoria, Propiedad } from '../models/index.js';

const admin = async (req, res) => {

  
  // Leer query string
  const { pagina: paginaActual } = req.query;
  
  const regex = /^[1-9]$/;
  
  if(!regex.test(paginaActual)) {
    return res.redirect('/mis-propiedades?pagina=1')
  }
  
  try {
      
      const { id } = req.usuario;
      
      // Limites y Offset para el paginador
      const limit = 5;
      const offset = (paginaActual * limit) - limit;

      const [propiedades, total] = await Promise.all([
        Propiedad.findAll({
          limit,
          offset,
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
              as: "precio",
            },
          ],
        }),
        Propiedad.count({
          where: {
            usuarioId: id
          }
        })
      ]);



      res.render("propiedades/admin", {
        pagina: "Mis propiedades",
        propiedades,
        csrfToken: req.csrfToken(),
        paginaActual: Number(paginaActual),
        paginas: Math.ceil(total / limit),
        offset,
        limit,
        total,
      });  
    } catch (err) {
      console.error(err);
    }

    
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

const editar = async (req, res) => {

    const { id } = req.params;
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);
    if(!propiedad) {
        return res.redirect('/mis-propiedades');
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if(propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
        return res.redirect("/mis-propiedades");
    }

    // Consultar base de datos
    const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll(),
    ]);

    res.render("propiedades/editar", {
      pagina: `Editar Propiedad: ${propiedad.titulo}`,
      csrfToken: req.csrfToken(),
      categorias,
      precios,
      datos: propiedad,
    });
}

const guardarCambios = async (req, res) => {
    
    // Verificar la validacion
    let resultado = validationResult(req);

    if (!resultado.isEmpty()) {
      const [categorias, precios] = await Promise.all([
        Categoria.findAll(),
        Precio.findAll(),
      ]);

      return res.render("propiedades/editar", {
        pagina: `Editar Propiedad`,
        csrfToken: req.csrfToken(),
        categorias,
        precios,
        errores: resultado.array(),
        datos: req.body,
      });
    }

    const { id } = req.params;
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);
    if (!propiedad) {
      return res.redirect("/mis-propiedades");
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
      return res.redirect("/mis-propiedades");
    }

    // Reescribir el objeto y actualizarlo

    try {
        const {
          titulo,
          descripcion,
          habitaciones,
          estacionamiento,
          wc,
          calle,
          lat,
          lng,
          precio: precioId,
          categoria: categoriaId,
        } = req.body;
        propiedad.set({
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
        });

        await propiedad.save();

        res.redirect('/mis-propiedades');
    } catch (err) {
        console.error(err)
    }

    

}

const eliminar = async (req, res) => {

    const { id } = req.params;
    // Validar que la propiedad exista
    const propiedad = await Propiedad.findByPk(id);
    if (!propiedad) {
      return res.redirect("/mis-propiedades");
    }

    // Revisar que quien visita la URL, es quien creo la propiedad
    if (propiedad.usuarioId.toString() !== req.usuario.id.toString()) {
      return res.redirect("/mis-propiedades");
    } 

    // Eliminar Imagen
    await unlink(`public/uploads/${propiedad.imagen}`);

    // Eliminar la Propiedad
    await propiedad.destroy();
    res.redirect('/mis-propiedades');
}

// Muestra una propiedad
const mostrarPropiedad = async (req, res) => {

  const { id } = req.params;
  

  // Verificar que la propiedad exista
  const propiedad = await Propiedad.findByPk(id, {
    include: [
      {
        model: Categoria,
        as: "categoria",
      },
      {
        model: Precio,
        as: "precio",
      },
    ],
  });

  if(!propiedad) {
    return res.redirect('/404');
  }



  res.render('propiedades/mostrar', {
    propiedad,
    pagina: propiedad.titulo,
    csrfToken: req.csrfToken(),
  })
}

export {
    admin,
    crear,
    guardar,
    agregarImagen,
    almacenarImagen,
    editar,
    guardarCambios,
    eliminar,
    mostrarPropiedad
}