import net from 'net'
import { networkInterfaces } from 'os'

//  Configuración del servidor
const port = 3000
const server = net.createServer()
let host

//  Asignación de IP's
if (networkInterfaces()['Wi-Fi']) {
    networkInterfaces()['Wi-Fi'].map((network) => {
        if (network.family === 'IPv4') {
            host = network.address
        }
    })
}

//  Lista de Usuarios
const users = {}
const info_users = {}
let banned_users = []

//  Server Listeners
server.on('connection', (client) => {
    //  Verificamos si esta baneado
    if (firewall(client)) {
        return
    }

    //  Establecemos el tiempo máximo de inactividad
    users[client.remoteAddress] = client
    client.setTimeout(60 * 3000)

    // Si es nuevo el usuario asignamos la IP como nombre de usuario
    if (info_users[client.remoteAddress] === undefined) {
        info_users[client.remoteAddress] = { username: client.remoteAddress }
    }

    // Informamos la llegada de un nuevo usuario
    sayEveryone(`${printName(client)} ${sayServer('Conectado al servidor')}`, `${client.remoteAddress} [${printName(client)}] Conectado al servidor`, client.remoteAddress)

    //  Mostrar pantalla de bienvenida
    client.write('\nHola, bienvenido de nuevo a TCP IP - Chat Server\nSi deseas cambiar tu nombre de usuario escribe:\n\n-u: [NOMBRE DE USUARIO]\n\nEscribe -a para ver los comandos disponibles\n')

    //  Se ejecuta cuando el usuario ingresa información
    client.on('data', (data) => {
        //  Verificamos si el usuario escribio algun comando
        if (commandsUser(data, client)) {
            return
        }
        //  Verificamos que el usuario escriba algún texto
        if (data.toString().trim() === '') {
            return
        }

        //  Se envia mensaje a todos los hosts
        sayEveryone(`${printName(client)}: ${data.toString().trim()}`, `${client.remoteAddress} [${printName(client)}]: ${data.toString().trim()}`, client.remoteAddress)
        //  Se muestra el mensaje enviado
        client.write(`${printName(client, 'Tú:')} ${data.toString().trim()}`)
    })

    //  Se ejecuta despues de la inactividad
    client.on('timeout', () => {
        // Se envia mensaje a todos los hosts
        sayEveryone(`${sayServer('El usuario')} ${printName(client)} ${sayServer('se ha eliminado por inactividad')}`, `${sayServer('El usuario')} ${client.remoteAddress} [${printName(client)}] ${sayServer('se ha eliminado por inactividad')}`)
        //  Eliminar usuario por inactividad
        eject(client.remoteAddress, true)
    })

    //  Se ejecuta al salir del servidor
    client.on('close', () => {
        //  Comprobamos que el usuario este activo
        if (info_users[client.remoteAddress] !== undefined) {
            //  Se envia mensaje a todos los hosts
            sayEveryone(`${printName(client)} ${sayServer('abandono el servidor')}`)
        }
    })

    //  Se ejecuta al presentarse un error
    client.on('error', (err) => {
        //  Comprobamos el error
        if (err.errno === -4077) {
            //  Eliminar usuarios
            delete users[client.remoteAddress]
            //  Eliminar cliente
            client.destroy()
            return
        }
        //  Mostrar error
        console.error(err)
    })
})

//  Función para los comandos del usuario
function commandsUser(data, client) {
    //  Definimos nuestros comandos
    const commands = ['-s', '-u:', '-a']
    //  Obtenemos el comando ingresado por el usuario
    const commandsText = data.toString().trim().split(' ', 2)

    return commandsText.some((command, index, row) => {
        //  Si no existe el comando retornamos False
        if (commands.includes(command) && index === 1) {
            return false
        }

        //  Comando para salir del servidor
        if (command === '-s' && index === 0) {
            //  Eliminar usuarios
            delete users[client.remoteAddress]
            //  Eliminar cliente
            client.destroy()
        }

        //  Comando para cambiar el nombre de usuario
        if (command === '-u:' && index === 0 && row.length === 2) {
            //  Corroboramos en todos los usuarios que no existe el nombre
            for (const key in info_users) {
                if (info_users[key].username === row[1]) {
                    //  Mostrar que el nombre de usuario ya esta en uso
                    client.write(sayServer('Este nombre de usuario ya esta en uso'))
                    return true
                }
            }

            //  Se envia actualización al Servidor y a los Clientes
            sayEveryone(`${printName(client)} ${sayServer('ha cambiado su nombre de usuario a')} ${printName(client, row[1])}`, `${client.remoteAddress} [${printName(client)}] ha cambiado su nombre de usuario a ${printName(client, row[1])}`)

            info_users[client.remoteAddress].username = row[1]
        }

        //  Comando para listar los comandos
        if (command === '-a' && index === 0) {
            client.write(
                `\nLista de comandos:\n
                -u: [NOMBRE DE USUARIO] : Cambiar nombre de usuario
                -a: Mostrar lista de comandos
                -s : Salir del servidor\n`
            )
        }

        //  Retornamos los comandos
        return commands.includes(command)
    })
}

//  Función para mostrar nombre de usuario
function printName(client, message) {
    //  Comprobamos que el usuario haya ingresado un mensaje
    if (message === undefined) {
        message = info_users[client.remoteAddress].username
    }
    return `${message}`
}

//  Función para comunicarse con el Servidor
function sayServer(message) {
    return `${message}`
}

//  Función para comunicarse con el Servidor y los Clientes
function sayEveryone(messageClient, messageServer = messageClient, except) {
    //  Nuevos usuarios
    for (const key in users) {
        if (users[key].remoteAddress === except) continue
        users[key].write(messageClient)
    }
    //  Compartir mensajes
    console.log(messageServer.trim())
}

//  Función para verificar usuarios baneados
function firewall(user) {
    //  Verificar que el usuario no este baneado del servidor 
    if (banned_users.includes(user.remoteAddress)) {
        //  Eliminar usuario
        user.write(`¡Baneado del servidor!`)
        user.destroy()
        return true
    }
    return false
}

//  Función para mostrar usuarios baneados
function listBanned() {
    console.table(banned_users)
}

//  Función para expulsar un usuario del servidor
function eject(ip, inactive = true) {
    //  Verifica que el usuario ingrese la [IP]
    if (ip === undefined) {
        console.log('No ha ingresado una [IP] a expulsar')
        return false
    }
    //  Verifica que la [IP] este definida
    if (info_users[ip] === undefined) {
        console.log(`No existe ningún usuario con la [IP] -> [${ip}]`)
        return false
    }
    //  Expulsa al usuario del servidor por inactividad
    if (!inactive) {
        sayEveryone(`${sayServer('El usuario:')} ${printName(users[ip])} ${sayServer('ha sido expulsado del servidor')}`)
    }

    //  Eliminar usuario por [IP]
    users[ip].destroy()
    delete users[ip]
    return true
}

//  Función para expulsar a todos los usuarios del servidor
function ejectAll() {
    //  Comprobamos que existan usuarios
    if (Object.keys(users).length > 0) {
        //  Recorremos la lista de usuarios para expulsarlos
        for (const key in users) {
            //  Hacemos uso de nuestra función expulsar para reutilizar código
            eject(key)
            //  Mostramos que el usuario fue expulsado
            console.log(`${key} expulsado`)
        }
        return
    }
    //  Indicamos que los usuarios se eliminaron correctamente
    console.log('Usuarios eliminados')
}

//  Función para banear a un usuario del servidor
function ban(ip) {
    //  Primero expulsamos al usuario y comprobamos si fue eliminado
    if (eject(ip)) {
        //  Procedemos a eliminar y lo ingresamos a la lista negra
        delete info_users[ip]
        banned_users.push(ip)
        //  Informamos que el usuario fue baneado
        sayEveryone(`${ip} ¡Baneado del servidor!`)
    }
}

// Función para quitar baneo de un usuario del servidor
function unban(ip) {
    //  Verifica que el usuario ingrese la [IP]
    if (ip === undefined) {
        console.log('No ha ingresado una [IP] para remover de la lista negra del servidor')
        return
    }
    //  Verifica que la [IP] este definida en la lista de usuarios
    if (!banned_users.includes(ip)) {
        console.log(`No existe ningún usuario con la [IP] -> [${ip}] en la lista negra del servidor`)
        return
    }

    //  Quitamos de la lista negra del servidor al usuario baneado
    banned_users = banned_users.filter((banned) => {
        if (banned === ip) {
            //  Mostramos al usuario baneado
            console.log(`El usuario con [IP] -> [${ip}] fue desbaneado`)
            return
        }
        return banned
    })
}

//  Función para finalizar conexión con el servidor
function exit() {
    //  Expulsamos a todos los usuarios
    ejectAll()
    //  Cerramos conexión con el servidor
    server.close()
    //  Mostramos que el servicio a finalizado
    console.log('Servidor finalizado')
    process.exit(0)
}

//  Ejecutamos el servidor 
server.listen(port, host, () => {
    //  Mostrar el mensaje de bienvenida del servidor
    console.info(`
    +-+-+-+    Servidor TCP IP Iniciado    +-+-+-+
    | IP: ${server.address().address}            |
    | PORT: ${server.address().port}             |
    | Presione -a para ver la lista de comandos  |
    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-
    `)
})

//  Función en espera de respuesta del servidor
server.on('listening', () => {
    process.stdin.on('data', (raw) => {
        let data = raw.toString().trim().split(' ')
        switch (data[0]) {
            case '-lu': console.table(info_users)
                break;
            case '-lub': listBanned()
                break;
            case '-dip': eject(data[1], false)
                break;
            case '-dipall': ejectAll()
                break;
            case '-bip': ban(data[1])
                break;
            case '-aip': unban(data[1])
                break
            case '-s': exit()
                break;
            case '-a':
                console.log('Lista de comandos:',
                    '\n\n\t-lu: Listar usuarios registrados',
                    '\n\t-lub: Listar usuarios baneados',
                    '\n\t-dip: Elimina al usuario de la [IP] dada',
                    '\n\t-dipall: Elimina a todos los usuarios del servidor',
                    '\n\t-bip: Elimina y restrínge el acceso al usuario de la [IP] dada del servidor',
                    '\n\t-aip: Elimina al usuario de la [IP] dada de la lista negra del servidor',
                    '\n\t-s: Elimina a todos los usuarios conectados y apaga el servidor',
                    '\n\t-a: Mostrar lista de comandos\n',
                )
                break;
            default: console.log('El comando no existe')
                break;
        }
    })
})