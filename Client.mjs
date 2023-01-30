import net from 'net'

const port = 3000
const host = "127.0.0.1"

const client = new net.Socket()

client.connect(port, host)

client.on('data', (data) => {
    console.log(data.toString().trim())
})

client.on('connect', () => {
    process.stdin.on('data', (data) => {
        client.write(data.toString().trim())
    })

})

client.on('error', (err) => {
    if (err.errno == -4077) {
        console.log("Se ha perdido comunicación con el servidor")
    } else {
        console.error(err)
    }
    process.exit(0)
})