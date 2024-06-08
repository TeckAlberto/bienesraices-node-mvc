import categorias from "./categorias.js";
import Categoria from '../models/Categoria.js';
import precios from "./precios.js";
import Precio from "../models/Precio.js";
import db from "../config/db.js";

const importarDatos = async () => {
    try {
        // Autenticar
        await db.authenticate();

        // Generar las columnas
        await db.sync();

        // Insertamos los datos
        await Promise.all([
            Categoria.bulkCreate(categorias), 
            Precio.bulkCreate(precios)
        ]);
        console.log(`Datos insertados correctamente`);
        process.exit()

    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

const eliminarDatos = async () => {
    try {
        await db.sync( {force: true });
        console.log('Datos eliminados correctamente');
        process.exit();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

if(process.argv[2] === "-i") {
    importarDatos();
}

if (process.argv[2] === "-e") {
    eliminarDatos();
}