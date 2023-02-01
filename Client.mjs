import net from 'net'

//  Configuración del servidor
const port = 3000
const host = "192.168.89.233"
//  Socket que se conecta con el servidor
const client = new net.Socket()

//  Realizamos la conexión
client.connect(port, host)

//  Se ejecuta solo si la conexión fue exitosa con el servidor
client.on('connect', () => {
    process.stdin.on('data', (data) => {
        //  Se convierte el mensaje de Buffer a String
        client.write(data.toString().trim())
    })
})
//  Se ejecuta cuando recibe información
client.on('data', (data) => {
    //  Se convierte el mensaje de Buffer a String
    let message = data.toString().trim()
    console.log(message)
})

//  Con esta función finalizamos el programa.
client.on('close', () => {
    console.log("Sesión finalizada")
    process.exit(0)
})

//  Evitamos errores
client.on('error', (err) => {
    console.log("Error: ¡Ups! Parece que hay un problema con su conexión")
})