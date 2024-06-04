import express from "express"; // ES modules
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import usuriosRoutes from "./routes/usuarioRoutes.js";
import propiedadesRoutes from "./routes/propiedadesRoutes.js";
import db from "./config/db.js";

//const express = require('express'); // commonJS


// Crear la app
const app = express();

// Habilitar lectura de datos de formmularios
app.use( express.urlencoded({extended: true}) );

// Habilitar cookie parser
app.use( cookieParser() );

// Habilitar CSRF
app.use( csrf({cookie: true}));

// Conexion a la base de datos
try {
    await db.authenticate();
    db.sync();
    console.log('Conexion correcta a la base de datos');
} catch (err) {
    console.error(err);
}


// Habilitar pug
app.set('view engine', 'pug');
app.set('views', './views');

// Carpeta publica
app.use( express.static('public') );

// Routing
app.use('/auth', usuriosRoutes);
app.use('/', propiedadesRoutes);




// Definir el puerto y arrancar el proyecto
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`El servidor esta funcionando en el puerto ${port}`);
});