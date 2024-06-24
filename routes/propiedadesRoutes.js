import express from 'express';
import { body } from 'express-validator';
import { admin, agregarImagen, almacenarImagen, crear, editar, eliminar, guardar, guardarCambios, mostrarPropiedad } from '../controllers/propiedadController.js';
import protegerRuta from '../middleware/protegerRuta.js';
import upload from '../middleware/subirArchivo.js';

const router = express.Router();

router.get('/mis-propiedades', protegerRuta, admin);
router.get('/propiedades/crear', protegerRuta, crear);
router.post(
  "/propiedades/crear",
  protegerRuta,
  body("titulo").notEmpty().withMessage("El titulo del anuncion es obligado"),
  body("descripcion")
    .notEmpty()
    .withMessage("La descripcion no puede ir vacia")
    .isLength({ max: 200 }).withMessage('La descripcion es muy larga'),
  body('categoria').isNumeric().withMessage('Selecciona una catagoria'),
  body('precio').isNumeric().withMessage('Selecciona un rango de Precios'),
  body('habitaciones').isNumeric().withMessage('Selecciona la cantidad de habitaciones'),
  body('estacionamiento').isNumeric().withMessage('Selecciona la cantidad de estacionamientos'),
  body('wc').isNumeric().withMessage('Selecciona la cantidad de banios'),
  body('lat').notEmpty().withMessage('Ubica la propiedad en el mapa'),
  guardar
);

router.get("/propiedades/agregar-imagen/:id", protegerRuta, agregarImagen);

router.post(
  "/propiedades/agregar-imagen/:id",
  protegerRuta,
  upload.single("imagen"),
  almacenarImagen
);


router.get('/propiedades/editar/:id', 
  protegerRuta,
  editar
);

router.post(
  "/propiedades/editar/:id",
  protegerRuta,
  body("titulo").notEmpty().withMessage("El titulo del anuncion es obligado"),
  body("descripcion")
    .notEmpty()
    .withMessage("La descripcion no puede ir vacia")
    .isLength({ max: 200 })
    .withMessage("La descripcion es muy larga"),
  body("categoria").isNumeric().withMessage("Selecciona una catagoria"),
  body("precio").isNumeric().withMessage("Selecciona un rango de Precios"),
  body("habitaciones")
    .isNumeric()
    .withMessage("Selecciona la cantidad de habitaciones"),
  body("estacionamiento")
    .isNumeric()
    .withMessage("Selecciona la cantidasd de estacionamientos"),
  body("wc").isNumeric().withMessage("Selecciona la cantidad de banios"),
  body("lat").notEmpty().withMessage("Ubica la propiedad en el mapa"),
  guardarCambios
);

router.post('/propiedades/eliminar/:id', 
  protegerRuta,
  eliminar
)

// Area publica
router.get('/propiedad/:id',
  mostrarPropiedad
)



export default router;