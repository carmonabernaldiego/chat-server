import net from 'net'

const server = net.createServer()
const users = []

const port = 3000
const host = "127.0.0.1"

server.on('connection', (client) => {
    users.push(client)
    console.log(`${client.remoteAddress} conectado`)

    client.on('data', (data) => {
        const remitente = client.remoteAddress
        const mensaje = data.toString().trim()
        users.map((un_usuario) => {
            un_usuario.write(remitente + ":" + mensaje)
        })

        console.log(remitente + ":" + mensaje)
    })

    client.on('close', () => {
        users.map((un_usuario) => {
            un_usuario.write(client.remoteAddress + " ha salido del servidor")
        })
    })

    client.on('error', (err) => {
        if (err.errno == -4077) {
            users.map((un_usuario) => {
                un_usuario.write(client.remoteAddress + " ha salido del servidor")
            })
            console.log(client.remoteAddress + " ha salido del servidor")
        } else {
            console.error(err)
        }
    })
})

server.on('error', (err) => {
    console.log(err)
})

server.listen(port, host, () => {
    console.log("Servidor a la escucha")
})