const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios.class');
const { crearMensaje } = require('../utilidades/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    // Escuchando el evento entrar al chat
    client.on('entrarChat', (usuario, callback) => {
        console.log(usuario);
        if (!usuario.nombre || !usuario.sala) {
            callback({
                error: true,
                mensaje: 'El nombre es necesario'
            });
        }

        client.join(usuario.sala);

        usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala);
        // Emite la lista de usuarios conectados
        client.broadcast.to(usuario.sala).emit('listaPersona', usuarios.getPersonasPorSala(usuario.sala));

        callback(usuarios.getPersonasPorSala(usuario.sala));

    });

    // Escuchando cuando un usuario manda un mensaje para todos los miembros de la sala
    client.on('crearMensaje', (data) => {
        let persona = usuarios.getPersona(client.id);
        let mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);
    })

    // Escuchando cuando se desconecta un usuario
    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id);
        if (personaBorrada) {
            client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salió`));
            client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
        }

    });

    // Escuchando cuanto un usuario manda un mensaje privado
    client.on('mensajePrivado', (data, callback) => {
        if (!data.para) {
            callback({
                error: true,
                mensaje: 'Es necesario proporcionar el id de el usuario destino'
            });
        }

        let persona = usuarios.getPersona(client.id);

        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));
        callback(null, {
            ok: true,
            mensaje: 'Mensaje entregado'
        });
    });

});